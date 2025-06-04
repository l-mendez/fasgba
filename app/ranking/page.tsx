import { Suspense } from "react";
import { Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PlayerList } from "@/app/ranking/components/PlayerList"
import { getPlayers, type PaginatedPlayersResponse } from "@/lib/rankingUtils"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Define interfaces for the data we're working with
export interface Player {
  id: number;
  nombre: string;
  club: string;
  elo: number;
  categoria: string;
  titulo: string;
  edad: number;
}

interface ApiResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get players directly from rankingUtils instead of making HTTP call
async function getPlayersData(page: number = 1, pageSize: number = 50, search: string = ''): Promise<ApiResponse> {
  try {
    const data: PaginatedPlayersResponse = await getPlayers(page, pageSize, search);
    return data;
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
  searchParams: { page?: string; search?: string };
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
  searchParams: { page?: string; search?: string };
}) {
  // Await the searchParams before using them
  const params = await Promise.resolve(searchParams);
  const page = parseInt(params.page || '1');
  const pageSize = 50;
  const search = params.search || '';

  try {
    const data = await getPlayersData(page, pageSize, search);
    return <PlayerList 
      players={data.players} 
      currentPage={data.page}
      totalPages={data.totalPages}
      totalPlayers={data.total}
    />;
  } catch (error) {
    console.error("Error fetching players:", error);
    return <ErrorState message="Hubo un problema al cargar los datos del ranking. Por favor, intenta nuevamente más tarde." />;
  }
} 