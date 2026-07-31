'use client'

import { useEffect, useMemo, useState } from 'react'

import type { CountryAccessOverviewItem } from '@/lib/admin/countryAccess'
import { alpha2FromNumeric } from '@/lib/country-numeric-codes'

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

function decodeArc(topology: Topology, index: number): Array<[number, number]> {
  const reversed = index < 0
  const arc = topology.arcs[reversed ? ~index : index]
  const [sx, sy] = topology.transform.scale
  const [tx, ty] = topology.transform.translate

  let x = 0
  let y = 0
  const points = arc.map(([dx, dy]) => {
    x += dx
    y += dy
    return project(x * sx + tx, y * sy + ty)
  })

  return reversed ? points.reverse() : points
}

function ringToPath(topology: Topology, ring: Ring): string {
  const points = ring.flatMap((index, position) => {
    const arc = decodeArc(topology, index)
    return position === 0 ? arc : arc.slice(1)
  })

  return `${points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join('')}Z`
}

function geometryToPath(topology: Topology, geometry: Geometry): string {
  const polygons = (
    geometry.type === 'MultiPolygon' ? geometry.arcs : [geometry.arcs]
  ) as Ring[][]

  return polygons.map((rings) => rings.map((ring) => ringToPath(topology, ring)).join('')).join('')
}

interface PaisesMapProps {
  countries: CountryAccessOverviewItem[]
}

export function PaisesMap({ countries }: PaisesMapProps) {
  const [topology, setTopology] = useState<Topology | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

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

  const enabledCodes = useMemo(
    () => new Set(countries.filter((country) => country.enabled).map((country) => country.code)),
    [countries]
  )
  const namesByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country.name])),
    [countries]
  )

  return (
    <div className="rounded-lg border p-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Mapa de países habilitados"
      >
        {shapes.map((shape, index) => {
          const enabled = !!shape.code && enabledCodes.has(shape.code)

          return (
            <path
              key={shape.code ?? `geo-${index}`}
              d={shape.path}
              className={
                enabled
                  ? 'fill-amber stroke-background hover:fill-amber-dark'
                  : 'fill-muted stroke-background hover:fill-muted-foreground/40'
              }
              strokeWidth={0.5}
              onMouseEnter={() =>
                setHovered(shape.code ? namesByCode.get(shape.code) ?? shape.code : null)
              }
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </svg>
      <p className="px-2 pb-1 text-xs text-muted-foreground">
        {hovered ?? (shapes.length ? 'Los países habilitados aparecen resaltados.' : 'Cargando mapa...')}
      </p>
    </div>
  )
}
