"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

// Simple placeholder loader
const ChessBoardLoader = () => (
  <div className="w-full h-[250px] sm:h-[300px] bg-muted/50 animate-pulse flex items-center justify-center rounded-lg">
    <span className="text-muted-foreground text-sm">Cargando tablero...</span>
  </div>
);

// Import ChessBoard with dynamic import to avoid SSR issues
const ChessBoard = dynamic(() => import('@/app/components/chess-board'), { 
  ssr: false,
  loading: () => <ChessBoardLoader />
});

interface PlayerInfo {
  type: 'custom' | 'anonymous';
  value: string;
}

interface ChessGameBlockProps {
  fen: string;
  pgn?: string;
  whitePlayer?: PlayerInfo;
  blackPlayer?: PlayerInfo;
  result?: string;
}

export default function ChessGameBlock({ 
  fen, 
  pgn,
  whitePlayer,
  blackPlayer,
  result
}: ChessGameBlockProps) {
  const [currentFen, setCurrentFen] = useState(fen);
  const [isCopied, setIsCopied] = useState(false);
  
  // Handler to receive FEN updates from the ChessBoard component
  const handlePositionChange = (newFen: string) => {
    setCurrentFen(newFen);
  };
  
  // Handler to copy PGN to clipboard
  const handleCopyPGN = async () => {
    if (!pgn) return;
    
    try {
      await navigator.clipboard.writeText(pgn);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy PGN:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pgn;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };
  
  // Create the Lichess analysis URL
  const getLichessUrl = () => {
    // If we have PGN, use that for the full game analysis
    if (pgn) {
      return `https://lichess.org/analysis?pgn=${encodeURIComponent(pgn)}`;
    }
    // Otherwise just use the current position FEN
    return `https://lichess.org/analysis/${encodeURIComponent(currentFen)}`;
  };
  
  return (
    <div className="my-4 sm:my-6 p-3 sm:p-4 md:p-6 bg-muted/30 dark:bg-muted/40 rounded-lg border border-amber/10 dark:border-amber/20">
      <div className="flex justify-center">
        <ChessBoard 
          fen={fen} 
          pgn={pgn} 
          onPositionChange={handlePositionChange}
          whitePlayer={whitePlayer}
          blackPlayer={blackPlayer}
          result={result}
          width={400}
        />
      </div>
      
      {pgn && (
        <div className="mt-3 sm:mt-4 flex justify-center">
          <Button
            onClick={handleCopyPGN}
            variant="outline"
            size="sm"
            className="border-amber text-amber-dark dark:text-amber-200 hover:bg-amber/10 dark:hover:bg-amber/20 hover:text-amber-dark dark:hover:text-amber-100 transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar PGN
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 
