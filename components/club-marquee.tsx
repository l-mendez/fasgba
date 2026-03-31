'use client'

import Link from 'next/link'
import { useRef } from 'react'

interface Club {
  id: number
  name: string
}

export function ClubMarquee({ clubs }: { clubs: Club[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const doubled = [...clubs, ...clubs]

  return (
    <div
      className="marquee-container overflow-hidden"
      onMouseEnter={() => trackRef.current && (trackRef.current.style.animationPlayState = 'paused')}
      onMouseLeave={() => trackRef.current && (trackRef.current.style.animationPlayState = 'running')}
    >
      <div ref={trackRef} className="marquee-track flex gap-6">
        {doubled.map((club, i) => (
          <Link
            key={`${club.id}-${i}`}
            href={`/clubes/${club.id}`}
            className="flex-shrink-0 rounded-xl border border-amber/30 dark:border-amber/20 bg-amber/5 dark:bg-background/80 backdrop-blur-sm px-8 py-5 shadow-sm dark:shadow-none transition-all duration-300 hover:border-amber hover:shadow-lg hover:shadow-amber/10 hover:-translate-y-1"
          >
            <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
              {club.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
