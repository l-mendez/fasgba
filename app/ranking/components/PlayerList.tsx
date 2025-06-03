"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
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

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString()); // Reset to current page if invalid
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers only
    if (value === '' || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Navigation buttons */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="Primera página"
          className="px-2"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Página anterior"
          className="px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page input */}
        <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1">
          <Input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            className="w-16 h-8 text-center text-sm"
            placeholder="1"
          />
          <Button type="submit" size="sm" variant="outline" className="h-8 px-2" title="Ir a página">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Página siguiente"
          className="px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Última página"
          className="px-2"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
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

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

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

      {/* Top pagination */}
      <div className="mb-6">
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
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

      {/* Bottom pagination */}
      <div className="mt-6">
        <div className="mb-2 text-sm text-muted-foreground text-center">
          Mostrando {players.length} de {totalPlayers} jugadores
        </div>
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
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