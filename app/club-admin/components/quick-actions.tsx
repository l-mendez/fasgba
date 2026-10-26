import Link from "next/link"
import { ExternalLink, FileText, Trophy, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clubAdminEditorHref } from "@/lib/club-admin/links"
import type { ClubAdminClub } from "@/lib/club-admin/types"

interface QuickActionsProps {
  selectedClub: ClubAdminClub | null
}

export function QuickActions({ selectedClub }: QuickActionsProps) {
  return (
    <div className="grid gap-2">
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href="/club-admin/jugadores">
          <Users className="mr-2 h-4 w-4" />
          Gestionar jugadores
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href={clubAdminEditorHref("/torneos/nuevo", selectedClub?.id)}>
          <Trophy className="mr-2 h-4 w-4" />
          Nuevo torneo
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href={clubAdminEditorHref("/noticias/nueva", selectedClub?.id)}>
          <FileText className="mr-2 h-4 w-4" />
          Nueva noticia
        </Link>
      </Button>
      {selectedClub && (
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href={`/clubes/${selectedClub.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver página del club
          </Link>
        </Button>
      )}
    </div>
  )
}
