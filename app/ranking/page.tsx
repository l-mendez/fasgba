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

// Function to get player category based on age and gender
function getPlayerCategory(age: number, gender: string): string {
  if (age < 16) return "Sub-16";
  if (age < 18) return "Sub-18";
  if (gender === "Female") return "Femenino";
  return "Absoluto";
}

// Function to calculate age based on birth date
function calculateAge(birthDateString: string): number {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Function to get player title based on ELO
function getPlayerTitle(elo: number, gender: string): string {
  if (gender === "Female") {
    if (elo >= 2300) return "WGM";
    if (elo >= 2200) return "WIM";
    if (elo >= 2100) return "WFM";
    return "";
  } else {
    if (elo >= 2500) return "GM";
    if (elo >= 2400) return "IM";
    if (elo >= 2300) return "FM";
    return "";
  }
}

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

// Get players from API
async function getPlayers(page: number = 1, pageSize: number = 50, search: string = ''): Promise<ApiResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search })
  });

  const response = await fetch(
    `${baseUrl}/api/data?${searchParams.toString()}`,
    { 
      cache: 'no-store',
      next: { revalidate: 0 }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  
  return response.json();
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
      <SiteHeader />
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
    const data = await getPlayers(page, pageSize, search);
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