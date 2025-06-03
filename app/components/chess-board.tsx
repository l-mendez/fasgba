"use client"

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

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
}

export default function ChessBoard({ 
  fen, 
  pgn, 
  width = 400,
  onPositionChange 
}: ChessBoardProps) {
  const [currentPosition, setCurrentPosition] = useState(fen)
  const [moveIndex, setMoveIndex] = useState(0)
  const [moves, setMoves] = useState<any[]>([])
  const [isReady, setIsReady] = useState(false)
  const gameRef = useRef<any>(null)
  
  // Notify parent when position changes
  useEffect(() => {
    if (onPositionChange && isReady) {
      onPositionChange(currentPosition);
    }
  }, [currentPosition, onPositionChange, isReady]);
  
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
        
        // If there's a PGN, load it and extract moves
        if (pgn) {
          try {
            newGame.loadPgn(pgn);
            
            // Get the history of moves
            const history = newGame.history({ verbose: true });
            
            // Store the full move objects
            setMoves(history);
            
            // Reset to initial position
            newGame.reset();
            newGame.load(fen);
          } catch (e) {
            console.error("Error loading PGN:", e);
          }
        }
        
        setCurrentPosition(fen);
        setMoveIndex(0);
        setIsReady(true);
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
        newGame.move(moves[i]);
      }
      
      // Update the current position
      const newPosition = newGame.fen();
      setCurrentPosition(newPosition);
      setMoveIndex(move);
      gameRef.current = newGame;
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
  
  // Go to first move
  const goToStart = () => {
    handleMove(0);
  };
  
  // Go to last move
  const goToEnd = () => {
    handleMove(moves.length);
  };
  
  // Calculate responsive width
  const [boardWidth, setBoardWidth] = useState(width);
  
  useEffect(() => {
    const updateWidth = () => {
      // Make the board responsive with better mobile sizing
      const containerWidth = window.innerWidth;
      const availableWidth = containerWidth - 32; // Account for padding
      
      if (containerWidth < 480) {
        // Extra small screens (phones in portrait)
        setBoardWidth(Math.min(availableWidth, 300));
      } else if (containerWidth < 640) {
        // Small screens (phones in landscape)
        setBoardWidth(Math.min(availableWidth, 350));
      } else if (containerWidth < 768) {
        // Medium screens (small tablets)
        setBoardWidth(Math.min(availableWidth, 400));
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
    <div className="flex flex-col items-center w-full">
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
      
      {pgn && moves.length > 0 && (
        <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-1 sm:gap-2 px-2">
          <button 
            onClick={goToStart}
            className="px-3 py-2 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm font-medium min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={moveIndex === 0}
            title="Ir al inicio"
          >
            «
          </button>
          <button 
            onClick={goToPrevMove}
            className="px-3 py-2 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm font-medium min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={moveIndex === 0}
            title="Movimiento anterior"
          >
            ‹
          </button>
          <span className="px-3 py-2 bg-muted rounded text-sm font-medium min-w-[60px] text-center">
            {moveIndex} / {moves.length}
          </span>
          <button 
            onClick={goToNextMove}
            className="px-3 py-2 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm font-medium min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={moveIndex === moves.length}
            title="Siguiente movimiento"
          >
            ›
          </button>
          <button 
            onClick={goToEnd}
            className="px-3 py-2 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm font-medium min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={moveIndex === moves.length}
            title="Ir al final"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
} 