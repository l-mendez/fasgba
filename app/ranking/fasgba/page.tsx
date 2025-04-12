import { Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { supabase } from "@/lib/supabaseClient"
import { PlayerList } from "@/app/ranking/fasgba/components/PlayerList"

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
interface User {
  id: number;
  name: string;
  surname: string;
  birth_date: string;
  birth_gender: string;
  profile_picture: string | null;
  club_id: number | null;
  club: { id: number; name: string } | null;
}

interface EloData {
  elo: number;
}

export interface Player {
  id: number;
  nombre: string;
  club: string;
  elo: number;
  categoria: string;
  titulo: string;
  edad: number;
}

// Fetch player data from the database
async function getPlayers(): Promise<Player[]> {
  // Get users with their club information
  const { data, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      name,
      surname,
      birth_date,
      birth_gender,
      profile_picture,
      club_id,
      club:club_id(id, name)
    `)
    .order('id');

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return [];
  }

  // Ensure the type is correct
  const users = data as unknown as User[];

  // Get the latest ELO rating for each user
  const playerPromises = users.map(async (user) => {
    const { data: eloData, error: eloError } = await supabase
      .from('elohistory')
      .select('elo')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (eloError) {
      console.error(`Error fetching ELO for user ${user.id}:`, eloError);
      return null;
    }

    const elo = eloData.length > 0 ? eloData[0].elo : 0;
    const age = calculateAge(user.birth_date);
    const category = getPlayerCategory(age, user.birth_gender);
    const titulo = getPlayerTitle(elo, user.birth_gender);

    return {
      id: user.id,
      nombre: `${user.name} ${user.surname}`,
      club: user.club?.name || "Sin club",
      elo: elo,
      categoria: category,
      titulo: titulo,
      edad: age
    };
  });

  // Wait for all promises to resolve
  const players = (await Promise.all(playerPromises)).filter((player: Player | null): player is Player => player !== null);
  
  // Sort players by ELO (descending)
  return players.sort((a: Player, b: Player) => b.elo - a.elo);
}

export default async function RankingPage() {
  // Fetch players data from database
  let jugadores: Player[] = [];
  let errorMessage = "";
  
  try {
    jugadores = await getPlayers();
  } catch (error) {
    console.error("Error fetching players:", error);
    errorMessage = "Hubo un problema al cargar los datos del ranking. Por favor, intenta nuevamente más tarde.";
  }

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
          {errorMessage ? (
            <div className="container px-4 md:px-6">
              <div className="rounded-md bg-red-50 p-6 text-center">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error de conexión</h3>
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          ) : (
            <PlayerList players={jugadores} />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

