"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { RankingTable } from "./RankingTable";
import { ErrorAlert } from "@/components/error-alert";
import {
  normalizePlayer,
  sortPlayersByRatingType,
  selectPlayersPage,
  RANKING_PAGE_SIZE,
} from "@/lib/rankingDisplay";
import type { Player, RatingType, RankingData } from "@/lib/rankingUtils";

const SEARCH_DEBOUNCE_MS = 300;

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

  // Reset the input when the page changes (adjusted during render).
  const [prevPage, setPrevPage] = useState(currentPage);
  if (prevPage !== currentPage) {
    setPrevPage(currentPage);
    setPageInput(currentPage.toString());
  }

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
  // Deep link from the home ranking: /ranking?jugador=<id> opens that player's panel.
  const jugadorParam = searchParams.get("jugador");

  const latestFilename = availableRankings[0]?.filename || "";
  // The server already rendered the latest ranking; only a past selection needs
  // a client fetch of that specific file.
  const isLatest = !rankingParam || rankingParam === latestFilename;

  const [players, setPlayers] = useState<Player[] | null>(initialPlayers);
  const [loading, setLoading] = useState(!isLatest);
  const [error, setError] = useState(false);

  // When the selected ranking (or the server data) changes, reset during
  // render: back to the server-rendered latest, or start loading a past one.
  const [prevSource, setPrevSource] = useState({ rankingParam, isLatest, initialPlayers });
  if (
    prevSource.rankingParam !== rankingParam ||
    prevSource.isLatest !== isLatest ||
    prevSource.initialPlayers !== initialPlayers
  ) {
    setPrevSource({ rankingParam, isLatest, initialPlayers });
    if (isLatest) setPlayers(initialPlayers);
    setLoading(!isLatest);
    setError(false);
  }

  const [searchTerm, setSearchTerm] = useState(search);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);
  // Last search value this component wrote to the URL, so the URL→input sync
  // below only reacts to outside navigation and never clobbers typing.
  const pushedSearchRef = useRef(search);

  useEffect(() => {
    if (search !== pushedSearchRef.current) {
      pushedSearchRef.current = search;
      setSearchTerm(search);
    }
  }, [search]);

  // Live search: write the (debounced) term to the URL as the user types.
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === search) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      pushedSearchRef.current = trimmed;
      router.replace(`?${params.toString()}`, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm, search, searchParams, router]);

  // Selecting a *past* ranking loads that specific file on the client; the
  // latest ranking (the common case) is already provided via initialPlayers.
  // Search/filter/sort/pagination then happen in-memory below.
  useEffect(() => {
    if (isLatest) return;
    let cancelled = false;
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
      pageSize: RANKING_PAGE_SIZE,
    });
    return {
      pagePlayers: result.players,
      totalPlayers: result.total,
      totalPages: Math.max(1, result.totalPages),
    };
  }, [players, sortBy, search, activeFilter, page]);

  const linkedPlayer = useMemo(
    () => (jugadorParam && players?.find((p) => p.id === jugadorParam)) || null,
    [jugadorParam, players]
  );

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
    // Bring the top of the list back into view (e.g. after using the bottom pagination).
    const listTop = listTopRef.current;
    if (listTop && listTop.getBoundingClientRect().top < 80) {
      listTop.scrollIntoView({ block: "start" });
    }
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

  // A deep-linked player keeps the panel open until it is closed, which also
  // drops ?jugador= from the URL.
  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open && linkedPlayer) {
      setSelectedPlayer(linkedPlayer);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("jugador");
      const query = params.toString();
      router.replace(query ? `?${query}` : "/ranking", { scroll: false });
    }
  };

  return (
    <div className="container px-4 md:px-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar jugador o club..."
            aria-label="Buscar jugador o club"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Mobile: tabs on one row, then the two selects side by side */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <div className="col-span-2">
            <RatingTypeSelector currentType={sortBy} />
          </div>

          <Select
            value={activeFilter}
            onValueChange={(v) =>
              handleActiveChange(v as "active" | "inactive" | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-32" aria-label="Actividad">
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
              <SelectTrigger className="w-full sm:w-40" aria-label="Ranking">
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
          <div ref={listTopRef} className="mb-3 flex scroll-mt-20 flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {totalPlayers} {totalPlayers === 1 ? "jugador" : "jugadores"}
            </p>
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
        player={linkedPlayer ?? selectedPlayer}
        rankingFilename={currentRanking || ""}
        open={detailOpen || linkedPlayer !== null}
        onOpenChange={handleDetailOpenChange}
      />
    </div>
  );
}
