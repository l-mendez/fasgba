"use client";

import type { KeyboardEvent } from "react";
import { ArrowUp, ArrowDown, Minus, Circle, Crown, Timer, Zap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RatingChange } from "@/components/rating-change";
import type { Player, RatingType } from "@/lib/rankingUtils";

const ratingTypeConfig: Record<
  RatingType,
  { icon: typeof Crown; label: string; shortLabel: string }
> = {
  standard: { icon: Crown, label: "Standard", shortLabel: "Std" },
  rapid: { icon: Timer, label: "Rápido", shortLabel: "Rap" },
  blitz: { icon: Zap, label: "Blitz", shortLabel: "Blz" },
};

// Without onPlayerClick (the server-rendered fallback) rows are static.
export function RankingTable({
  players,
  sortBy,
  onPlayerClick,
}: {
  players: Player[];
  sortBy: RatingType;
  onPlayerClick?: (player: Player) => void;
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
                {...(onPlayerClick && {
                  className: "cursor-pointer hover:bg-amber/10",
                  tabIndex: 0,
                  onClick: () => onPlayerClick(player),
                  onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPlayerClick(player);
                    }
                  },
                })}
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
