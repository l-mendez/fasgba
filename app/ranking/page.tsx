import { Suspense } from "react";
import { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PlayerList } from "@/app/ranking/components/PlayerList"
import {
  getPlayers,
  getAvailableRankings,
  type PaginatedPlayersResponse,
  type Player,
  type RatingType,
} from "@/lib/rankingUtils"

// Re-export Player type for any consumers
export type { Player }

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
  description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires. Rankings actualizados con estadísticas completas.',
  keywords: ['FASGBA', 'ranking', 'ajedrez', 'clasificación', 'jugadores', 'federación', 'Buenos Aires'],
  openGraph: {
    title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
    description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires. Rankings actualizados con estadísticas completas.',
    url: 'https://fasgba.com/ranking',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.com/images/fasgba-logo.png',
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
    description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires.',
    images: ['https://fasgba.com/images/fasgba-logo.png'],
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

interface ApiResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentRanking?: string;
  availableRankings?: Array<{filename: string, displayName: string, month: number, year: number, date: Date}>;
}

async function getPlayersData(
  page: number = 1,
  pageSize: number = 50,
  search: string = '',
  ranking?: string,
  activeFilter: 'active' | 'inactive' | 'all' = 'active',
  sortBy: RatingType = 'standard'
): Promise<ApiResponse> {
  try {
    if (ranking) {
      const { clearRankingCache } = await import('@/lib/rankingUtils');
      clearRankingCache();
    }

    const [data, availableRankings]: [PaginatedPlayersResponse, Array<{filename: string, displayName: string, month: number, year: number, date: Date}>] = await Promise.all([
      getPlayers(page, pageSize, search, ranking, activeFilter, sortBy),
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
  searchParams: { page?: string; search?: string; ranking?: string; active?: string; sortBy?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/ranking" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">Ranking FASGBA</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires
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
  searchParams: { page?: string; search?: string; ranking?: string; active?: string; sortBy?: string };
}) {
  const params = await Promise.resolve(searchParams);
  const page = parseInt(params.page || '1');
  const pageSize = 50;
  const search = params.search || '';
  const ranking = params.ranking || '';
  const activeParamRaw = (params.active || 'active').toLowerCase();
  const activeFilter: 'active' | 'inactive' | 'all' =
    activeParamRaw === 'inactive' ? 'inactive' : activeParamRaw === 'all' ? 'all' : 'active';
  const sortBy: RatingType =
    params.sortBy === 'rapid' ? 'rapid' : params.sortBy === 'blitz' ? 'blitz' : 'standard';

  try {
    const data = await getPlayersData(page, pageSize, search, ranking || undefined, activeFilter, sortBy);
    return <PlayerList
      key={`${data.currentRanking || 'latest'}-${page}-${search}-${activeFilter}-${sortBy}`}
      players={data.players}
      currentPage={data.page}
      totalPages={data.totalPages}
      totalPlayers={data.total}
      currentRanking={data.currentRanking}
      availableRankings={data.availableRankings || []}
      sortBy={sortBy}
    />;
  } catch (error) {
    console.error("Error fetching players:", error);
    return <ErrorState message="Hubo un problema al cargar los datos del ranking. Por favor, intenta nuevamente más tarde." />;
  }
}
