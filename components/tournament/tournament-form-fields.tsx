"use client"

import { X, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TournamentFormData } from "@/lib/tournament-form-utils"
import { formatTournamentDisplayDate } from "@/lib/tournament-form-utils"
import { ChessResultsLinkField } from "@/components/chess-results/chess-results-link-field"

/** Shared footer for the tournament forms: right-aligned, sticky on mobile. */
export const TOURNAMENT_FORM_ACTIONS_CLASS =
  "sticky bottom-0 flex justify-end gap-2 border-t bg-card py-3 md:static md:border-0 md:py-0"

interface TournamentFormFieldsProps {
  formData: TournamentFormData
  validationErrors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSelectChange: (name: string, value: string) => void
  /** Called as soon as a date is picked. */
  onAddDate: (date: string) => void
  onRemoveDate: (date: string) => void
  isLoading?: boolean
  tournamentTypeExtras?: React.ReactNode
  /** Existing tournament id; enables the chess-results sync action. */
  tournamentId?: number | string
}

export function TournamentFormFields({
  formData,
  validationErrors,
  onChange,
  onSelectChange,
  onAddDate,
  onRemoveDate,
  isLoading = false,
  tournamentTypeExtras,
  tournamentId,
}: TournamentFormFieldsProps) {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-terracotta">Información básica</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="Nombre del torneo"
              className={validationErrors.title ? "border-destructive" : ""}
            />
            {validationErrors.title && (
              <p className="text-sm text-destructive">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rounds">Número de rondas</Label>
            <Input
              id="rounds"
              name="rounds"
              type="number"
              min="1"
              value={formData.rounds}
              onChange={onChange}
              placeholder="Ej: 7"
              className={validationErrors.rounds ? "border-destructive" : ""}
            />
            {validationErrors.rounds && (
              <p className="text-sm text-destructive">{validationErrors.rounds}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Descripción detallada del torneo"
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-terracotta">Ubicación y horario</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="place">Lugar</Label>
            <Input
              id="place"
              name="place"
              value={formData.place}
              onChange={onChange}
              placeholder="Nombre del club o lugar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Dirección</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={onChange}
              placeholder="Dirección completa"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Horario</Label>
          <Input
            id="time"
            name="time"
            value={formData.time}
            onChange={onChange}
            placeholder="Ej: 15:00 hs"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-terracotta">Detalles del torneo</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tournament_type">Tipo de torneo *</Label>
            {tournamentTypeExtras}
          </div>
          <Select
            value={formData.tournament_type}
            onValueChange={(value) => onSelectChange('tournament_type', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={validationErrors.tournament_type ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar tipo de torneo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="team">Por equipos</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.tournament_type && (
            <p className="text-sm text-destructive">{validationErrors.tournament_type}</p>
          )}
        </div>

        {formData.tournament_type === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="players_per_team">Jugadores por equipo</Label>
              <Input
                id="players_per_team"
                name="players_per_team"
                type="number"
                min="1"
                max="20"
                value={formData.players_per_team}
                onChange={onChange}
                placeholder="Ej: 4"
                className={validationErrors.players_per_team ? "border-destructive" : ""}
              />
              {validationErrors.players_per_team && (
                <p className="text-sm text-destructive">{validationErrors.players_per_team}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_teams">Máximo de equipos</Label>
              <Input
                id="max_teams"
                name="max_teams"
                type="number"
                min="2"
                max="100"
                value={formData.max_teams}
                onChange={onChange}
                placeholder="Ej: 16"
                className={validationErrors.max_teams ? "border-destructive" : ""}
              />
              {validationErrors.max_teams && (
                <p className="text-sm text-destructive">{validationErrors.max_teams}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pace">Ritmo de juego</Label>
            <Input
              id="pace"
              name="pace"
              value={formData.pace}
              onChange={onChange}
              placeholder="Ej: 90 min + 30 seg/jugada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Costo de inscripción</Label>
            <Input
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={onChange}
              placeholder="Ej: $5000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inscription_details">Detalles de inscripción</Label>
          <Textarea
            id="inscription_details"
            name="inscription_details"
            value={formData.inscription_details}
            onChange={onChange}
            placeholder="Información sobre cómo inscribirse"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prizes">Premios</Label>
          <Textarea
            id="prizes"
            name="prizes"
            value={formData.prizes}
            onChange={onChange}
            placeholder="Descripción de premios"
            className="min-h-[80px]"
          />
        </div>

        <ChessResultsLinkField
          value={formData.chess_results_link}
          error={validationErrors.chess_results_link}
          onChange={onChange}
          tournamentId={tournamentId}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-terracotta">Inscripción y fechas</h3>

        <div className="space-y-2">
          <Label htmlFor="registration_link">Link de inscripción</Label>
          <Input
            id="registration_link"
            name="registration_link"
            type="url"
            value={formData.registration_link}
            onChange={onChange}
            placeholder="https://forms.google.com/..."
            className={validationErrors.registration_link ? "border-destructive" : ""}
          />
          {validationErrors.registration_link && (
            <p className="text-sm text-destructive">{validationErrors.registration_link}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_deadline">Fecha límite de inscripción</Label>
          <Input
            id="registration_deadline"
            name="registration_deadline"
            type="date"
            value={formData.registration_deadline}
            onChange={onChange}
            className={validationErrors.registration_deadline ? "border-destructive" : ""}
          />
          {validationErrors.registration_deadline && (
            <p className="text-sm text-destructive">{validationErrors.registration_deadline}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tournament_date">Fechas del torneo *</Label>
          {/* Each picked date is added right away; the input stays empty for the next one. */}
          <Input
            id="tournament_date"
            type="date"
            value=""
            onChange={(e) => onAddDate(e.target.value)}
            className={validationErrors.dates ? "border-destructive" : ""}
          />

          {validationErrors.dates && (
            <p className="text-sm text-destructive">{validationErrors.dates}</p>
          )}

          {formData.dates.length > 0 && (
            <div>
              <div className="space-y-1.5">
                {formData.dates.map((date) => (
                  <div key={date} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span>{formatTournamentDisplayDate(date)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar fecha"
                      title="Quitar fecha"
                      onClick={() => onRemoveDate(date)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
