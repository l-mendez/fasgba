"use client"

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'

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

// Function to parse PGN and extract annotations
function parsePGNWithAnnotations(pgn: string): { cleanPgn: string; moveAnnotations: Map<string, MoveAnnotation> } {
  const moveAnnotations = new Map<string, MoveAnnotation>();
  
  // Split PGN into lines and process moves
  const lines = pgn.split('\n');
  let cleanPgn = '';
  
  for (const line of lines) {
    // Skip header lines (those starting with [)
    if (line.trim().startsWith('[')) {
      cleanPgn += line + '\n';
      continue;
    }
    
    // Skip empty lines
    if (!line.trim()) {
      cleanPgn += line + '\n';
      continue;
    }
    
    // Process move lines
    let processedLine = line;
    
    // Find all annotations in curly braces and their positions
    const annotationRegex = /\{([^}]+)\}/g;
    let match;
    const annotations: Array<{ content: string; index: number; length: number }> = [];
    
    while ((match = annotationRegex.exec(line)) !== null) {
      annotations.push({
        content: match[1],
        index: match.index,
        length: match[0].length
      });
    }
    
    // Process each annotation
    annotations.forEach(ann => {
      const annotationContent = ann.content;
      const currentAnnotation: MoveAnnotation = {};
      
      // Parse evaluation
      const evalMatch = annotationContent.match(/\[%eval ([+-]?\d*\.?\d+)\]/);
      if (evalMatch) {
        currentAnnotation.eval = parseFloat(evalMatch[1]);
      }
      
      // Parse clock time
      const clockMatch = annotationContent.match(/\[%clk ([^\]]+)\]/);
      if (clockMatch) {
        currentAnnotation.clock = clockMatch[1];
      }
      
      // Parse comments (text that's not eval or clk)
      const commentText = annotationContent
        .replace(/\[%eval[^\]]+\]/g, '')
        .replace(/\[%clk[^\]]+\]/g, '')
        .trim();
      
      if (commentText) {
        currentAnnotation.comment = commentText;
      }
      
      // Find the move that comes before this annotation
      const beforeAnnotation = line.substring(0, ann.index);
      
      // Look for the last move in the text before the annotation
      const movePattern = /(\d+\.\.?\.?\s*(?:[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQK])?[+#]?|O-O(?:-O)?))(?:\s*)$/;
      const moveMatch = beforeAnnotation.match(movePattern);
      
      if (moveMatch && Object.keys(currentAnnotation).length > 0) {
        // Count how many moves are before this one in the entire PGN processed so far
        const allTextBeforeThisAnnotation = cleanPgn + beforeAnnotation;
        const allMovesBefore = allTextBeforeThisAnnotation.match(/\d+\.\.?\.?\s*(?:[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQK])?[+#]?|O-O(?:-O)?)/g) || [];
        const moveIndex = allMovesBefore.length - 1;
        
        if (moveIndex >= 0) {
          const moveKey = `move_${moveIndex}`;
          moveAnnotations.set(moveKey, currentAnnotation);
        }
      }
    });
    
    // Remove annotations from the line for clean PGN
    processedLine = processedLine.replace(/\{[^}]+\}/g, '').trim();
    
    if (processedLine.trim()) {
      cleanPgn += processedLine + '\n';
    }
  }
  
  return { cleanPgn: cleanPgn.trim(), moveAnnotations };
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

// Evaluation Bar Component
const EvaluationBar = ({ evaluation, className = "" }: { evaluation?: number, className?: string }) => {
  if (evaluation === undefined) {
    return (
      <div className={`w-3 bg-gray-300 rounded-sm ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  // Convert evaluation to percentage (capped between -5 and +5)
  const cappedEval = Math.max(-5, Math.min(5, evaluation));
  const percentage = ((cappedEval + 5) / 10) * 100;
  
  return (
    <div className={`w-3 bg-gray-800 rounded-sm relative overflow-hidden ${className}`}>
      <div 
        className="bg-white transition-all duration-500 ease-in-out w-full absolute bottom-0"
        style={{ height: `${percentage}%` }}
      />
      {/* Center line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-600 transform -translate-y-1/2" />
      {/* Evaluation text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/70 text-white text-xs px-1 rounded transform -rotate-90 whitespace-nowrap">
          {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
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
  isCurrentPlayer 
}: { 
  player?: { type: string; value: string }
  color: 'white' | 'black'
  clockTime?: string
  isCurrentPlayer?: boolean 
}) => {
  const playerName = getPlayerName(player);
  
  return (
    <div className={`flex items-center justify-between p-2 rounded ${
      isCurrentPlayer ? 'bg-amber/20' : 'bg-muted/50'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full border-2 ${
          color === 'white' ? 'bg-white border-gray-400' : 'bg-black border-gray-300'
        }`} />
        <span className="font-medium text-sm">{playerName}</span>
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
  blackPlayer
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
        setCurrentEvaluation(currentMove.annotation.eval);
        if (currentMove.color === 'w') {
          setCurrentWhiteClock(currentMove.annotation.clock);
        } else {
          setCurrentBlackClock(currentMove.annotation.clock);
        }
      }
    } else {
      setCurrentEvaluation(undefined);
      setCurrentWhiteClock(undefined);
      setCurrentBlackClock(undefined);
    }
    
    // Update whose turn it is
    if (gameRef.current) {
      setCurrentToMove(gameRef.current.turn());
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
            const { cleanPgn, moveAnnotations } = parsePGNWithAnnotations(pgn);
            
            // Load the clean PGN
            newGame.loadPgn(cleanPgn);
            
            // Get the history of moves
            const history = newGame.history({ verbose: true });
            
            // Create enhanced moves with annotations
            const enhancedMoves: EnhancedMove[] = history.map((move, index) => {
              const moveNumber = Math.floor(index / 2) + 1;
              const color = index % 2 === 0 ? 'w' : 'b';
              const moveKey = `move_${index}`;
              
              return {
                san: move.san,
                moveNumber,
                color,
                annotation: moveAnnotations.get(moveKey),
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
            console.error("Error loading PGN:", e);
            // Fallback to basic PGN loading
            try {
              newGame.loadPgn(pgn);
              const history = newGame.history({ verbose: true });
              const basicMoves: EnhancedMove[] = history.map((move, index) => ({
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
              console.error("Fallback PGN loading also failed:", fallbackError);
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
    if (!Chess) {
      const module = await import('chess.js');
      Chess = module.Chess;
    }
    
    try {
      // Create a new game from the initial position
      const newGame = new Chess(fen);
      
      // Apply moves up to the specified index
      for (let i = 0; i < move && i < moves.length; i++) {
        newGame.move(moves[i].san);
      }
      
      // Update the current position
      const newPosition = newGame.fen();
      setCurrentPosition(newPosition);
      setMoveIndex(move);
      gameRef.current = newGame;
      setCurrentToMove(newGame.turn());
    } catch (e) {
      console.error("Error making move:", e);
    }
  };
  
  // Go to next move
  const goToNextMove = () => {
    if (moveIndex < moves.length) {
      handleMove(moveIndex + 1);
    }
  };
  
  // Go to previous move
  const goToPrevMove = () => {
    if (moveIndex > 0) {
      handleMove(moveIndex - 1);
    }
  };
  
  // Calculate responsive width
  const [boardWidth, setBoardWidth] = useState(width);
  
  useEffect(() => {
    const updateWidth = () => {
      // Make the board responsive with better mobile sizing
      const containerWidth = window.innerWidth;
      const availableWidth = containerWidth - 64; // Account for padding and eval bar
      
      if (containerWidth < 480) {
        // Extra small screens (phones in portrait)
        setBoardWidth(Math.min(availableWidth, 280));
      } else if (containerWidth < 640) {
        // Small screens (phones in landscape)
        setBoardWidth(Math.min(availableWidth, 320));
      } else if (containerWidth < 768) {
        // Medium screens (small tablets)
        setBoardWidth(Math.min(availableWidth, 360));
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
  
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Black Player Info (Top) */}
      <div className="w-full mb-2">
        <PlayerInfo 
          player={blackPlayer}
          color="black"
          clockTime={currentBlackClock}
          isCurrentPlayer={currentToMove === 'b'}
        />
      </div>
      
      {/* Chess Board with Evaluation Bar */}
      <div className="flex items-center gap-2">
        {/* Evaluation Bar */}
        <div className="relative h-full">
          <EvaluationBar 
            evaluation={currentEvaluation} 
            className="h-[250px] sm:h-[300px] md:h-[360px]"
          />
        </div>
        
        {/* Chess Board */}
        <div className="max-w-full overflow-hidden" style={{ width: boardWidth }}>
          {isReady && (
            <ReactChessboard 
              position={currentPosition} 
              boardWidth={boardWidth}
              areArrowsAllowed={true}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            />
          )}
        </div>
      </div>
      
      {/* White Player Info (Bottom) */}
      <div className="w-full mt-2">
        <PlayerInfo 
          player={whitePlayer}
          color="white"
          clockTime={currentWhiteClock}
          isCurrentPlayer={currentToMove === 'w'}
        />
      </div>
      
      {/* Navigation Controls */}
      {pgn && moves.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <button 
            onClick={goToPrevMove}
            className="p-2 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={moveIndex === 0}
            title="Movimiento anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-3 py-2 bg-muted rounded text-sm font-medium min-w-[80px] text-center">
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
          
          <button 
            onClick={goToNextMove}
            className="p-2 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={moveIndex === moves.length}
            title="Siguiente movimiento"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
} 