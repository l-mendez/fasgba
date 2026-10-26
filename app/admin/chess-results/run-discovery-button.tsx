"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Radar } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { apiCall } from "@/lib/utils/apiClient"

// Subset of the POST /api/admin/chess-results/run response used here.
interface RunResult {
  discovered: { new: number } | null
  synced?: unknown[]
  errors?: Array<{ message: string }>
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Runs the weekly chess-results discovery/sync job on demand (takes up to ~1 min). */
export function RunDiscoveryButton() {
  const router = useRouter()
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    try {
      const result: RunResult = await apiCall("/api/admin/chess-results/run", { method: "POST" })
      const description = `${count(result.discovered?.new ?? 0, "torneo nuevo", "torneos nuevos")}, ${count(result.synced?.length ?? 0, "sincronizado", "sincronizados")}.`
      const errors = result.errors ?? []
      if (errors.length) {
        toast.warning("Búsqueda terminada con errores", {
          description: `${description} ${errors.map((e) => e.message).join(" · ")}`,
          duration: 15000,
        })
      } else {
        toast.success("Búsqueda terminada", { description })
      }
      router.refresh()
    } catch (err) {
      toast.error("No se pudo buscar en chess-results", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button onClick={run} disabled={running} className="w-full sm:w-auto">
      {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}
      {running ? "Buscando… (hasta 1 min)" : "Buscar ahora"}
    </Button>
  )
}
