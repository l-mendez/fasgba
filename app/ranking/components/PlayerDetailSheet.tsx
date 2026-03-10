"use client";

import { useState, useEffect } from "react";
import { Crown, Timer, Zap, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Player, TournamentDetail, RatingType } from "@/lib/rankingUtils";

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
        <Icon className="h-4 w-4" />
        <span>{config.label}</span>
      </div>
      <div className="text-2xl font-bold">
        {rating !== null && rating !== 0 ? Math.round(rating) : "--"}
      </div>
      {change !== undefined && change !== 0 && rating !== null && rating !== 0 && (
        <div
          className={`flex items-center text-sm mt-0.5 ${
            change > 0 ? "text-green-600" : "text-red-600"
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
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    fetch(
      `/api/ranking/analytics?ranking=${encodeURIComponent(rankingFilename)}&playerId=${encodeURIComponent(playerId)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.details) {
          setDetails(data.data.details);
        } else {
          setDetails([]);
        }
      })
      .catch(() => setDetails([]))
      .finally(() => setLoading(false));
  }, [open, player, rankingFilename]);

  if (!player) return null;

  const ratingChanges = player.changes?.ratings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {player.title && (
              <Badge variant="secondary" className="text-primary font-medium">
                {player.title}
              </Badge>
            )}
            {player.name}
          </SheetTitle>
          <SheetDescription>
            {player.club && <span>{player.club}</span>}
            {player.category && <span> · {player.category}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Rating cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
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

        {/* Tournament history */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Historial de torneos</h3>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && details.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin datos analíticos disponibles
            </p>
          )}

          {!loading && details.length > 0 && (
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
                              ? "text-green-600"
                              : detail.eloChange < 0
                              ? "text-red-600"
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
