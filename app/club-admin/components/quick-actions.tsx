"use client"

import Link from "next/link"
import { FileText, Trophy, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useClubContext } from "../context/club-provider"

export function QuickActions() {
  const { selectedClub } = useClubContext()
  
  const newNewsUrl = selectedClub 
    ? `/noticias/nueva?source=club-admin&clubId=${selectedClub.id}`
    : '/noticias/nueva?source=club-admin'

  return (
    <div className="grid gap-3 md:gap-4">
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href={newNewsUrl}>
          <FileText className="mr-2 h-4 w-4" />
          Nueva noticia
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href="/club-admin/torneos/nuevo">
          <Trophy className="mr-2 h-4 w-4" />
          Nuevo torneo
        </Link>
      </Button>
      {selectedClub && (
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href={`/clubes/${selectedClub.id}`}>
            <Users className="mr-2 h-4 w-4" />
            Ver página del club
          </Link>
        </Button>
      )}
    </div>
  )
} 