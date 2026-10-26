"use client"

import { useId, useState } from "react"
import { RotateCcw } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClubRef, PlayerChoice, TeamChoice } from "@/lib/chess-results/assign"
import type { PlanPlayer, PlanTeam } from "@/lib/chess-results/plan"
import type { ChessResultsOptions } from "@/lib/tournament/chess-results-dto"
import { PlanStatusBadge } from "../plan/plan-status"
import { SearchSelect } from "./search-select"

export interface AssignProps {
  options: ChessResultsOptions
  /** Clubs to create that were already typed elsewhere in this review. */
  newClubs: string[]
  /** New clubs marked as guests (not FASGBA members). */
  guestClubs: string[]
  setGuestClub: (name: string, guest: boolean) => void
  teamChoices: Record<string, TeamChoice>
  playerChoices: Record<string, PlayerChoice>
  setTeam: (key: string, choice: TeamChoice | null) => void
  setPlayer: (key: string, choice: PlayerChoice | null) => void
}

const clubLabel = (club: ClubRef | null) => (!club ? "Sin club" : "id" in club ? club.name : `${club.newName} (club nuevo)`)

function ClubSelect({ value, onChange, assign: { options, newClubs, guestClubs, setGuestClub }, allowNone, invalid }: {
  value: ClubRef | null
  onChange: (club: ClubRef | null) => void
  assign: AssignProps
  allowNone?: boolean
  invalid?: boolean
}) {
  const id = useId()
  const newName = value && "newName" in value ? value.newName : null
  const clubOptions = [
    ...newClubs.map((name) => ({ value: `new:${name}`, label: name, detail: "Club nuevo" })),
    ...options.clubs.map((c) => ({ value: String(c.id), label: c.name })),
  ]
  return (
    <div className="space-y-2">
      <SearchSelect
        label="Club"
        display={value ? clubLabel(value) : <span className="text-muted-foreground">{allowNone ? "Sin club" : "Elegí o creá el club"}</span>}
        options={clubOptions}
        selected={value ? ("id" in value ? String(value.id) : `new:${value.newName}`) : null}
        onSelect={(v) => onChange(v.startsWith("new:") ? { newName: v.slice(4) } : { id: Number(v), name: options.clubs.find((c) => String(c.id) === v)!.name })}
        placeholder="Buscar club…"
        createLabel={(q) => (q ? `Crear club «${q}»` : "Escribí el nombre del club nuevo")}
        onCreate={(q) => q && onChange({ newName: q })}
        emptyOption={allowNone ? { label: "Sin club", onSelect: () => onChange(null) } : undefined}
        invalid={invalid}
      />
      {newName && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={!guestClubs.includes(newName)}
            onCheckedChange={(checked) => setGuestClub(newName, !checked)}
            className="h-5 w-5 md:h-4 md:w-4"
          />
          <label htmlFor={id} className="text-sm">Pertenece a FASGBA</label>
        </div>
      )}
    </div>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-terracotta underline-offset-4 hover:underline">
      <RotateCcw className="h-3 w-3" />
      Volver a lo automático
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

/** chess-results team → a site team, or a new team under an existing or new club. */
export function TeamAssignRow({ team, assign }: { team: PlanTeam; assign: AssignProps }) {
  const d = team.decision
  const choice = assign.teamChoices[team.key]
  // Creating a team needs its club first; keep the draft locally until one is picked.
  const [draft, setDraft] = useState<string | null>(null)
  const creating = d.kind === "new" || draft !== null
  const name = d.kind === "new" ? d.name : draft ?? team.name
  const status = d.kind === "enrolled" ? { s: "exists" as const, l: "Inscripto" } : d.kind === "existing" ? { s: "new" as const, l: "Se inscribe" }
    : d.kind === "new" ? { s: "new" as const, l: "Equipo nuevo" } : { s: "skip" as const, l: "Sin asignar" }

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-medium">{team.name}</p>
          <p className="text-xs text-muted-foreground">{team.players} jugadores en chess-results</p>
        </div>
        <PlanStatusBadge status={status.s} label={status.l} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Equipo en el sitio">
          <SearchSelect
            label={`Equipo para ${team.name}`}
            display={creating ? `Equipo nuevo: ${name}` : "teamId" in d ? `${d.siteName}${d.clubName ? ` · ${d.clubName}` : ""}` : <span className="text-muted-foreground">Elegí o creá un equipo</span>}
            options={assign.options.teams.map((t) => ({ value: String(t.id), label: t.name, detail: t.clubName }))}
            selected={"teamId" in d ? String(d.teamId) : null}
            onSelect={(v) => { setDraft(null); assign.setTeam(team.key, { teamId: Number(v) }) }}
            placeholder="Buscar equipo…"
            createLabel={(q) => `Crear equipo nuevo «${q || team.name}»`}
            onCreate={(q) => {
              if (d.kind === "new") assign.setTeam(team.key, { newTeam: q || team.name, club: d.club })
              else setDraft(q || team.name)
            }}
            invalid={d.kind === "unmatched" && draft === null}
          />
        </Field>
        {creating && (
          <Field label="Club del equipo">
            <ClubSelect
              value={d.kind === "new" ? d.club : null}
              onChange={(club) => club && (setDraft(null), assign.setTeam(team.key, { newTeam: name, club }))}
              assign={assign}
              invalid={d.kind !== "new"}
            />
          </Field>
        )}
      </div>
      {creating && (
        <Field label="Nombre del equipo nuevo">
          <Input
            defaultValue={name}
            key={name}
            onBlur={(e) => {
              const value = e.target.value.trim()
              if (!value || value === name) return
              if (d.kind === "new") assign.setTeam(team.key, { newTeam: value, club: d.club })
              else setDraft(value)
            }}
          />
        </Field>
      )}
      {(choice || draft !== null) && <ResetButton onClick={() => { setDraft(null); assign.setTeam(team.key, null) }} />}
    </li>
  )
}

/** chess-results player → an existing player, or a new player with an optional club. */
export function PlayerAssignRow({ player, assign }: { player: PlanPlayer; assign: AssignProps }) {
  const d = player.decision
  const choice = assign.playerChoices[player.key]
  const meta = [player.rating ? `Elo ${player.rating}` : null, player.fideId ? `FIDE ${player.fideId}` : null, player.team ?? player.club].filter(Boolean).join(" · ")

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-medium">{player.title && <span className="mr-1 text-xs text-terracotta">{player.title}</span>}{player.name}</p>
          {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        </div>
        <PlanStatusBadge status={d.kind === "new" ? "new" : "exists"} label={d.kind === "new" ? "Jugador nuevo" : "Existente"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Jugador en el sitio">
          <SearchSelect
            label={`Jugador para ${player.name}`}
            display={d.kind === "existing" ? `${d.siteName}${d.clubName ? ` · ${d.clubName}` : ""}` : `Crear: ${player.name}`}
            options={assign.options.players.map((p) => ({ value: String(p.id), label: p.name, detail: [p.fideId && `FIDE ${p.fideId}`, p.clubName].filter(Boolean).join(" · ") || null }))}
            selected={d.kind === "existing" ? String(d.playerId) : null}
            onSelect={(v) => assign.setPlayer(player.key, { playerId: Number(v) })}
            placeholder="Buscar por nombre o FIDE…"
            createLabel={() => `Crear jugador nuevo «${player.name}»`}
            onCreate={() => assign.setPlayer(player.key, { newPlayer: true, club: null })}
          />
        </Field>
        {d.kind === "new" && (
          <Field label="Club del jugador">
            <ClubSelect
              value={d.club}
              onChange={(club) => assign.setPlayer(player.key, { newPlayer: true, club })}
              assign={assign}
              allowNone
            />
          </Field>
        )}
      </div>
      {choice && <ResetButton onClick={() => assign.setPlayer(player.key, null)} />}
    </li>
  )
}
