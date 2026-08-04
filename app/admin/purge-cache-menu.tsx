"use client"

import { useRef, useState } from "react"
import {
  Award,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  ListOrdered,
  RefreshCw,
  Trophy,
  type LucideIcon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { CACHE_SCOPES, type CacheScope } from "@/lib/cache/scopes"
import { apiCall } from "@/lib/utils/apiClient"

// Keyed by CacheScope, so a scope added to lib/cache/scopes.ts fails to compile
// until it gets a label and an icon here.
const SCOPE_META: Record<CacheScope, { label: string; icon: LucideIcon }> = {
  news: { label: "Noticias", icon: FileText },
  clubs: { label: "Clubes", icon: Home },
  torneos: { label: "Torneos", icon: Trophy },
  ranking: { label: "Ranking", icon: ListOrdered },
  profesores: { label: "Profesores", icon: GraduationCap },
  arbitros: { label: "Árbitros", icon: Award },
  documentos: { label: "Documentos", icon: FolderOpen },
}

export function PurgeCacheMenu() {
  const [isPurging, setIsPurging] = useState(false)
  const [isConfirmingAll, setIsConfirmingAll] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { toast } = useToast()

  const purge = async (scope: CacheScope | "all", label: string) => {
    // The trigger stays enabled so Radix can return focus to it on close;
    // re-entry is guarded here instead.
    if (isPurging) return
    setIsPurging(true)

    try {
      await apiCall("/api/admin/cache/revalidate", {
        method: "POST",
        body: JSON.stringify({ scope }),
      })
      toast({
        title: "Caché actualizada",
        description: `Los últimos cambios en ${label} se verán en unos segundos.`,
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            className="w-full justify-start"
            aria-busy={isPurging}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPurging ? "animate-spin" : ""}`} />
            {isPurging ? "Actualizando caché..." : "Actualizar caché del sitio"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
            Usalo si cambiaste datos fuera del sitio y no se ven las novedades.
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Confirmation only here: purging everything regenerates the whole site.
              The dialog is a sibling of the menu, not a child of this item, because a
              Radix dialog nested in a menu item loses focus when the menu closes. */}
          <DropdownMenuItem disabled={isPurging} onSelect={() => setIsConfirmingAll(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar todo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {CACHE_SCOPES.map((scope) => {
            const { label, icon: Icon } = SCOPE_META[scope]
            return (
              <DropdownMenuItem
                key={scope}
                disabled={isPurging}
                onSelect={() => purge(scope, label)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmingAll} onOpenChange={setIsConfirmingAll}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // Radix would restore focus to the menu item that opened this dialog,
            // but that item is already unmounted, so focus would land on <body>.
            event.preventDefault()
            triggerRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Actualizar todas las secciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Se van a volver a generar todas las páginas del sitio, incluso las que no
              cambiaron. Si sabés qué sección cambió, actualizá solo esa: es más rápido y
              no recarga el sitio entero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPurging}
              onClick={() => purge("all", "todas las secciones")}
            >
              {isPurging ? "Actualizando..." : "Sí, actualizar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
