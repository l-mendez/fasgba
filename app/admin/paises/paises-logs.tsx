'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CountryAccessLogItem, CountryAccessOverviewItem } from '@/lib/admin/countryAccess'
import { formatArgentinaDate } from '@/lib/dateUtils'
import { apiCall } from '@/lib/utils/apiClient'

const PAGE_SIZE = 20

interface PaisesLogsProps {
  logs: CountryAccessLogItem[]
  countries: CountryAccessOverviewItem[]
  onLogsChange: (logs: CountryAccessLogItem[]) => void
}

export function PaisesLogs({ logs, countries, onLogsChange }: PaisesLogsProps) {
  const [country, setCountry] = useState('all')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(logs.length >= PAGE_SIZE)

  const load = async (nextCountry: string, offset: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      if (nextCountry !== 'all') params.set('country', nextCountry)

      const data = await apiCall(`/api/admin/countries/logs?${params.toString()}`)
      onLogsChange(offset === 0 ? data.logs : [...logs, ...data.logs])
      setHasMore(data.hasMore)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }

  const changedCountries = countries.filter((item) => item.updatedAt)

  return (
    <div className="space-y-3">
      <Select
        value={country}
        onValueChange={(value) => {
          setCountry(value)
          load(value, 0)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Todos los países" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los países</SelectItem>
          {changedCountries.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.flag} {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no hay cambios registrados.
          </p>
        ) : (
          <ul className="divide-y">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden>{log.flag}</span>
                  <span className="font-medium">{log.name}</span>
                  <Badge variant={log.action === 'enabled' ? 'default' : 'destructive'}>
                    {log.action === 'enabled' ? 'Habilitado' : 'Deshabilitado'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground sm:text-right">
                  <span>{log.changedByEmail || 'sistema'}</span>
                  <span className="mx-1">·</span>
                  <span>{formatArgentinaDate(log.createdAt, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={() => load(country, logs.length)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cargar más'}
          </Button>
        )}
      </div>
    </div>
  )
}
