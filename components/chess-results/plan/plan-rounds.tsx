import { FileText } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import type { PlanGame, PlanRound, PlanStatus } from "@/lib/chess-results/plan"
import { PlanStatusBadge, RESULT_LABEL } from "./plan-status"

function GameRow({ game }: { game: PlanGame }) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-1.5 text-sm sm:grid-cols-[2rem_minmax(0,1fr)_4rem_minmax(0,1fr)_auto]">
      <span className="text-xs tabular-nums text-muted-foreground">{game.board}</span>
      <span className="min-w-0 truncate sm:text-right">{game.white || "—"}</span>
      <span className="col-start-3 row-start-1 text-center font-semibold tabular-nums sm:col-start-auto sm:row-start-auto">
        {RESULT_LABEL[game.result]}{game.forfeit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">(F)</span>}
        {game.hasPgn && <FileText className="ml-1 inline h-3.5 w-3.5 text-amber" aria-label="Con PGN" />}
      </span>
      <span className="col-start-2 min-w-0 truncate sm:col-start-auto">{game.black || "—"}</span>
      <span className="col-start-3 row-start-2 justify-self-end sm:col-start-auto sm:row-start-auto">
        {game.status !== "new" && <PlanStatusBadge status={game.status} />}
      </span>
    </li>
  )
}

function counts(games: PlanGame[]) {
  return (["new", "fill", "exists", "skip"] as PlanStatus[])
    .map((status) => [status, games.filter((g) => g.status === status).length] as const)
    .filter(([, n]) => n > 0)
}

/** Every round with its pairings and results, as chess-results publishes them. */
export function PlanRounds({ rounds }: { rounds: PlanRound[] }) {
  if (rounds.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay rondas emparejadas.</p>
  return (
    <Accordion type="multiple" defaultValue={[String(rounds[0].number)]} className="w-full">
      {rounds.map((round) => {
        const games = [...round.games, ...round.matches.flatMap((m) => m.games)]
        return (
          <AccordionItem key={round.number} value={String(round.number)}>
            <AccordionTrigger className="gap-2 text-sm hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-left">
                <span className="font-semibold">Ronda {round.number}</span>
                {round.date && <span className="text-xs font-normal text-muted-foreground">{formatArgentinaDateOnly(round.date)}</span>}
                {round.status === "new" && <PlanStatusBadge status="new" label="Ronda nueva" />}
                {counts(games).map(([status, n]) => (
                  <PlanStatusBadge key={status} status={status} label={`${n} ${status === "new" ? "nuevas" : status === "fill" ? "a completar" : status === "exists" ? "cargadas" : "omitidas"}`} />
                ))}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {round.games.length > 0 && <ul className="divide-y">{round.games.map((g) => <GameRow key={g.board} game={g} />)}</ul>}
              {round.matches.map((match) => (
                <div key={`${match.home}-${match.away}`} className="mb-3 rounded-md border p-2 last:mb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-1.5 text-sm font-medium">
                    <span className="min-w-0 break-words">{match.home} <span className="text-muted-foreground">vs</span> {match.away}</span>
                    <PlanStatusBadge status={match.status} label={match.status === "new" ? "Encuentro nuevo" : match.status === "exists" ? "Encuentro cargado" : undefined} />
                  </div>
                  <ul className="divide-y">{match.games.map((g) => <GameRow key={g.board} game={g} />)}</ul>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
