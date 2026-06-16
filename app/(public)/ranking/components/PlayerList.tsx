"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Circle,
  Crown,
  Timer,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RatingTypeSelector } from "./RatingTypeSelector";
import { PlayerDetailSheet } from "./PlayerDetailSheet";
import { ErrorAlert } from "@/components/error-alert";
import {
  normalizePlayer,
  sortPlayersByRatingType,
  selectPlayersPage,
} from "@/lib/rankingDisplay";
import type { Player, RatingType, RankingData } from "@/lib/rankingUtils";

const PAGE_SIZE = 50;

interface AvailableRanking {
  filename: string;
  displayName: string;
  month: number;
  year: number;
  date: string | Date;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return fallback;
  return Number(value);
}

function normalizeActiveFilter(value: string | null): "active" | "inactive" | "all" {
  const v = (value || "active").toLowerCase();
  return v === "inactive" ? "inactive" : v === "all" ? "all" : "active";
}

function normalizeSortBy(value: string | null): RatingType {
  return value === "rapid" ? "rapid" : value === "blitz" ? "blitz" : "standard";
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex items-center space-x-2">
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
        <form
          onSubmit={handlePageInputSubmit}
          className="flex items-center space-x-1"
        >
          <Input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 h-8 text-center text-sm"
            placeholder="1"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-8 px-2"
            title="Ir a página"
          >
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

interface PlayerListProps {
  // The latest ranking's players, rendered server-side (see page.tsx).
  initialPlayers: Player[];
  // The available-ranking options for the selector, most-recent-first.
  availableRankings: AvailableRanking[];
}

export function PlayerList({ initialPlayers, availableRankings }: PlayerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rankingParam = searchParams.get("ranking") || "";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const search = searchParams.get("search") || "";
  const activeFilter = normalizeActiveFilter(searchParams.get("active"));
  const sortBy = normalizeSortBy(searchParams.get("sortBy"));

  const latestFilename = availableRankings[0]?.filename || "";
  // The server already rendered the latest ranking; only a past selection needs
  // a client fetch of that specific file.
  const isLatest = !rankingParam || rankingParam === latestFilename;

  const [players, setPlayers] = useState<Player[] | null>(initialPlayers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [searchTerm, setSearchTerm] = useState(search);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  // Selecting a *past* ranking loads that specific file on the client; the
  // latest ranking (the common case) is already provided via initialPlayers.
  // Search/filter/sort/pagination then happen in-memory below.
  useEffect(() => {
    if (isLatest) {
      setPlayers(initialPlayers);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/ranking/specific?filename=${encodeURIComponent(rankingParam)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: RankingData) => {
        if (cancelled) return;
        setPlayers((data.players || []).map(normalizePlayer));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rankingParam, isLatest, initialPlayers]);

  const currentRanking = rankingParam || latestFilename;

  const { pagePlayers, totalPlayers, totalPages } = useMemo(() => {
    if (!players) return { pagePlayers: [] as Player[], totalPlayers: 0, totalPages: 1 };
    const sorted = sortPlayersByRatingType(players, sortBy);
    const result = selectPlayersPage(sorted, {
      search,
      activeFilter,
      page,
      pageSize: PAGE_SIZE,
    });
    return {
      pagePlayers: result.players,
      totalPlayers: result.total,
      totalPages: Math.max(1, result.totalPages),
    };
  }, [players, sortBy, search, activeFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = searchTerm.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleRankingChange = (rankingFilename: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (rankingFilename === (availableRankings?.[0]?.filename || "")) {
      params.delete("ranking");
    } else {
      params.set("ranking", rankingFilename);
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleActiveChange = (value: "active" | "inactive" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "active") {
      params.delete("active");
    } else {
      params.set("active", value);
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setDetailOpen(true);
  };

  return (
    <div className="container px-4 md:px-6">
      {/* Rating Type Selector */}
      <div className="mb-6 flex justify-center">
        <RatingTypeSelector currentType={sortBy} />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar jugador o club..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </form>

        <div className="sm:w-40">
          <Select
            value={activeFilter}
            onValueChange={(v) =>
              handleActiveChange(v as "active" | "inactive" | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Actividad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">No activos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableRankings && availableRankings.length > 1 && (
          <div className="sm:w-48">
            <Select
              value={
                currentRanking || availableRankings[0]?.filename || ""
              }
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

      {error ? (
        <ErrorAlert
          title="Error de conexión"
          message="Hubo un problema al cargar los datos del ranking. Por favor, intenta nuevamente más tarde."
        />
      ) : loading && !players ? (
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-md w-full" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <div className="space-y-4">
            <RankingTable
              players={pagePlayers}
              sortBy={sortBy}
              onPlayerClick={handlePlayerClick}
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 text-sm text-muted-foreground text-center">
              Mostrando {pagePlayers.length} de {totalPlayers} jugadores
            </div>
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      <PlayerDetailSheet
        player={selectedPlayer}
        rankingFilename={currentRanking || ""}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

const ratingTypeConfig: Record<
  RatingType,
  { icon: typeof Crown; label: string; shortLabel: string }
> = {
  standard: { icon: Crown, label: "Standard", shortLabel: "Std" },
  rapid: { icon: Timer, label: "Rápido", shortLabel: "Rap" },
  blitz: { icon: Zap, label: "Blitz", shortLabel: "Blz" },
};

function RankingTable({
  players,
  sortBy,
  onPlayerClick,
}: {
  players: Player[];
  sortBy: RatingType;
  onPlayerClick: (player: Player) => void;
}) {
  const getPositionChangeIndicator = (changes: Player["changes"]) => {
    if (!changes) return null;

    if (changes.isNew) {
      return (
        <div className="ml-1" title="Nuevo jugador">
          <Circle className="h-3 w-3 text-blue-600" />
        </div>
      );
    }

    if (changes.position && changes.position > 0) {
      return (
        <div
          className="flex items-center ml-1 text-green-600"
          title={`Subió ${changes.position} posiciones`}
        >
          <ArrowUp className="h-3 w-3" />
          <span className="text-xs font-medium">{changes.position}</span>
        </div>
      );
    }

    if (changes.position && changes.position < 0) {
      return (
        <div
          className="flex items-center ml-1 text-red-600"
          title={`Bajó ${Math.abs(changes.position)} posiciones`}
        >
          <ArrowDown className="h-3 w-3" />
          <span className="text-xs font-medium">
            {Math.abs(changes.position)}
          </span>
        </div>
      );
    }

    if (changes.position === 0) {
      return (
        <div className="ml-1" title="Sin cambio de posición">
          <Minus className="h-3 w-3 text-gray-500" />
        </div>
      );
    }

    return null;
  };

  const getRatingChangeText = (changes: Player["changes"], type: RatingType) => {
    if (!changes?.ratings) return null;
    const change = changes.ratings[type];
    if (!change || change === 0) return null;

    const rounded = Math.round(change);
    const sign = rounded > 0 ? "+" : "";
    const color = rounded > 0 ? "text-green-600" : "text-red-600";

    return (
      <span className={`text-xs ${color} ml-1`}>
        {sign}
        {rounded}
      </span>
    );
  };

  const getPointsChangeText = (changes: Player["changes"]) => {
    if (!changes || changes.points === 0) return null;

    const roundedPoints = Math.round(changes.points);
    const sign = roundedPoints > 0 ? "+" : "";
    const color = roundedPoints > 0 ? "text-green-600" : "text-red-600";

    return (
      <span className={`text-xs ${color} ml-1`}>
        {sign}
        {roundedPoints}
      </span>
    );
  };

  const ratingTypes: RatingType[] = ["standard", "rapid", "blitz"];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Pos.</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Club</TableHead>
            {ratingTypes.map((type) => {
              const config = ratingTypeConfig[type];
              const Icon = config.icon;
              const isActive = type === sortBy;
              return (
                <TableHead
                  key={type}
                  className={`text-right ${
                    type !== sortBy ? "hidden md:table-cell" : ""
                  } ${isActive ? "font-bold" : ""}`}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="hidden lg:inline">{config.label}</span>
                    <span className="lg:hidden">{config.shortLabel}</span>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow key="no-players">
              <TableCell
                colSpan={6}
                className="text-center py-6 text-muted-foreground"
              >
                No se encontraron jugadores
              </TableCell>
            </TableRow>
          ) : (
            players.map((player) => (
              <TableRow
                key={`player-${player.id || player.position}`}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onPlayerClick(player)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <span>{player.position}</span>
                    {getPositionChangeIndicator(player.changes)}
                  </div>
                </TableCell>
                <TableCell>
                  {player.title ? (
                    <span>
                      <span className="text-primary font-medium">
                        {player.title}
                      </span>
                      <span> {player.name}</span>
                    </span>
                  ) : (
                    <span>{player.name}</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {player.club}
                </TableCell>
                {ratingTypes.map((type) => {
                  const rating = player.ratings[type];
                  const isActive = type === sortBy;
                  return (
                    <TableCell
                      key={type}
                      className={`text-right ${
                        type !== sortBy ? "hidden md:table-cell" : ""
                      } ${isActive ? "font-medium" : ""}`}
                    >
                      <div className="flex items-center justify-end">
                        {rating !== null && rating !== 0
                          ? Math.round(rating)
                          : "--"}
                        {isActive && player.changes?.ratings
                          ? getRatingChangeText(player.changes, type)
                          : isActive && getPointsChangeText(player.changes)}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
