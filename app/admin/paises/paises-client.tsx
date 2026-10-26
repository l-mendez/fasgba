'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, Ban, Globe, History, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { CountryRow } from '@/app/admin/paises/country-row'
import { PaisesLogs } from '@/app/admin/paises/paises-logs'
import { AdminConfirmDialog } from '@/components/admin-confirm-dialog'
import { InfoPill } from '@/components/info-pill'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import type {
  CountriesOverview,
  CountryAccessLogItem,
  CountryAccessOverviewItem,
} from '@/lib/admin/countryAccess'
import { CONTINENTS, CONTINENT_KEYS, normalizeForSearch, type Continent } from '@/lib/countries'
import { apiCall } from '@/lib/utils/apiClient'

const PaisesMap = dynamic(() => import('@/app/admin/paises/paises-map').then((mod) => mod.PaisesMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full" />,
})

interface PaisesClientProps {
  initialOverview: CountriesOverview
  initialLogs: CountryAccessLogItem[]
}

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

type PendingChange = { country: CountryAccessOverviewItem; enabled: boolean }
type PendingBulk = { continent: Continent; enabled: boolean }

export function AdminPaisesClient({ initialOverview, initialLogs }: PaisesClientProps) {
  const [overview, setOverview] = useState(initialOverview)
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState('')
  const [continent, setContinent] = useState<'all' | Continent>('all')
  const [sortByBlocked, setSortByBlocked] = useState(false)
  const [savingCode, setSavingCode] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)
  const [pendingBulk, setPendingBulk] = useState<PendingBulk | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const hasCooldowns = overview.countries.some(
    (country) => country.cooldownUntil && new Date(country.cooldownUntil).getTime() > now
  )

  useEffect(() => {
    if (!hasCooldowns) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [hasCooldowns])

  // Never surfaced as an error: the change already succeeded, this only re-syncs.
  const refresh = async () => {
    try {
      const [nextOverview, nextLogs] = await Promise.all([
        apiCall('/api/admin/countries'),
        apiCall('/api/admin/countries/logs'),
      ])
      setOverview(nextOverview)
      setLogs(nextLogs.logs)
    } catch {
      toast.info('No se pudo actualizar la vista. Recarga la página.')
    }
  }

  const applyToggle = async (country: CountryAccessOverviewItem, enabled: boolean) => {
    setSavingCode(country.code)
    try {
      await apiCall('/api/admin/countries', {
        method: 'POST',
        body: JSON.stringify({ country_code: country.code, enabled }),
      })
      await refresh()
      toast.success(`${country.name} ${enabled ? 'habilitado' : 'deshabilitado'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el país')
    } finally {
      setSavingCode(null)
    }
  }

  const handleToggle = (country: CountryAccessOverviewItem, enabled: boolean) => {
    // Disabling a country that is actually being used deserves a confirmation.
    if (!enabled && country.allowed7d > 0) {
      setPendingChange({ country, enabled })
      return
    }
    applyToggle(country, enabled)
  }

  const applyBulk = async ({ continent: target, enabled }: PendingBulk) => {
    setBulkSaving(true)
    try {
      const result = await apiCall('/api/admin/countries/bulk', {
        method: 'POST',
        body: JSON.stringify({ continent: target, enabled }),
      })
      await refresh()

      const updated: number = result.updated.length
      const skipped: number = result.skipped.length
      const verb = enabled ? 'habilitado' : 'deshabilitado'
      toast.success(
        `${plural(updated, `país ${verb}`, `países ${verb}s`)} en ${CONTINENTS[target].label}` +
          (skipped > 0 ? ` · ${plural(skipped, 'omitido', 'omitidos')}` : '')
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el continente')
    } finally {
      setBulkSaving(false)
    }
  }

  const visibleCountries = useMemo(() => {
    const query = normalizeForSearch(search.trim())

    const filtered = overview.countries.filter((country) => {
      if (continent !== 'all' && country.continent !== continent) return false
      if (!query) return true
      return (
        normalizeForSearch(country.name).includes(query) ||
        normalizeForSearch(country.code).includes(query)
      )
    })

    return sortByBlocked ? [...filtered].sort((a, b) => b.blocked7d - a.blocked7d) : filtered
  }, [overview.countries, search, continent, sortByBlocked])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <InfoPill icon={Globe}>{overview.enabledCount} de {overview.totalCount} países habilitados</InfoPill>
          <InfoPill icon={Ban}>{overview.blocked7dTotal} intentos bloqueados (7 días)</InfoPill>
        </div>

        <PaisesMap countries={overview.countries} now={now} onToggle={handleToggle} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por país o código..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={continent} onValueChange={(value) => setContinent(value as 'all' | Continent)}>
            <SelectTrigger className="lg:w-56">
              <SelectValue placeholder="Todos los continentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los continentes</SelectItem>
              {CONTINENT_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {CONTINENTS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={sortByBlocked ? 'default' : 'outline'}
            onClick={() => setSortByBlocked((value) => !value)}
            className="gap-2"
          >
            <ArrowDownWideNarrow className="h-4 w-4" />
            Más bloqueados primero
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" />
                Historial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Historial de cambios</DialogTitle>
              </DialogHeader>
              <PaisesLogs logs={logs} countries={overview.countries} onLogsChange={setLogs} />
            </DialogContent>
          </Dialog>
        </div>

        {continent !== 'all' && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Acciones masivas para <span className="font-medium">{CONTINENTS[continent].label}</span>
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={bulkSaving}
                onClick={() => setPendingBulk({ continent, enabled: true })}
              >
                {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Habilitar todos'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkSaving}
                onClick={() => setPendingBulk({ continent, enabled: false })}
              >
                Deshabilitar todos
              </Button>
            </div>
          </div>
        )}

        {visibleCountries.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No se encontraron países</p>
        ) : (
          <div className="space-y-2">
            {visibleCountries.map((country) => (
              <CountryRow
                key={country.code}
                country={country}
                now={now}
                saving={savingCode === country.code}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        <AdminConfirmDialog
          open={!!pendingChange}
          onOpenChange={(open) => !open && setPendingChange(null)}
          title={`¿Deshabilitar ${pendingChange?.country.name ?? ''}?`}
          description={`Tuvo ${plural(pendingChange?.country.allowed7d ?? 0, 'visita', 'visitas')} en los últimos 7 días. Quienes accedan desde ese país verán una página de acceso restringido.`}
          confirmLabel="Deshabilitar"
          onConfirm={() => {
            if (pendingChange) applyToggle(pendingChange.country, pendingChange.enabled)
            setPendingChange(null)
          }}
        />

        <AdminConfirmDialog
          open={!!pendingBulk}
          onOpenChange={(open) => !open && setPendingBulk(null)}
          title={`¿${pendingBulk?.enabled ? 'Habilitar' : 'Deshabilitar'} ${
            pendingBulk ? CONTINENTS[pendingBulk.continent].label : ''
          }?`}
          description="Se aplicará a todos los países del continente. Argentina y los países en espera de enfriamiento se omiten automáticamente."
          confirmLabel={pendingBulk?.enabled ? 'Habilitar' : 'Deshabilitar'}
          destructive={!pendingBulk?.enabled}
          onConfirm={() => {
            if (pendingBulk) applyBulk(pendingBulk)
            setPendingBulk(null)
          }}
        />
      </div>
    </TooltipProvider>
  )
}
