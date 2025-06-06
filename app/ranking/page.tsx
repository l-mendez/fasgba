import { Suspense } from "react";
import { Search } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PlayerList } from "@/app/ranking/components/PlayerList"
import { getPlayers, getAvailableRankings, type PaginatedPlayersResponse } from "@/lib/rankingUtils"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Generate metadata for better link previews
export const metadata: Metadata = {
  title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
  description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur de Buenos Aires. Rankings actualizados con estadísticas completas.',
  keywords: ['FASGBA', 'ranking', 'ajedrez', 'clasificación', 'jugadores', 'federación', 'Buenos Aires'],
  openGraph: {
    title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
    description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur de Buenos Aires. Rankings actualizados con estadísticas completas.',
    url: 'https://fasgba.org/ranking',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.org/images/fasgba-logo.png',
        width: 1200,
        height: 630,
        alt: 'Ranking FASGBA',
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
    description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur de Buenos Aires.',
    images: ['https://fasgba.org/images/fasgba-logo.png'],
    creator: '@FASGBA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Define interfaces for the data we're working with
export interface Player {
  position: number;
  name: string;
  club: string;
  points: number;
  matches: number;
  changes?: {
    position: number | null; // positive = moved up, negative = moved down, null = new player
    points: number; // positive = gained points, negative = lost points
    isNew: boolean; // true if player wasn't in previous ranking
  };
}

interface ApiResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentRanking?: string;
  availableRankings?: Array<{filename: string, displayName: string, month: number, year: number, date: Date}>;
}

// Get players directly from rankingUtils instead of making HTTP call
async function getPlayersData(page: number = 1, pageSize: number = 50, search: string = '', ranking?: string): Promise<ApiResponse> {
  try {
    // Clear cache if a specific ranking is requested to ensure fresh data
    if (ranking) {
      const { clearRankingCache } = await import('@/lib/rankingUtils');
      clearRankingCache();
    }
    
    const [data, availableRankings]: [PaginatedPlayersResponse, Array<{filename: string, displayName: string, month: number, year: number, date: Date}>] = await Promise.all([
      getPlayers(page, pageSize, search, ranking),
      getAvailableRankings()
    ]);
    
    return {
      ...data,
      currentRanking: ranking || (availableRankings.length > 0 ? availableRankings[0].filename : undefined),
      availableRankings
    };
  } catch (error) {
    console.error('Error fetching players:', error);
    throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function LoadingState() {
  return (
    <div className="container px-4 md:px-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded-md w-full max-w-md mx-auto" />
        <div className="h-96 bg-muted rounded-md w-full" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="container px-4 md:px-6">
      <div className="rounded-md bg-red-50 p-6 text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error de conexión</h3>
        <p className="text-red-700">{message}</p>
      </div>
    </div>
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; ranking?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/ranking" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ranking FASGBA</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Clasificación oficial de jugadores de la Federación de Ajedrez del Sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <Suspense fallback={<LoadingState />}>
            <RankingContent searchParams={searchParams} />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

async function RankingContent({ 
  searchParams,
}: { 
  searchParams: { page?: string; search?: string; ranking?: string };
}) {
  // Await the searchParams before using them
  const params = await Promise.resolve(searchParams);
  const page = parseInt(params.page || '1');
  const pageSize = 50;
  const search = params.search || '';
  const ranking = params.ranking || '';

  try {
    const data = await getPlayersData(page, pageSize, search, ranking || undefined);
    return <PlayerList 
      key={`${data.currentRanking || 'latest'}-${page}-${search}`}
      players={data.players} 
      currentPage={data.page}
      totalPages={data.totalPages}
      totalPlayers={data.total}
      currentRanking={data.currentRanking}
      availableRankings={data.availableRankings || []}
    />;
  } catch (error) {
    console.error("Error fetching players:", error);
    return <ErrorState message="Hubo un problema al cargar los datos del ranking. Por favor, intenta nuevamente más tarde." />;
  }
} 