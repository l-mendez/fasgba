'use client'

import { Component, useState, type ReactNode } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

import type { CountryAccessOverviewItem } from '@/lib/admin/countryAccess'
import { alpha2FromNumeric } from '@/lib/country-numeric-codes'

// world-atlas 110m topojson (numeric ISO ids).
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface PaisesMapProps {
  countries: CountryAccessOverviewItem[]
}

/** The map is decorative and depends on a CDN, so it must never break the panel. */
class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
          No se pudo cargar el mapa.
        </p>
      )
    }
    return this.props.children
  }
}

export function PaisesMap(props: PaisesMapProps) {
  return (
    <MapErrorBoundary>
      <WorldMap {...props} />
    </MapErrorBoundary>
  )
}

function WorldMap({ countries }: PaisesMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const enabledCodes = new Set(countries.filter((country) => country.enabled).map((c) => c.code))
  const namesByCode = new Map(countries.map((country) => [country.code, country.name]))

  return (
    <div className="rounded-lg border p-2">
      <ComposableMap
        projectionConfig={{ scale: 145 }}
        height={380}
        className="h-auto w-full"
        aria-label="Mapa de países habilitados"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = alpha2FromNumeric(geo.id as string)
              const enabled = !!code && enabledCodes.has(code)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setHovered(code ? namesByCode.get(code) ?? code : null)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    default: {
                      fill: enabled ? 'var(--color-amber, #daa056)' : 'var(--muted, #e5e5e5)',
                      stroke: 'var(--background, #fff)',
                      strokeWidth: 0.3,
                      outline: 'none',
                    },
                    hover: { fill: enabled ? '#c98c3c' : '#c4c4c4', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
      <p className="px-2 pb-1 text-xs text-muted-foreground">
        {hovered ?? 'Los países habilitados aparecen resaltados.'}
      </p>
    </div>
  )
}
