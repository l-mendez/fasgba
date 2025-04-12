"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Player } from "../page";

interface PlayerListProps {
  players: Player[];
}

export function PlayerList({ players }: PlayerListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter players based on search term
  const filteredPlayers = players.filter((player) => 
    player.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <RankingTable players={filteredPlayers} />
        </TabsContent>
        
        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <RankingTable 
              players={filteredPlayers.filter(player => player.categoria === category)} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function RankingTable({ players }: { players: Player[] }) {
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
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No se encontraron jugadores
              </TableCell>
            </TableRow>
          ) : (
            players.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
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