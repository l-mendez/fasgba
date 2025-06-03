"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

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
  type: 'user' | 'custom' | 'anonymous';
  value: string;
}

interface UserDetails {
  id: string;
  name: string;
  surname: string;
  profile_picture?: string | null;
}

interface ChessGameBlockProps {
  fen: string;
  pgn?: string;
  whitePlayer?: PlayerInfo;
  blackPlayer?: PlayerInfo;
}

export default function ChessGameBlock({ 
  fen, 
  pgn,
  whitePlayer,
  blackPlayer
}: ChessGameBlockProps) {
  const [currentFen, setCurrentFen] = useState(fen);
  const [whitePlayerDetails, setWhitePlayerDetails] = useState<UserDetails | null>(null);
  const [blackPlayerDetails, setBlackPlayerDetails] = useState<UserDetails | null>(null);
  const [isLoadingWhitePlayer, setIsLoadingWhitePlayer] = useState(false);
  const [isLoadingBlackPlayer, setIsLoadingBlackPlayer] = useState(false);
  
  // Handler to receive FEN updates from the ChessBoard component
  const handlePositionChange = (newFen: string) => {
    setCurrentFen(newFen);
  };
  
  // Fetch user details if the player is a user
  useEffect(() => {
    async function fetchUserDetails(playerId: string, setPlayerDetails: React.Dispatch<React.SetStateAction<UserDetails | null>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('users')
          .select('id, name, surname, profile_picture')
          .eq('id', playerId)
          .single();
        
        if (error) {
          console.error('Error fetching user details:', error);
          return;
        }
        
        if (data) {
          setPlayerDetails({
            id: data.id,
            name: data.name,
            surname: data.surname,
            profile_picture: data.profile_picture
          });
        }
      } catch (err) {
        console.error('Error in fetchUserDetails:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch white player details if it's a user
    if (whitePlayer?.type === 'user' && whitePlayer.value) {
      fetchUserDetails(
        whitePlayer.value, 
        setWhitePlayerDetails,
        setIsLoadingWhitePlayer
      );
    }
    
    // Fetch black player details if it's a user
    if (blackPlayer?.type === 'user' && blackPlayer.value) {
      fetchUserDetails(
        blackPlayer.value, 
        setBlackPlayerDetails,
        setIsLoadingBlackPlayer
      );
    }
  }, [whitePlayer, blackPlayer]);
  
  // Format player name based on type
  const formatPlayerName = (player?: PlayerInfo, playerDetails?: UserDetails | null, isLoading?: boolean) => {
    if (isLoading) {
      return <span className="text-muted-foreground animate-pulse">Cargando...</span>;
    }
    
    if (!player) return "Jugador";
    
    switch (player.type) {
      case 'user':
        if (playerDetails) {
          return (
            <Link 
              href={`/jugadores/${playerDetails.id}`} 
              className="text-amber-dark hover:underline"
            >
              {`${playerDetails.name} ${playerDetails.surname}`}
            </Link>
          );
        }
        return player.value ? `Usuario ${player.value}` : "Jugador";
      case 'custom':
        return player.value || "Jugador";
      case 'anonymous':
        return "Jugador anónimo";
      default:
        return "Jugador";
    }
  };

  const whitePlayerElement = formatPlayerName(whitePlayer, whitePlayerDetails, isLoadingWhitePlayer);
  const blackPlayerElement = formatPlayerName(blackPlayer, blackPlayerDetails, isLoadingBlackPlayer);
  const hasPlayerInfo = whitePlayer || blackPlayer;
  
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
    <div className="my-4 sm:my-6 p-3 sm:p-4 md:p-6 bg-muted/30 rounded-lg border border-amber/10">
      {hasPlayerInfo && (
        <div className="mb-3 sm:mb-4 pb-3 border-b border-amber/20">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center justify-center sm:justify-start">
              <div className="w-3 h-3 bg-white border border-gray-400 rounded-full mr-2 flex-shrink-0"></div>
              <div className="text-sm sm:text-base font-medium text-center sm:text-left">
                {whitePlayerElement}
              </div>
            </div>
            
            <div className="text-xs sm:text-sm text-muted-foreground text-center font-medium">
              vs
            </div>
            
            <div className="flex items-center justify-center sm:justify-end">
              <div className="text-sm sm:text-base font-medium text-center sm:text-right">
                {blackPlayerElement}
              </div>
              <div className="w-3 h-3 bg-black border border-gray-400 rounded-full ml-2 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-center">
        <ChessBoard 
          fen={fen} 
          pgn={pgn} 
          onPositionChange={handlePositionChange}
          width={400}
        />
      </div>
      
      {pgn && (
        <details className="mt-3 sm:mt-4">
          <summary className="cursor-pointer text-amber-dark hover:underline text-sm sm:text-base font-medium">
            Ver notación PGN
          </summary>
          <pre className="mt-2 p-3 bg-background/50 rounded border border-amber/20 overflow-x-auto text-xs sm:text-sm font-mono">
            {pgn}
          </pre>
        </details>
      )}
    </div>
  )
} 