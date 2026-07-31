'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { CountryAccessOverviewItem } from '@/lib/admin/countryAccess'
import { alpha2FromNumeric } from '@/lib/country-numeric-codes'
import { PROTECTED_COUNTRY } from '@/lib/countries'
import { cn } from '@/lib/utils'

// world-atlas 110m topojson (numeric ISO ids), decoded and projected inline to
// avoid a mapping dependency.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const WIDTH = 900
const HEIGHT = 440
const LAT_MAX = 84
const LAT_MIN = -58

type Ring = number[]
type Geometry = { id?: string | number; type: string; arcs: Ring[] | Ring[][] }
type Topology = {
  transform: { scale: [number, number]; translate: [number, number] }
  arcs: number[][][]
  objects: { countries: { geometries: Geometry[] } }
}

/** Equirectangular projection, cropped to the inhabited latitudes. */
function project(lon: number, lat: number): [number, number] {
  return [
    ((lon + 180) / 360) * WIDTH,
    ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT,
  ]
}

/** Decoded arc as [lon, lat] pairs; projection happens once the ring is unwrapped. */
function decodeArc(topology: Topology, index: number): Array<[number, number]> {
  const reversed = index < 0
  const arc = topology.arcs[reversed ? ~index : index]
  const [sx, sy] = topology.transform.scale
  const [tx, ty] = topology.transform.translate

  let x = 0
  let y = 0
  const points = arc.map(([dx, dy]): [number, number] => {
    x += dx
    y += dy
    return [x * sx + tx, y * sy + ty]
  })

  return reversed ? points.reverse() : points
}

function subPath(points: Array<[number, number]>, lonOffset: number): string {
  return `${points
    .map(([lon, lat], index) => {
      const [x, y] = project(lon + lonOffset, lat)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join('')}Z`
}

function ringToPath(topology: Topology, ring: Ring): string {
  const points = ring.flatMap((index, position) => {
    const arc = decodeArc(topology, index)
    return position === 0 ? arc : arc.slice(1)
  })

  // Rings that cross the antimeridian (Russia, Fiji) jump from +180 to -180 and
  // would otherwise be drawn as a streak across the whole map. Make the
  // longitudes continuous, then draw the copies that fall inside the viewport.
  let shift = 0
  const unwrapped: Array<[number, number]> = []
  points.forEach(([lon, lat], index) => {
    if (index > 0) {
      const delta = lon + shift - unwrapped[index - 1][0]
      if (delta > 180) shift -= 360
      else if (delta < -180) shift += 360
    }
    unwrapped.push([lon + shift, lat])
  })

  const lons = unwrapped.map(([lon]) => lon)
  const offsets = [0]
  if (Math.max(...lons) > 180) offsets.push(-360)
  if (Math.min(...lons) < -180) offsets.push(360)

  return offsets.map((offset) => subPath(unwrapped, offset)).join('')
}

function geometryToPath(topology: Topology, geometry: Geometry): string {
  const polygons = (
    geometry.type === 'MultiPolygon' ? geometry.arcs : [geometry.arcs]
  ) as Ring[][]

  return polygons.map((rings) => rings.map((ring) => ringToPath(topology, ring)).join('')).join('')
}


interface PaisesMapProps {
  countries: CountryAccessOverviewItem[]
  /** Ticking clock owned by the parent, so cooldowns stay pure across renders. */
  now: number
  onToggle: (country: CountryAccessOverviewItem, enabled: boolean) => void
}

type Selection = { code: string; x: number; y: number }

export function PaisesMap({ countries, now, onToggle }: PaisesMapProps) {
  const [topology, setTopology] = useState<Topology | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    fetch(GEO_URL)
      .then((response) => response.json())
      .then((data: Topology) => {
        if (active && data?.transform) setTopology(data)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelection(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const shapes = useMemo(() => {
    if (!topology) return []

    return topology.objects.countries.geometries.flatMap((geometry) => {
      const code = geometry.id != null ? alpha2FromNumeric(geometry.id) : null
      try {
        return [{ code, path: geometryToPath(topology, geometry) }]
      } catch {
        return []
      }
    })
  }, [topology])

  const byCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries]
  )

  const selected = selection ? byCode.get(selection.code) ?? null : null
  const isProtected = selected?.code === PROTECTED_COUNTRY
  const inCooldown =
    !!selected?.cooldownUntil && new Date(selected.cooldownUntil).getTime() > now
  const canToggle = !!selected && !isProtected && !inCooldown

  const selectCountry = (code: string, event: ReactMouseEvent<SVGPathElement>) => {
    event.stopPropagation()
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return

    setSelection((current) =>
      current?.code === code
        ? null
        : { code, x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    )
  }

  return (
    <div ref={containerRef} className="relative rounded-lg border p-2" onClick={() => setSelection(null)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Mapa de países habilitados"
      >
        {shapes.map((shape, index) => {
          const country = shape.code ? byCode.get(shape.code) : undefined
          const isSelected = !!shape.code && shape.code === selection?.code

          return (
            <path
              key={shape.code ?? `geo-${index}`}
              d={shape.path}
              className={
                isSelected
                  ? 'fill-terracotta stroke-foreground'
                  : country?.enabled
                    ? 'fill-amber stroke-background hover:fill-amber-dark'
                    : 'fill-muted stroke-background hover:fill-muted-foreground/40'
              }
              strokeWidth={isSelected ? 1.5 : 0.5}
              style={{ cursor: country ? 'pointer' : 'default' }}
              onMouseEnter={() => setHovered(country?.name ?? shape.code)}
              onMouseLeave={() => setHovered(null)}
              onClick={(event) => (country ? selectCountry(country.code, event) : undefined)}
            />
          )
        })}
      </svg>

      {selected && selection && (
        <div
          className={cn(
            'absolute z-20 w-60 -translate-x-1/2 rounded-lg border bg-popover p-3 shadow-lg',
            // Flip below the click when there is no room above.
            selection.y > 150 ? '-translate-y-full' : ''
          )}
          style={{
            left: `min(max(${selection.x}px, 7.5rem), calc(100% - 7.5rem))`,
            top: `${selection.y > 150 ? selection.y - 8 : selection.y + 8}px`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">
              {selected.flag} {selected.name}
            </p>
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {canToggle ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.enabled ? 'Deshabilitar' : 'Habilitar'} usuarios de {selected.name}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelection(null)}>
                  No
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onToggle(selected, !selected.enabled)
                    setSelection(null)
                  }}
                >
                  Sí
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {isProtected
                ? 'Argentina no puede deshabilitarse.'
                : 'Se modificó hace poco. Probá de nuevo en unos minutos.'}
            </p>
          )}
        </div>
      )}

      <p className="px-2 pb-1 text-xs text-muted-foreground">
        {hovered ??
          (shapes.length
            ? 'Tocá un país para habilitarlo o deshabilitarlo.'
            : 'Cargando mapa...')}
      </p>
    </div>
  )
}
