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
import { RatingChange } from "@/components/rating-change";
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

// Rating gains use the brand amber (readable in both themes); losses use destructive.

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
    if (page === currentPage) return;
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const iconButton = (label: string, disabled: boolean, page: number, Icon: typeof ChevronLeft) => (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      disabled={disabled}
      onClick={() => onPageChange(page)}
      aria-label={label}
      title={label}
    >
      <Icon />
    </Button>
  );

  return (
    <div className="flex items-center gap-1.5">
      {iconButton("Primera página", currentPage === 1, 1, ChevronsLeft)}
      {iconButton("Página anterior", currentPage === 1, currentPage - 1, ChevronLeft)}
      <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Input
          type="text"
          inputMode="numeric"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={handlePageInputSubmit}
          className="h-8 w-12 text-center text-sm"
          aria-label="Página"
        />
        <span className="whitespace-nowrap">/ {totalPages}</span>
      </form>
      {iconButton("Página siguiente", currentPage === totalPages, currentPage + 1, ChevronRight)}
      {iconButton("Última página", currentPage === totalPages, totalPages, ChevronsRight)}
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
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <Input
            type="search"
            placeholder="Buscar jugador o club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="outline" size="icon" className="shrink-0" aria-label="Buscar" title="Buscar">
            <Search />
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <RatingTypeSelector currentType={sortBy} />

          <Select
            value={activeFilter}
            onValueChange={(v) =>
              handleActiveChange(v as "active" | "inactive" | "all")
            }
          >
            <SelectTrigger className="w-32" aria-label="Actividad">
              <SelectValue placeholder="Actividad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">No activos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>

          {availableRankings && availableRankings.length > 1 && (
            <Select
              value={currentRanking || availableRankings[0]?.filename || ""}
              onValueChange={handleRankingChange}
            >
              <SelectTrigger className="w-40" aria-label="Ranking">
                <SelectValue placeholder="Ranking" />
              </SelectTrigger>
              <SelectContent>
                {availableRankings.map((ranking) => (
                  <SelectItem key={ranking.filename} value={ranking.filename}>
                    {ranking.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {error ? (
        <ErrorAlert
          title="Error de conexión"
          message="Hubo un problema al cargar los datos del ranking. Por favor, intenta nuevamente más tarde."
        />
      ) : loading && !players ? (
        <div className="h-96 w-full animate-pulse rounded-md bg-muted" />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{totalPlayers} jugadores</p>
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <RankingTable
            players={pagePlayers}
            sortBy={sortBy}
            onPlayerClick={handlePlayerClick}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
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
          <Circle className="h-3 w-3 fill-amber text-amber" />
        </div>
      );
    }

    if (changes.position && changes.position > 0) {
      return (
        <div
          className="flex items-center ml-1 text-amber-dark dark:text-amber-light"
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
          className="flex items-center ml-1 text-destructive"
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
          <Minus className="h-3 w-3 text-muted-foreground" />
        </div>
      );
    }

    return null;
  };

  const ratingTypes: RatingType[] = ["standard", "rapid", "blitz"];

  return (
    <div className="rounded-lg border">
      <Table className="[&_td]:py-2.5">
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
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-amber" : "text-muted-foreground"}`} />
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
                className="cursor-pointer hover:bg-amber/10"
                tabIndex={0}
                onClick={() => onPlayerClick(player)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPlayerClick(player);
                  }
                }}
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
                      <span className="font-medium text-terracotta">
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
                        {isActive && (
                          <RatingChange
                            className="ml-1"
                            value={player.changes?.ratings ? player.changes.ratings[type] : player.changes?.points}
                          />
                        )}
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
