"use client"

import { Plus, X, Calendar, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { TournamentFormData } from "@/lib/tournament-form-utils"
import { formatTournamentDisplayDate } from "@/lib/tournament-form-utils"

interface TournamentFormFieldsProps {
  formData: TournamentFormData
  validationErrors: Record<string, string>
  newDate: string
  setNewDate: (date: string) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSelectChange: (name: string, value: string) => void
  onAddDate: () => void
  onRemoveDate: (date: string) => void
  isLoading?: boolean
  tournamentTypeExtras?: React.ReactNode
}

export function TournamentFormFields({
  formData,
  validationErrors,
  newDate,
  setNewDate,
  onChange,
  onSelectChange,
  onAddDate,
  onRemoveDate,
  isLoading = false,
  tournamentTypeExtras,
}: TournamentFormFieldsProps) {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-terracotta">Información Básica</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="Nombre del torneo"
              className={validationErrors.title ? "border-red-500" : ""}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-500">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rounds">Número de Rondas</Label>
            <Input
              id="rounds"
              name="rounds"
              type="number"
              min="1"
              value={formData.rounds}
              onChange={onChange}
              placeholder="Ej: 7"
              className={validationErrors.rounds ? "border-red-500" : ""}
            />
            {validationErrors.rounds && (
              <p className="text-sm text-red-500">{validationErrors.rounds}</p>
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
        <h3 className="text-lg font-semibold text-terracotta">Ubicación y Horario</h3>

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
        <h3 className="text-lg font-semibold text-terracotta">Detalles del Torneo</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tournament_type">Tipo de Torneo *</Label>
            {tournamentTypeExtras}
            {isLoading && (
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/50">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Guardando...
              </Badge>
            )}
          </div>
          <Select
            value={formData.tournament_type}
            onValueChange={(value) => onSelectChange('tournament_type', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={validationErrors.tournament_type ? "border-red-500" : ""}>
              <SelectValue placeholder="Seleccionar tipo de torneo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="team">Por Equipos</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.tournament_type && (
            <p className="text-sm text-red-500">{validationErrors.tournament_type}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formData.tournament_type === 'individual'
              ? 'Torneo individual donde cada jugador compite por separado'
              : 'Torneo por equipos donde los clubes compiten entre sí'
            }
          </p>
        </div>

        {formData.tournament_type === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg transition-all duration-300 ease-in-out">
            <div className="space-y-2">
              <Label htmlFor="players_per_team">Jugadores por Equipo</Label>
              <Input
                id="players_per_team"
                name="players_per_team"
                type="number"
                min="1"
                max="20"
                value={formData.players_per_team}
                onChange={onChange}
                placeholder="Ej: 4"
                className={validationErrors.players_per_team ? "border-red-500" : ""}
              />
              {validationErrors.players_per_team && (
                <p className="text-sm text-red-500">{validationErrors.players_per_team}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_teams">Máximo de Equipos</Label>
              <Input
                id="max_teams"
                name="max_teams"
                type="number"
                min="2"
                max="100"
                value={formData.max_teams}
                onChange={onChange}
                placeholder="Ej: 16"
                className={validationErrors.max_teams ? "border-red-500" : ""}
              />
              {validationErrors.max_teams && (
                <p className="text-sm text-red-500">{validationErrors.max_teams}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pace">Ritmo de Juego</Label>
            <Input
              id="pace"
              name="pace"
              value={formData.pace}
              onChange={onChange}
              placeholder="Ej: 90 min + 30 seg/jugada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Costo de Inscripción</Label>
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
          <Label htmlFor="inscription_details">Detalles de Inscripción</Label>
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
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-terracotta">Inscripción y Fechas</h3>

        <div className="space-y-2">
          <Label htmlFor="registration_link">Link de Inscripción</Label>
          <Input
            id="registration_link"
            name="registration_link"
            type="url"
            value={formData.registration_link}
            onChange={onChange}
            placeholder="https://forms.google.com/..."
            className={validationErrors.registration_link ? "border-red-500" : ""}
          />
          {validationErrors.registration_link && (
            <p className="text-sm text-red-500">{validationErrors.registration_link}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Link externo para inscripción (ej: Google Forms, Typeform, etc.)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_deadline">Fecha Límite de Inscripción</Label>
          <Input
            id="registration_deadline"
            name="registration_deadline"
            type="date"
            value={formData.registration_deadline}
            onChange={onChange}
            className={validationErrors.registration_deadline ? "border-red-500" : ""}
          />
          {validationErrors.registration_deadline && (
            <p className="text-sm text-red-500">{validationErrors.registration_deadline}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Fecha límite para que los participantes se inscriban al torneo
          </p>
        </div>

        <div className="space-y-2">
          <Label>Fechas del Torneo *</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={validationErrors.dates ? "border-red-500" : ""}
              />
            </div>
            <Button
              type="button"
              onClick={onAddDate}
              disabled={!newDate}
              className="bg-terracotta hover:bg-terracotta/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {validationErrors.dates && (
            <p className="text-sm text-red-500">{validationErrors.dates}</p>
          )}

          {formData.dates.length > 0 && (
            <div className="space-y-2">
              <Label>Fechas agregadas:</Label>
              <div className="space-y-2">
                {formData.dates.map((date) => (
                  <div key={date} className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-terracotta" />
                      <span>{formatTournamentDisplayDate(date)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveDate(date)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
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
