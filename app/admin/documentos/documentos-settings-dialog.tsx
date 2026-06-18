"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Slider } from "@/components/ui/slider"
import { apiCall } from "@/lib/utils/apiClient"
import {
  CATEGORY_COLORS,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/lib/documentosUtils"
import type { CategoryImportance } from "./types"

interface DocumentosSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCategoryImportance: CategoryImportance
  onSaved: () => Promise<void> | void
  setErrorMessage: (message: string) => void
  setSuccessMessage: (message: string) => void
}

export function DocumentosSettingsDialog({
  open,
  onOpenChange,
  initialCategoryImportance,
  onSaved,
  setErrorMessage,
  setSuccessMessage,
}: DocumentosSettingsDialogProps) {
  const [categoryImportance, setCategoryImportance] =
    useState<CategoryImportance>(initialCategoryImportance)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const saveSettings = async () => {
    setIsSavingSettings(true)
    setErrorMessage("")

    try {
      await apiCall("/api/admin/documentos/settings", {
        method: "POST",
        body: JSON.stringify({ categoryImportance }),
      })

      setSuccessMessage("Configuración guardada exitosamente")
      onOpenChange(false)

      // Reload documents if sorting by importance
      await onSaved()
    } catch (error) {
      console.error("Save settings error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error al guardar la configuración"
      )
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuración de orden</DialogTitle>
          <DialogDescription>
            Define la importancia de cada categoría para el ordenamiento por importancia.
            Las categorías con mayor valor aparecerán primero.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`importance-${key}`}>
                  <Badge
                    variant="secondary"
                    className={CATEGORY_COLORS[key as DocumentCategory]}
                  >
                    {label}
                  </Badge>
                </Label>
                <span className="text-sm text-muted-foreground">
                  {categoryImportance[key as DocumentCategory]}
                </span>
              </div>
              <Slider
                id={`importance-${key}`}
                min={0}
                max={100}
                step={1}
                value={[categoryImportance[key as DocumentCategory]]}
                onValueChange={(values: number[]) =>
                  setCategoryImportance((prev) => ({
                    ...prev,
                    [key]: values[0],
                  }))
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSavingSettings}
          >
            Cancelar
          </Button>
          <Button onClick={saveSettings} disabled={isSavingSettings}>
            {isSavingSettings ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
