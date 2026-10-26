"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Button } from '@/components/ui/button'
import { Copy, Check, ExternalLink } from 'lucide-react'

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
    // Full game: Lichess reads the PGN from the path. Comments (clocks, evals)
    // are dropped to keep the URL short.
    if (pgn) {
      const compact = pgn.replace(/\{[^}]*\}/g, '').replace(/[ \t]+/g, ' ');
      return `https://lichess.org/analysis/pgn/${encodeURIComponent(compact)}`;
    }
    // Otherwise just the current position (Lichess expects `_` for spaces)
    return `https://lichess.org/analysis/${currentFen.replace(/ /g, '_')}`;
  };
  
  return (
    <div className="my-4 sm:my-6 p-3 sm:p-4 md:p-6 bg-card rounded-lg border">
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
      
      <div className="mt-3 sm:mt-4 flex justify-center gap-2">
        {pgn && (
          <Button onClick={handleCopyPGN} variant="outline" size="sm">
            {isCopied ? <Check /> : <Copy />}
            {isCopied ? '¡Copiado!' : 'Copiar PGN'}
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a href={getLichessUrl()} target="_blank" rel="noopener noreferrer" aria-label="Abrir en Lichess" title="Abrir en Lichess">
            <ExternalLink />
            Lichess
          </a>
        </Button>
      </div>
    </div>
  )
} 
