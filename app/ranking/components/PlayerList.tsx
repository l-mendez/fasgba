"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Player } from "../page";

interface PlayerListProps {
  players: Player[];
  currentPage: number;
  totalPages: number;
  totalPlayers: number;
  currentRanking?: string;
  availableRankings?: Array<{filename: string, displayName: string, month: number, year: number, date: Date}>;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update pageInput when currentPage changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString()); // Reset to current page if invalid
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
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

export function PlayerList({ players, currentPage, totalPages, totalPlayers, currentRanking, availableRankings }: PlayerListProps) {
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

  const handleRankingChange = (rankingFilename: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (rankingFilename === (availableRankings?.[0]?.filename || '')) {
      // If selecting the latest ranking, remove the ranking parameter
      params.delete('ranking');
    } else {
      params.set('ranking', rankingFilename);
    }
    params.set('page', '1'); // Reset to first page when changing ranking
    
    // Use router.replace to ensure immediate navigation and data refresh
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="container px-4 md:px-6">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar jugador o club..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Ranking Selector */}
        {availableRankings && availableRankings.length > 1 && (
          <div className="sm:w-48">
            <Select
              value={currentRanking || availableRankings[0]?.filename || ''}
              onValueChange={handleRankingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ranking" />
              </SelectTrigger>
              <SelectContent>
                {availableRankings.map((ranking) => (
                  <SelectItem key={ranking.filename} value={ranking.filename}>
                    {ranking.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Top pagination */}
      <div className="mb-6">
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Single ranking table without category tabs */}
      <div className="space-y-4">
        <RankingTable players={players} currentPage={currentPage} />
      </div>

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

  const getPositionChangeIndicator = (changes: Player['changes']) => {
    if (!changes) return null;
    
    if (changes.isNew) {
      return (
        <Circle className="h-3 w-3 text-blue-600 ml-1" title="Nuevo jugador" />
      );
    }
    
    if (changes.position && changes.position > 0) {
      return (
        <div className="flex items-center ml-1 text-green-600" title={`Subió ${changes.position} posiciones`}>
          <ArrowUp className="h-3 w-3" />
          <span className="text-xs font-medium">{changes.position}</span>
        </div>
      );
    }
    
    if (changes.position && changes.position < 0) {
      return (
        <div className="flex items-center ml-1 text-red-600" title={`Bajó ${Math.abs(changes.position)} posiciones`}>
          <ArrowDown className="h-3 w-3" />
          <span className="text-xs font-medium">{Math.abs(changes.position)}</span>
        </div>
      );
    }
    
    if (changes.position === 0) {
      return (
        <Minus className="h-3 w-3 text-gray-500 ml-1" title="Sin cambio de posición" />
      );
    }
    
    return null;
  };

  const getPointsChangeText = (changes: Player['changes']) => {
    if (!changes || changes.points === 0) return null;
    
    const sign = changes.points > 0 ? '+' : '';
    const color = changes.points > 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`text-xs ${color} ml-1`}>
        {sign}{changes.points}
      </span>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Pos.</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Club</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
            <TableHead className="hidden md:table-cell text-center">Partidos</TableHead>
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
              <TableRow key={`player-${player.position}`}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <span>{player.position}</span>
                    {getPositionChangeIndicator(player.changes)}
                  </div>
                </TableCell>
                <TableCell>
                  <span>{player.name}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">{player.club}</TableCell>
                <TableCell className="text-right font-medium">
                  <div className="flex items-center justify-end">
                    {player.points}
                    {getPointsChangeText(player.changes)}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">{player.matches}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 