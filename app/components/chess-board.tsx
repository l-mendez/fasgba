"use client"

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parse } from '@mliebelt/pgn-parser'

// Dynamically import chess.js to avoid SSR issues
// Using a simpler import approach
let Chess: any;
if (typeof window !== 'undefined') {
  import('chess.js').then((module) => {
    Chess = module.Chess;
  });
}

// Dynamically import Chessboard
const ReactChessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] sm:h-[300px] bg-muted/50 animate-pulse flex items-center justify-center rounded-lg">
      <span className="text-muted-foreground text-sm">Cargando tablero...</span>
    </div>
  )
})

interface ChessBoardProps {
  fen: string
  pgn?: string
  width?: number
  onPositionChange?: (fen: string) => void
  whitePlayer?: { type: string; value: string }
  blackPlayer?: { type: string; value: string }
  result?: string
}

interface MoveAnnotation {
  eval?: number
  clock?: string
  comment?: string
}

interface EnhancedMove {
  san: string
  moveNumber: number
  color: 'w' | 'b'
  annotation?: MoveAnnotation
  from: string
  to: string
  piece: string
}

// Function to parse PGN using @mliebelt/pgn-parser
function parsePGNWithLibrary(pgn: string): { moves: any[], cleanPgn: string } {
  try {
    // Parse the PGN using the library with all features enabled
    const parsed = parse(pgn, { 
      startRule: "game"
    }) as any;
    
    // Extract clean PGN by rebuilding from parsed data
    let cleanPgn = '';
    
    // Add tags
    if (parsed.tags) {
      Object.entries(parsed.tags).forEach(([key, value]) => {
        cleanPgn += `[${key} "${value}"]\n`;
      });
      cleanPgn += '\n';
    }
    
    // Add moves
    if (parsed.moves && parsed.moves.length > 0) {
      let moveText = '';
      parsed.moves.forEach((move: any, index: number) => {
        // Add move number for white moves
        if (move.turn === 'w') {
          moveText += `${move.moveNumber}. `;
        }
        
        // Add the move notation
        const notation = move.notation?.notation || move.san || move.move || '';
        moveText += notation;
        
        // Add space after move
        moveText += ' ';
        
        // Add line break every few moves for readability
        if ((index + 1) % 6 === 0) {
          moveText += '\n';
        }
      });
      cleanPgn += moveText.trim();
    }
    
    return { moves: parsed.moves || [], cleanPgn };
  } catch (error) {
    console.error("Error parsing PGN with library:", error);
    
    // Try a simpler parse without options
    try {
      const simpleParsed = parse(pgn, { startRule: "game" }) as any;
      return { moves: simpleParsed.moves || [], cleanPgn: pgn };
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
      return { moves: [], cleanPgn: pgn };
    }
  }
}

// Function to format clock time
function formatClockTime(timeStr: string): string {
  if (!timeStr) return '';
  
  // Handle different time formats
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      // Format: H:MM:SS
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return timeStr;
}

// Function to get player name
function getPlayerName(player?: { type: string; value: string }): string {
  if (!player) return "Jugador";
  
  switch (player.type) {
    case 'custom':
      return player.value || "Jugador";
    case 'anonymous':
      return "Jugador anónimo";
    default:
      return player.value || "Jugador";
  }
}

// Evaluation bar: hidden until the PGN provides an evaluation.
const EvaluationBar = ({ evaluation, height }: { evaluation?: number, height: number }) => {
  if (evaluation === undefined) return null;

  // Ensure evaluation is a number (handle both number and string inputs)
  const numericEval = typeof evaluation === 'string' ? parseFloat(evaluation) : evaluation;
  if (isNaN(numericEval)) return null;

  // Check for mate positions (encoded as 1000 + moves or -1000 - moves)
  const isMatePosition = Math.abs(numericEval) >= 1000;
  let displayText: string;
  let percentage: number;

  if (isMatePosition) {
    // For mate positions, extract moves to mate
    const movesToMate = Math.abs(numericEval) - 1000;
    displayText = `#${movesToMate}`;
    percentage = numericEval > 0 ? 100 : 0; // Full white or full black
  } else {
    // Regular evaluation - convert to percentage (capped between -5 and +5)
    const cappedEval = Math.max(-5, Math.min(5, numericEval));
    percentage = ((cappedEval + 5) / 10) * 100;
    displayText = numericEval > 0 ? `+${numericEval.toFixed(1)}` : numericEval.toFixed(1);
  }

  return (
    <div
      className="relative ml-2 w-3 shrink-0 overflow-hidden rounded-sm border bg-black"
      style={{ height }}
      title={`Evaluación: ${displayText}`}
    >
      {/* White advantage area (from bottom) */}
      <div
        className="absolute bottom-0 w-full bg-white transition-all duration-500 ease-in-out"
        style={{ height: `${percentage}%` }}
      />
      {/* Center line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground" />
      {/* Evaluation text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="-rotate-90 whitespace-nowrap rounded bg-black/70 px-1 text-xs text-white">
          {displayText}
        </div>
      </div>
    </div>
  );
};

// Player Info Component
const PlayerInfo = ({ 
  player, 
  color, 
  clockTime, 
  isCurrentPlayer,
  result
}: { 
  player?: { type: string; value: string }
  color: 'white' | 'black'
  clockTime?: string
  isCurrentPlayer?: boolean
  result?: string
}) => {
  const playerName = getPlayerName(player);
  
  // Determine what score to show for this player
  const getPlayerScore = () => {
    if (!result || result === '*') return null;
    
    if (result === '1/2-1/2') return '½';
    
    // For decisive results, show 1 for winner and 0 for loser
    if (result === '1-0') {
      return color === 'white' ? '1' : '0';
    }
    
    if (result === '0-1') {
      return color === 'black' ? '1' : '0';
    }
    
    return null;
  };

  const playerScore = getPlayerScore();
  
  return (
    <div className={`flex items-center justify-between p-2 rounded ${
      isCurrentPlayer ? 'bg-amber/20 dark:bg-amber/30' : 'bg-muted'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full border-2 border-muted-foreground ${
          color === 'white' ? 'bg-white' : 'bg-black'
        }`} />
        <span className="font-medium text-sm text-foreground">{playerName}</span>
        {playerScore !== null && (
          <span className="text-sm font-semibold text-terracotta ml-2">
            {playerScore}
          </span>
        )}
      </div>
      {clockTime && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{formatClockTime(clockTime)}</span>
        </div>
      )}
    </div>
  );
};

export default function ChessBoard({ 
  fen, 
  pgn, 
  width = 400,
  onPositionChange,
  whitePlayer,
  blackPlayer,
  result
}: ChessBoardProps) {
  const [currentPosition, setCurrentPosition] = useState(fen)
  const [moveIndex, setMoveIndex] = useState(0)
  const [moves, setMoves] = useState<EnhancedMove[]>([])
  const [isReady, setIsReady] = useState(false)
  const [currentEvaluation, setCurrentEvaluation] = useState<number | undefined>(undefined)
  const [currentWhiteClock, setCurrentWhiteClock] = useState<string | undefined>(undefined)
  const [currentBlackClock, setCurrentBlackClock] = useState<string | undefined>(undefined)
  const [currentToMove, setCurrentToMove] = useState<'w' | 'b'>('w')
  const gameRef = useRef<any>(null)
  
  // Notify parent when position changes
  useEffect(() => {
    if (onPositionChange && isReady) {
      onPositionChange(currentPosition);
    }
  }, [currentPosition, onPositionChange, isReady]);
  
  // Update current move information
  useEffect(() => {
    if (moves.length > 0 && moveIndex > 0) {
      const currentMove = moves[moveIndex - 1];
      
      if (currentMove?.annotation) {
        // Only update evaluation if it exists in the annotation
        if (currentMove.annotation.eval !== undefined) {
          setCurrentEvaluation(currentMove.annotation.eval);
        }
        // If no eval in annotation, keep previous evaluation
        
        // Set clock time based on the color that just moved
        if (currentMove.color === 'w') {
          setCurrentWhiteClock(currentMove.annotation.clock);
        } else {
          setCurrentBlackClock(currentMove.annotation.clock);
        }
      }
      // If no annotation at all, keep previous evaluation and don't update clocks
    } else {
      // Only reset evaluation at the very beginning (moveIndex = 0)
      setCurrentEvaluation(undefined);
      setCurrentWhiteClock(undefined);
      setCurrentBlackClock(undefined);
    }
    
    // Update whose turn it is
    if (gameRef.current) {
      const turn = gameRef.current.turn();
      setCurrentToMove(turn);
    }
  }, [moveIndex, moves]);
  
  useEffect(() => {
    // Wait for Chess to be loaded
    const initChess = async () => {
      if (!Chess) {
        const module = await import('chess.js');
        Chess = module.Chess;
      }
      
      try {
        // Initialize the game with the FEN position
        const newGame = new Chess(fen);
        gameRef.current = newGame;
        
        // If there's a PGN, load it and extract moves with annotations
        if (pgn) {
          try {
            // Parse PGN to extract annotations
            const { moves, cleanPgn } = parsePGNWithLibrary(pgn);
            
            // Load the clean PGN
            newGame.loadPgn(cleanPgn);
            
            // Get the history of moves
            const history = newGame.history({ verbose: true });
            
            // Create enhanced moves with annotations
            const enhancedMoves: EnhancedMove[] = history.map((move: any, index: number) => {
              const moveNumber = Math.floor(index / 2) + 1;
              const color = index % 2 === 0 ? 'w' : 'b';
              
              // Find corresponding parsed move for annotations
              const parsedMove = moves[index];
              let annotation: MoveAnnotation | undefined = undefined;
              
              if (parsedMove) {
                annotation = {};
                
                // Check commentDiag for eval and clock data (this is where the library stores it)
                if (parsedMove.commentDiag) {
                  if (parsedMove.commentDiag.eval !== undefined) {
                    const evalString = String(parsedMove.commentDiag.eval);
                    
                    // Check if it's a mate annotation like "#16"
                    if (evalString.startsWith('#')) {
                      const mateValue = parseInt(evalString.substring(1));
                      if (!isNaN(mateValue)) {
                        // Store mate as special value: 1000 + moves for white mate, -1000 - moves for black mate
                        // We'll assume white mate for now, can be refined based on context
                        annotation.eval = 1000 + mateValue;
                      }
                    } else {
                      // Regular numeric evaluation
                      const evalValue = typeof parsedMove.commentDiag.eval === 'string' 
                        ? parseFloat(parsedMove.commentDiag.eval) 
                        : parsedMove.commentDiag.eval;
                      
                      if (!isNaN(evalValue)) {
                        annotation.eval = evalValue;
                      }
                    }
                  }
                  if (parsedMove.commentDiag.clk !== undefined) {
                    annotation.clock = parsedMove.commentDiag.clk;
                  }
                }
                
                // Check different possible comment properties for text comments
                const commentSources = [
                  parsedMove.commentAfter,
                  parsedMove.commentBefore, 
                  parsedMove.comment,
                  parsedMove.commentMove
                ].filter(Boolean);
                
                // Process all comment sources for text comments
                commentSources.forEach(commentText => {
                  if (typeof commentText === 'string') {
                    // Parse general comments (text that's not eval or clk)
                    let generalComment = commentText
                      .replace(/\[%eval[^\]]+\]/g, '')
                      .replace(/\[%clk[^\]]+\]/g, '')
                      .trim();
                    
                    // Remove extra braces that might be left
                    generalComment = generalComment.replace(/^\{\s*|\s*\}$/g, '').trim();
                    
                    if (generalComment && !annotation!.comment) {
                      annotation!.comment = generalComment;
                    }
                  }
                });
                
                // If no annotation data was found, set to undefined
                if (Object.keys(annotation).length === 0) {
                  annotation = undefined;
                }
              }
              
              return {
                san: move.san,
                moveNumber,
                color,
                annotation,
                from: move.from,
                to: move.to,
                piece: move.piece
              };
            });
            
            setMoves(enhancedMoves);
            
            // Reset to initial position
            newGame.reset();
            newGame.load(fen);
          } catch (e) {
            console.error("Error loading PGN with annotations:", e);
            
            // Fallback to basic PGN loading
            try {
              const fallbackGame = new Chess(fen);
              fallbackGame.loadPgn(pgn);
              const history = fallbackGame.history({ verbose: true });
              const basicMoves: EnhancedMove[] = history.map((move: any, index: number) => ({
                san: move.san,
                moveNumber: Math.floor(index / 2) + 1,
                color: index % 2 === 0 ? 'w' : 'b',
                from: move.from,
                to: move.to,
                piece: move.piece
              }));
              setMoves(basicMoves);
              newGame.reset();
              newGame.load(fen);
            } catch (fallbackError) {
              console.error("Fallback PGN loading failed:", fallbackError);
              setMoves([]);
            }
          }
        }
        
        setCurrentPosition(fen);
        setMoveIndex(0);
        setIsReady(true);
        setCurrentToMove(newGame.turn());
      } catch (e) {
        console.error("Error initializing chess board:", e);
        // Fallback to default starting position if FEN is invalid
        setCurrentPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setIsReady(true);
      }
    };
    
    initChess();
  }, [fen, pgn]);
  
  // Function to make a move
  const handleMove = async (move: number) => {
    // chess.js is already loaded by initChess; import() is the cached fallback.
    const ChessClass = Chess ?? (await import('chess.js')).Chess;

    try {
      // Create a new game from the initial position
      const newGame = new ChessClass(fen);
      
      // Apply moves up to the specified index
      for (let i = 0; i < move && i < moves.length; i++) {
        try {
          const moveResult = newGame.move(moves[i].san);
          if (!moveResult) {
            console.error(`Failed to apply move ${i}: ${moves[i].san}`);
            console.error('Current position FEN:', newGame.fen());
            console.error('Available moves:', newGame.moves());
            throw new Error(`Invalid move: ${moves[i].san}`);
          }
        } catch (moveError) {
          console.error(`Error applying move ${i}: ${moves[i].san}`, moveError);
          console.error('Current position FEN:', newGame.fen());
          console.error('Available moves:', newGame.moves());
          // Stop applying moves on error but don't crash the whole component
          break;
        }
      }
      
      // Update the current position
      const newPosition = newGame.fen();
      setCurrentPosition(newPosition);
      setMoveIndex(move);
      gameRef.current = newGame;
      setCurrentToMove(newGame.turn());
    } catch (e) {
      console.error("Error in handleMove:", e);
    }
  };
  
  // Arrow keys / Home / End navigate while the viewer has focus.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target: Record<string, number> = {
      ArrowLeft: moveIndex - 1,
      ArrowRight: moveIndex + 1,
      Home: 0,
      End: moves.length,
    };
    if (!(e.key in target) || moves.length === 0) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(moves.length, target[e.key]));
    if (next !== moveIndex) handleMove(next);
  };
  
  // Calculate responsive width
  const [boardWidth, setBoardWidth] = useState(width);
  
  useEffect(() => {
    const updateWidth = () => {
      // Make the board responsive with better mobile sizing
      // Account for evaluation bar (width ~12px + margin ~8px = ~20px) and general padding
      const containerWidth = window.innerWidth;
      const evalBarSpace = 20; // Space for eval bar
      const availableWidth = containerWidth - 64 - evalBarSpace; // Account for padding and eval bar
      
      if (containerWidth < 480) {
        // Extra small screens (phones in portrait)
        setBoardWidth(Math.min(availableWidth, 260));
      } else if (containerWidth < 640) {
        // Small screens (phones in landscape)
        setBoardWidth(Math.min(availableWidth, 300));
      } else if (containerWidth < 768) {
        // Medium screens (small tablets)
        setBoardWidth(Math.min(availableWidth, 340));
      } else {
        // Large screens
        setBoardWidth(Math.min(availableWidth, width));
      }
    };
    
    // Set initial width
    updateWidth();
    
    // Add resize listener
    window.addEventListener('resize', updateWidth);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateWidth);
  }, [width]);
  
  if (!isReady) {
    return (
      <div className="w-full h-[250px] sm:h-[300px] bg-muted/50 animate-pulse flex items-center justify-center rounded-lg">
        <span className="text-muted-foreground text-sm">Cargando tablero...</span>
      </div>
    );
  }
  
  const hasMoves = Boolean(pgn) && moves.length > 0;
  const navButton = (target: number, disabled: boolean, label: string, Icon: typeof ChevronLeft) => (
    <Button variant="outline" size="icon" onClick={() => handleMove(target)} disabled={disabled} aria-label={label} title={label}>
      <Icon />
    </Button>
  );

  return (
    <div
      className="flex max-w-full flex-col items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      tabIndex={hasMoves ? 0 : undefined}
      onKeyDown={hasMoves ? handleKeyDown : undefined}
      role="group"
      aria-label="Visor de partida"
      aria-keyshortcuts={hasMoves ? 'ArrowLeft ArrowRight Home End' : undefined}
    >
      {/* Player bars match the board width */}
      <div className="mb-2 max-w-full" style={{ width: boardWidth }}>
        <PlayerInfo
          player={blackPlayer}
          color="black"
          clockTime={currentBlackClock}
          isCurrentPlayer={currentToMove === 'b'}
          result={result}
        />
      </div>

      <div className="flex items-center">
        <div className="max-w-full overflow-hidden" style={{ width: boardWidth }}>
          <ReactChessboard
            options={{
              position: currentPosition,
              allowDrawingArrows: true,
              boardStyle: {
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                width: `${boardWidth}px`,
                height: `${boardWidth}px`,
              },
            }}
          />
        </div>
        <EvaluationBar evaluation={currentEvaluation} height={boardWidth} />
      </div>

      <div className="mt-2 max-w-full" style={{ width: boardWidth }}>
        <PlayerInfo
          player={whitePlayer}
          color="white"
          clockTime={currentWhiteClock}
          isCurrentPlayer={currentToMove === 'w'}
          result={result}
        />
      </div>

      {hasMoves && (
        <div className="mt-3 flex items-center gap-2">
          {navButton(0, moveIndex === 0, 'Inicio de la partida', ChevronsLeft)}
          {navButton(moveIndex - 1, moveIndex === 0, 'Movimiento anterior', ChevronLeft)}
          <span className="min-w-[80px] rounded-md bg-muted px-3 py-2 text-center text-sm font-medium" aria-live="polite">
            {moveIndex > 0 && moves[moveIndex - 1] ? (
              <>
                {moves[moveIndex - 1].moveNumber}
                {moves[moveIndex - 1].color === 'b' ? '...' : '.'}
                {moves[moveIndex - 1].san}
              </>
            ) : (
              'Inicio'
            )}
          </span>
          {navButton(moveIndex + 1, moveIndex === moves.length, 'Siguiente movimiento', ChevronRight)}
          {navButton(moves.length, moveIndex === moves.length, 'Final de la partida', ChevronsRight)}
        </div>
      )}
    </div>
  );
} 