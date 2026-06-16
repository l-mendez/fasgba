"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileSpreadsheet, RefreshCw, Save, Trash2, Upload } from "lucide-react"

import type { RankingPlayer } from "./types"

import { ErrorAlert } from "@/components/error-alert"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { uploadRankingAction } from "@/lib/actions/ranking"
import { apiCall } from "@/lib/utils/apiClient"

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

interface RankingUploadClientProps {
  existingRankingNames?: string[]
}

export function RankingUploadClient({ existingRankingNames = [] }: RankingUploadClientProps) {
  const router = useRouter()
  const currentDate = useMemo(() => new Date(), [])
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [previewData, setPreviewData] = useState<RankingPlayer[]>([])
  const [tempJsonPath, setTempJsonPath] = useState<string | null>(null)
  const [tempAnalyticsPath, setTempAnalyticsPath] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

  const generatedFilename = useMemo(() => {
    const baseFilename = `ranking-${selectedMonth.padStart(2, "0")}-${selectedYear}`
    let filename = baseFilename
    let counter = 2

    while (existingRankingNames.includes(filename)) {
      filename = `${baseFilename} (${counter})`
      counter++
    }

    return filename
  }, [selectedMonth, selectedYear, existingRankingNames])

  const resetUploadMessages = () => {
    setUploadStatus("idle")
    setPreviewData([])
    setErrorMessage("")
    setSuccessMessage("")
  }

  const setExcelFile = (uploadedFile: File) => {
    if (uploadedFile.name.endsWith(".xlsx") || uploadedFile.name.endsWith(".xls")) {
      setFile(uploadedFile)
      resetUploadMessages()
      return
    }

    setErrorMessage("Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)")
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("month", selectedMonth)
      formData.append("year", selectedYear)

      const result = await uploadRankingAction(formData)

      if (!result.ok) {
        throw new Error(result.error || "Error desconocido al procesar el archivo")
      }

      const data = result.data
      setPreviewData(data.previewData || [])
      setTempJsonPath(data.tempJsonPath)
      setTempAnalyticsPath(data.tempAnalyticsPath || null)
      setUploadStatus("success")
      const analyticsMsg = data.hasAnalytics ? ` Se encontraron ${data.analyticsCount} registros analíticos.` : ""
      setSuccessMessage(`Archivo procesado correctamente. Se encontraron ${data.totalPlayers || 0} jugadores.${analyticsMsg} Revisa la vista previa y guarda los cambios.`)
    } catch (error) {
      console.error("Upload error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido al procesar el archivo. Verifica el formato y vuelve a intentarlo.")
      setUploadStatus("error")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!tempJsonPath || isSaving || isProcessing) return

    setIsProcessing(true)
    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await apiCall("/api/admin/ranking/confirm", {
        method: "POST",
        body: JSON.stringify({
          tempJsonPath,
          tempAnalyticsPath,
          filename: generatedFilename,
        }),
      })

      setFile(null)
      setPreviewData([])
      setUploadStatus("idle")
      setTempJsonPath(null)
      setTempAnalyticsPath(null)
      setSuccessMessage(`Ranking "${generatedFilename}" guardado exitosamente. El ranking ya está disponible en el sistema.`)
      router.refresh()
    } catch (error) {
      console.error("Save error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido al guardar el ranking. Intenta nuevamente.")
    } finally {
      setIsSaving(false)
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!tempJsonPath || isCancelling || isProcessing) return

    setIsProcessing(true)
    setIsCancelling(true)
    setErrorMessage("")

    try {
      await apiCall("/api/admin/ranking/cancel", {
        method: "POST",
        body: JSON.stringify({ tempJsonPath, tempAnalyticsPath }),
      })
    } catch (error) {
      console.warn("Error during cancel cleanup:", error)
    } finally {
      setFile(null)
      setPreviewData([])
      setUploadStatus("idle")
      setTempJsonPath(null)
      setTempAnalyticsPath(null)
      setIsCancelling(false)
      setIsProcessing(false)
      setErrorMessage("")
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}
      {successMessage ? (
        <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="month-select">Mes</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="month-select">
              <SelectValue placeholder="Selecciona el mes" />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year-select">Año</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="year-select">
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

        <div className="space-y-2">
          <Label>Nombre del archivo</Label>
          <div className="flex items-center h-10 px-3 py-2 border border-input bg-background rounded-md text-sm">
            <code className="text-muted-foreground">{generatedFilename}</code>
          </div>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragOver(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragOver(false)
          if (event.dataTransfer.files.length > 0) {
            setExcelFile(event.dataTransfer.files[0])
          }
        }}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {file ? file.name : "Arrastra tu archivo aquí o haz clic para seleccionar"}
          </p>
          <p className="text-sm text-muted-foreground">
            Formatos soportados: .xlsx, .xls (máximo 10MB)
          </p>
        </div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => {
            const uploadedFile = event.target.files?.[0]
            if (uploadedFile) setExcelFile(uploadedFile)
          }}
          className="hidden"
          id="file-upload"
        />
        <Button asChild variant="outline" className="mt-4" disabled={isUploading}>
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Seleccionar archivo
          </label>
        </Button>
      </div>

      {uploadStatus === "success" && !successMessage ? (
        <Alert className="mt-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Archivo procesado correctamente. Revisa la vista previa y guarda los cambios.
          </AlertDescription>
        </Alert>
      ) : null}

      {uploadStatus === "error" && !errorMessage ? (
        <ErrorAlert message="Error al procesar el archivo. Verifica el formato y vuelve a intentarlo." className="mt-4" />
      ) : null}

      {file ? (
        <div className="flex gap-2 mt-4">
          {uploadStatus !== "success" ? (
            <Button type="button" onClick={handleUpload} disabled={isUploading} className="flex-1 sm:flex-none">
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Procesar archivo
                </>
              )}
            </Button>
          ) : (
            <>
              <Button type="button" onClick={handleSave} disabled={isSaving || isProcessing} className="flex-1 sm:flex-none">
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Guardando como {generatedFilename}...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar como {generatedFilename}
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling || isProcessing}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancelar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      ) : null}

      {uploadStatus === "success" && previewData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa del ranking</CardTitle>
            <CardDescription>
              Revisa los datos antes de guardar los cambios como {generatedFilename}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  Ranking cargado - {previewData.length} jugadores (mostrando primeros 10)
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-right">Standard</TableHead>
                    <TableHead className="text-right">Rápido</TableHead>
                    <TableHead className="text-right">Blitz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((player) => (
                    <TableRow key={player.position}>
                      <TableCell className="font-medium">#{player.position}</TableCell>
                      <TableCell className="font-medium">
                        {player.title ? (
                          <span>
                            <span className="text-primary font-medium">{player.title}</span>
                            <span> {player.name}</span>
                          </span>
                        ) : (
                          <span>{player.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{player.club}</TableCell>
                      <TableCell className="text-right font-mono">
                        {player.ratings?.standard ? Math.round(player.ratings.standard) : "--"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {player.ratings?.rapid ? Math.round(player.ratings.rapid) : "--"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {player.ratings?.blitz ? Math.round(player.ratings.blitz) : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
