"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

// Simple placeholder loader
const ChessBoardLoader = () => (
  <div className="w-full h-[300px] bg-muted/50 animate-pulse flex items-center justify-center">
    Cargando tablero...
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
    if (pgn && encodedPgn) {
      return `https://lichess.org/analysis?pgn=${encodedPgn}`;
    }
    // Otherwise just use the current position FEN
    return `https://lichess.org/analysis/${encodeURIComponent(currentFen)}`;
  };
  
  return (
    <div className="my-6 p-4 bg-muted rounded-md">
      {hasPlayerInfo && (
        <div className="mb-4 border-b pb-2">
          <div className="flex justify-between text-sm font-medium">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded-full mr-2"></div>
              <span>{whitePlayerElement}</span>
            </div>
            <div className="text-xs">vs</div>
            <div className="flex items-center">
              <span>{blackPlayerElement}</span>
              <div className="w-3 h-3 bg-black border border-gray-300 rounded-full ml-2"></div>
            </div>
          </div>
        </div>
      )}
      
      <ChessBoard 
        fen={fen} 
        pgn={pgn} 
        onPositionChange={handlePositionChange}
      />
      
      {pgn && (
        <details className="mt-4">
          <summary className="cursor-pointer text-amber-dark hover:underline">
            Ver notación PGN
          </summary>
          <pre className="mt-2 p-2 bg-background rounded border overflow-x-auto text-xs">
            {pgn}
          </pre>
        </details>
      )}
      {/* Temporarily disabled Lichess analysis button
      <p className="text-center text-sm mt-4">
        <Link 
          href={getLichessUrl()}
          target="_blank" 
          className="text-amber-dark hover:underline"
        >
          Analizar en Lichess
        </Link>
      </p>
      */}
    </div>
  )
} 