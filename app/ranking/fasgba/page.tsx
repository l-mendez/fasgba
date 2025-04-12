import { Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
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
export interface Player {
  id: number;
  nombre: string;
  club: string;
  elo: number;
  categoria: string;
  titulo: string;
  edad: number;
}

// Mock data for players
const mockPlayers: Player[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    club: "Club de Ajedrez Buenos Aires",
    elo: 2450,
    categoria: "Absoluto",
    titulo: "IM",
    edad: 28
  },
  {
    id: 2,
    nombre: "María González",
    club: "Club de Ajedrez La Plata",
    elo: 2350,
    categoria: "Femenino",
    titulo: "WIM",
    edad: 25
  },
  {
    id: 3,
    nombre: "Carlos Rodríguez",
    club: "Club de Ajedrez Rosario",
    elo: 2200,
    categoria: "Absoluto",
    titulo: "FM",
    edad: 32
  },
  {
    id: 4,
    nombre: "Ana Martínez",
    club: "Club de Ajedrez Mar del Plata",
    elo: 2100,
    categoria: "Femenino",
    titulo: "WFM",
    edad: 22
  },
  {
    id: 5,
    nombre: "Lucas Fernández",
    club: "Club de Ajedrez Quilmes",
    elo: 2000,
    categoria: "Absoluto",
    titulo: "",
    edad: 19
  },
  {
    id: 6,
    nombre: "Sofía López",
    club: "Club de Ajedrez San Isidro",
    elo: 1950,
    categoria: "Femenino",
    titulo: "",
    edad: 17
  },
  {
    id: 7,
    nombre: "Diego Sánchez",
    club: "Club de Ajedrez Tigre",
    elo: 1900,
    categoria: "Sub-18",
    titulo: "",
    edad: 16
  },
  {
    id: 8,
    nombre: "Valentina Torres",
    club: "Club de Ajedrez Vicente López",
    elo: 1850,
    categoria: "Sub-16",
    titulo: "",
    edad: 15
  }
];

// Get players from mock data
async function getPlayers(): Promise<Player[]> {
  // In a real implementation, this would fetch from a database
  // For now, we'll just return the mock data
  return mockPlayers;
}

export default async function RankingPage() {
  // Get players from mock data
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

