"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clubAdminEditorHref } from "@/lib/club-admin/links"
import { useClubContext } from "../context/club-context"

interface ClubAdminNewButtonProps {
  /** Shared editor path, e.g. "/noticias/nueva". */
  path: string
  label: string
}

/** Header action that opens a shared editor for the selected club. */
export function ClubAdminNewButton({ path, label }: ClubAdminNewButtonProps) {
  const { selectedClub } = useClubContext()

  return (
    <Button asChild className="w-fit">
      <Link href={clubAdminEditorHref(path, selectedClub?.id)}>
        <Plus className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}
