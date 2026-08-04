"use client"

import { useState } from "react"
import { Award, FileText, FolderOpen, GraduationCap, Home, ListOrdered, RefreshCw, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { apiCall } from "@/lib/utils/apiClient"

// Scopes must match the keys accepted by /api/admin/cache/revalidate
const SCOPES = [
  { value: "news", label: "Noticias", icon: FileText },
  { value: "clubs", label: "Clubes", icon: Home },
  { value: "torneos", label: "Torneos", icon: Trophy },
  { value: "ranking", label: "Ranking", icon: ListOrdered },
  { value: "profesores", label: "Profesores", icon: GraduationCap },
  { value: "arbitros", label: "Árbitros", icon: Award },
  { value: "documentos", label: "Documentos", icon: FolderOpen },
] as const

export function PurgeCacheMenu() {
  const [isPurging, setIsPurging] = useState(false)
  const { toast } = useToast()

  const purge = async (scope: string, label: string) => {
    setIsPurging(true)

    try {
      await apiCall("/api/admin/cache/revalidate", {
        method: "POST",
        body: JSON.stringify({ scope }),
      })
      toast({
        title: "Caché actualizada",
        description: `Ya se ven los últimos cambios en ${label}.`,
      })
    } catch (error) {
      console.error("Purge cache error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la caché.",
        variant: "destructive",
      })
    } finally {
      setIsPurging(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={isPurging}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isPurging ? "animate-spin" : ""}`} />
          {isPurging ? "Actualizando caché..." : "Actualizar caché del sitio"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
          Usalo si cambiaste datos fuera del sitio y no se ven las novedades.
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => purge("all", "todas las secciones")}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Purgar todo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {SCOPES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => purge(value, label)}>
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
