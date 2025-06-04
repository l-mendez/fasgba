"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useClubContext } from "../context/club-provider"

export function NewNewsButton() {
  const { selectedClub } = useClubContext()
  
  const newNewsUrl = selectedClub 
    ? `/noticias/nueva?source=club-admin&clubId=${selectedClub.id}`
    : '/noticias/nueva?source=club-admin'

  return (
    <Button asChild className="w-fit">
      <Link href={newNewsUrl}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva Noticia
      </Link>
    </Button>
  )
} 