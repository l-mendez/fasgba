"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Edit, Eye, RefreshCw, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { PastRanking } from "./types"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiCall } from "@/lib/utils/apiClient"

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

interface RankingRowActionsProps {
  ranking: PastRanking
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function RankingRowActions({ ranking }: RankingRowActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditDateDialogOpen, setIsEditDateDialogOpen] = useState(false)
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)
  const [editMonth, setEditMonth] = useState("")
  const [editYear, setEditYear] = useState("")

  const openEditDate = () => {
    const match = ranking.name.match(/^ranking-(\d{2})-(\d{4})/)
    if (match) {
      setEditMonth(match[1])
      setEditYear(match[2])
    } else {
      const now = new Date()
      setEditMonth((now.getMonth() + 1).toString().padStart(2, "0"))
      setEditYear(now.getFullYear().toString())
    }

    setIsEditDateDialogOpen(true)
  }

  const handleDeleteRanking = async () => {
    setIsDeleting(true)

    try {
      const result = await apiCall("/api/admin/ranking/delete", {
        method: "DELETE",
        body: JSON.stringify({ filename: ranking.id }),
      })

      if (result.wasLatestRanking) {
        if (result.newLatestRanking) {
          toast.success(`Ranking eliminado. El ranking activo ahora es "${result.newLatestRanking}".`)
        } else {
          toast.success("Ranking eliminado. No quedan rankings disponibles en el sistema.")
        }
      } else {
        toast.success("Ranking eliminado exitosamente.")
      }

      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error instanceof Error ? error.message : "Error al eliminar el ranking")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateDate = async () => {
    if (!editMonth || !editYear) return

    setIsUpdatingDate(true)

    try {
      const result = await apiCall("/api/admin/ranking/update-date", {
        method: "POST",
        body: JSON.stringify({
          currentFilename: ranking.id,
          newMonth: editMonth,
          newYear: editYear,
        }),
      })

      setIsEditDateDialogOpen(false)
      const monthName = monthNames[parseInt(editMonth, 10) - 1]
      toast.success(`Fecha actualizada a ${monthName} ${editYear}. Se recalcularon ${result.affectedRankings} ranking(s).`)
      router.refresh()
    } catch (error) {
      console.error("Update date error:", error)
      toast.error(error instanceof Error ? error.message : "Error al actualizar la fecha")
    } finally {
      setIsUpdatingDate(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
          <Link href={{ pathname: "/ranking", query: { ranking: ranking.id } }}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Ver ranking</span>
          </Link>
        </Button>

        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={openEditDate}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar fecha</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Eliminar ranking</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar ranking?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el ranking {ranking.displayName || ranking.name}
                {" "}del {formatDate(ranking.date)}.
                {ranking.status === "current"
                  ? " Este es el ranking activo actual, y será reemplazado por el siguiente ranking cronológicamente más reciente."
                  : ""}
                {" "}Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRanking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={isEditDateDialogOpen} onOpenChange={setIsEditDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fecha del ranking</DialogTitle>
            <DialogDescription>
              Cambiar la fecha cronológica del ranking {ranking.displayName || ranking.name}.
              Esto puede afectar el orden y las diferencias de posición de otros rankings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-month-${ranking.id}`}>Mes</Label>
              <Select value={editMonth} onValueChange={setEditMonth}>
                <SelectTrigger id={`edit-month-${ranking.id}`}>
                  <SelectValue placeholder="Selecciona el mes" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString().padStart(2, "0")}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-year-${ranking.id}`}>Año</Label>
              <Select value={editYear} onValueChange={setEditYear}>
                <SelectTrigger id={`edit-year-${ranking.id}`}>
                  <SelectValue placeholder="Selecciona el año" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDateDialogOpen(false)} disabled={isUpdatingDate}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDate} disabled={isUpdatingDate || !editMonth || !editYear}>
              {isUpdatingDate ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Actualizar fecha
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
