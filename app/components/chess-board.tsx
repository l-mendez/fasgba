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
    <div className="w-full h-[300px] bg-muted/50 animate-pulse flex items-center justify-center">
      Cargando tablero...
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
  width = 500,
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
      // Make the board responsive
      const containerWidth = window.innerWidth;
      if (containerWidth < 600) {
        setBoardWidth(Math.min(containerWidth - 40, width));
      } else {
        setBoardWidth(width);
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
      <div className="w-full h-[300px] bg-muted/50 animate-pulse flex items-center justify-center">
        Cargando tablero...
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      <div style={{ maxWidth: '100%', width: boardWidth }}>
        {isReady && (
          <ReactChessboard 
            position={currentPosition} 
            boardWidth={boardWidth}
            areArrowsAllowed={true}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}
          />
        )}
      </div>
      
      {pgn && moves.length > 0 && (
        <div className="mt-4 flex justify-center space-x-2">
          <button 
            onClick={goToStart}
            className="px-2 py-1 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm"
            disabled={moveIndex === 0}
          >
            «
          </button>
          <button 
            onClick={goToPrevMove}
            className="px-2 py-1 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm"
            disabled={moveIndex === 0}
          >
            ‹
          </button>
          <span className="px-2 py-1 bg-muted rounded text-sm">
            {moveIndex} / {moves.length}
          </span>
          <button 
            onClick={goToNextMove}
            className="px-2 py-1 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm"
            disabled={moveIndex === moves.length}
          >
            ›
          </button>
          <button 
            onClick={goToEnd}
            className="px-2 py-1 bg-amber/20 hover:bg-amber/30 rounded text-amber-dark text-sm"
            disabled={moveIndex === moves.length}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
} 