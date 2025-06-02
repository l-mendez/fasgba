"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Player } from "../page";

interface PlayerListProps {
  players: Player[];
  currentPage: number;
  totalPages: number;
  totalPlayers: number;
}

export function PlayerList({ players, currentPage, totalPages, totalPlayers }: PlayerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  
  // Update URL when search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
      params.set('page', '1'); // Reset to first page when searching
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  }, [searchTerm, router, searchParams]);

  // Get unique categories
  const categories = [...new Set(players.map(player => player.categoria))];

  return (
    <div className="container px-4 md:px-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar jugador o club..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full mb-6 grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={`tab-${category}`} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <RankingTable players={players} currentPage={currentPage} />
        </TabsContent>
        
        {categories.map((category) => (
          <TabsContent key={`content-${category}`} value={category} className="space-y-4">
            <RankingTable 
              players={players.filter(player => player.categoria === category)} 
              currentPage={currentPage}
            />
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Mostrando {players.length} de {totalPlayers} jugadores
        </div>
        <div className="flex items-center justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', (currentPage - 1).toString());
              router.push(`?${params.toString()}`);
            }}
          >
            Anterior
          </Button>
          <span className="text-sm px-2">
            <span className="hidden sm:inline">Página </span>{currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', (currentPage + 1).toString());
              router.push(`?${params.toString()}`);
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

function RankingTable({ players, currentPage }: { players: Player[]; currentPage: number }) {
  const pageSize = 50; // This should match the pageSize in page.tsx

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Pos.</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Club</TableHead>
            <TableHead className="text-right">ELO</TableHead>
            <TableHead className="hidden md:table-cell">Categoría</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow key="no-players">
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No se encontraron jugadores
              </TableCell>
            </TableRow>
          ) : (
            players.map((player, index) => (
              <TableRow key={`player-${player.id || index}`}>
                <TableCell className="font-medium">
                  {((currentPage - 1) * pageSize) + index + 1}
                </TableCell>
                <TableCell>
                  {player.titulo && (
                    <span className="mr-1 font-medium text-primary">{player.titulo}</span>
                  )}
                  {player.nombre}
                </TableCell>
                <TableCell className="hidden md:table-cell">{player.club}</TableCell>
                <TableCell className="text-right font-medium">{player.elo}</TableCell>
                <TableCell className="hidden md:table-cell">{player.categoria}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 