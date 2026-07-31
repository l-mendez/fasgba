'use client'

import { Ban, Eye, Lock, Timer } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CountryAccessOverviewItem } from '@/lib/admin/countryAccess'
import { PROTECTED_COUNTRY } from '@/lib/countries'
import { formatRelativeTimeEs } from '@/lib/dateUtils'

interface CountryRowProps {
  country: CountryAccessOverviewItem
  saving: boolean
  now: number
  onToggle: (country: CountryAccessOverviewItem, enabled: boolean) => void
}

function remainingLabel(cooldownUntil: string, now: number): string {
  const seconds = Math.max(Math.ceil((new Date(cooldownUntil).getTime() - now) / 1000), 0)
  const minutes = Math.floor(seconds / 60)
  return minutes > 0 ? `${minutes} min ${seconds % 60}s` : `${seconds}s`
}

export function CountryRow({ country, saving, now, onToggle }: CountryRowProps) {
  const isProtected = country.code === PROTECTED_COUNTRY
  const inCooldown = !!country.cooldownUntil && new Date(country.cooldownUntil).getTime() > now
  const disabled = saving || isProtected || inCooldown

  const reason = isProtected
    ? 'Argentina no puede deshabilitarse'
    : inCooldown
      ? `Podés volver a cambiarlo en ${remainingLabel(country.cooldownUntil as string, now)}`
      : null

  const control = (
    <Switch
      checked={country.enabled}
      disabled={disabled}
      onCheckedChange={(checked) => onToggle(country, checked)}
      aria-label={`${country.enabled ? 'Deshabilitar' : 'Habilitar'} ${country.name}`}
    />
  )

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-2xl leading-none" aria-hidden>{country.flag}</span>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {country.name}
            <span className="ml-2 text-xs text-muted-foreground">{country.code}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {country.updatedAt && country.updatedByEmail
              ? `últ. cambio: ${country.updatedByEmail} · ${formatRelativeTimeEs(country.updatedAt, now)}`
              : 'sin cambios registrados'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title="Visitas permitidas (7 días)">
            <Eye className="h-3.5 w-3.5" />
            {country.allowed7d}
          </span>
          <span className="flex items-center gap-1" title="Intentos bloqueados (7 días)">
            <Ban className="h-3.5 w-3.5" />
            {country.blocked7d}
          </span>
        </div>

        {reason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-2">
                {isProtected ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {control}
              </span>
            </TooltipTrigger>
            <TooltipContent>{reason}</TooltipContent>
          </Tooltip>
        ) : (
          control
        )}
      </div>
    </div>
  )
}
