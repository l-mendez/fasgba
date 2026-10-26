"use client";

import { useState, useEffect } from "react";
import { Crown, Timer, Zap, ArrowUp, ArrowDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Player, TournamentDetail, RatingType } from "@/lib/rankingUtils";
import { RatingEvolutionChart } from "./RatingEvolutionChart";

interface PlayerDetailSheetProps {
  player: Player | null;
  rankingFilename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ratingTypeIcons: Record<RatingType, { icon: typeof Crown; label: string }> = {
  standard: { icon: Crown, label: "Standard" },
  rapid: { icon: Timer, label: "Rápido" },
  blitz: { icon: Zap, label: "Blitz" },
};

function RatingCard({
  type,
  rating,
  change,
}: {
  type: RatingType;
  rating: number | null;
  change?: number;
}) {
  const config = ratingTypeIcons[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
        <Icon className="h-4 w-4 text-amber" />
        <span>{config.label}</span>
      </div>
      <div className="text-2xl font-bold">
        {rating !== null && rating !== 0 ? Math.round(rating) : "--"}
      </div>
      {change !== undefined && change !== 0 && rating !== null && rating !== 0 && (
        <div
          className={`flex items-center text-sm mt-0.5 ${
            change > 0 ? "text-amber-dark dark:text-amber-light" : "text-destructive"
          }`}
        >
          {change > 0 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          <span>
            {change > 0 ? "+" : ""}
            {Math.round(change)}
          </span>
        </div>
      )}
    </div>
  );
}

export function PlayerDetailSheet({
  player,
  rankingFilename,
  open,
  onOpenChange,
}: PlayerDetailSheetProps) {
  const [details, setDetails] = useState<TournamentDetail[]>([]);

  useEffect(() => {
    if (!open || !player) {
      setDetails([]);
      return;
    }

    const playerId = player.id;
    if (!playerId) {
      setDetails([]);
      return;
    }

    fetch(
      `/api/ranking/analytics?ranking=${encodeURIComponent(rankingFilename)}&playerId=${encodeURIComponent(playerId)}`
    )
      .then((res) => res.json())
      .then((data) => {
        // apiSuccess returns the payload unwrapped: { details }
        setDetails(Array.isArray(data?.details) ? data.details : []);
      })
      .catch(() => setDetails([]));
  }, [open, player, rankingFilename]);

  if (!player) return null;

  const ratingChanges = player.changes?.ratings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 pr-6">
            {player.title && <span className="text-terracotta">{player.title}</span>}
            {player.name}
          </SheetTitle>
          <SheetDescription>
            {player.club && <span>{player.club}</span>}
            {player.category && <span> · {player.category}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Rating cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <RatingCard
            type="standard"
            rating={player.ratings.standard}
            change={ratingChanges?.standard}
          />
          <RatingCard
            type="rapid"
            rating={player.ratings.rapid}
            change={ratingChanges?.rapid}
          />
          <RatingCard
            type="blitz"
            rating={player.ratings.blitz}
            change={ratingChanges?.blitz}
          />
        </div>

        {/* Rating evolution chart */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-terracotta">Evolución del rating</h3>
          <RatingEvolutionChart playerId={player.id} playerName={player.name} />
        </div>

        {/* Tournament history: only shown when the ranking has analytics data */}
        {details.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-terracotta">Historial de torneos</h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Torneo</TableHead>
                    <TableHead className="text-center w-10">Tipo</TableHead>
                    <TableHead className="text-right">Elo</TableHead>
                    <TableHead className="text-center">W/n</TableHead>
                    <TableHead className="text-right">Rp</TableHead>
                    <TableHead className="text-right">K</TableHead>
                    <TableHead className="text-right">+/-</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((detail, index) => {
                    const TypeIcon = ratingTypeIcons[detail.type].icon;
                    return (
                      <TableRow key={index}>
                        <TableCell className="text-xs max-w-[160px] truncate" title={detail.tournament}>
                          {detail.tournament}
                        </TableCell>
                        <TableCell className="text-center">
                          <span title={ratingTypeIcons[detail.type].label}>
                            <TypeIcon
                              className="h-3.5 w-3.5 mx-auto text-muted-foreground"
                            />
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {Math.round(detail.eloBefore)}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {detail.wins}/{detail.games}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {Math.round(detail.performanceRating)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {detail.kFactor}
                        </TableCell>
                        <TableCell
                          className={`text-right text-xs font-medium ${
                            detail.eloChange > 0
                              ? "text-amber-dark dark:text-amber-light"
                              : detail.eloChange < 0
                              ? "text-destructive"
                              : ""
                          }`}
                        >
                          {detail.eloChange > 0 ? "+" : ""}
                          {Math.round(detail.eloChange * 100) / 100}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
