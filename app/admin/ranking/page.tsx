"use client"

import { useState, useEffect } from "react"
import { Upload, FileSpreadsheet, Save, RefreshCw, AlertCircle, CheckCircle2, Trash2, Calendar, Eye, Edit } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

// Month names in Spanish
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

// Generate year options (current year ± 5 years)
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

interface RankingPlayer {
  position: number;
  name: string;
  club: string;
  points: number;
  matches: number;
}

interface PastRanking {
  id: string;
  name: string;
  displayName?: string;
  date: string;
  totalPlayers: number;
  status: 'current' | 'archived';
  filePath: string;
}

export default function AdminRankingPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [previewData, setPreviewData] = useState<RankingPlayer[]>([])
  const [pastRankings, setPastRankings] = useState<PastRanking[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tempJsonPath, setTempJsonPath] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Date state - default to current month and year
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

  // Edit date dialog state
  const [isEditDateDialogOpen, setIsEditDateDialogOpen] = useState(false)
  const [editingRanking, setEditingRanking] = useState<PastRanking | null>(null)
  const [editMonth, setEditMonth] = useState('')
  const [editYear, setEditYear] = useState('')
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)

  // Generate filename with duplicate handling
  const generateFilename = () => {
    const baseFilename = `ranking-${selectedMonth.padStart(2, '0')}-${selectedYear}`
    
    // Check for duplicates in past rankings
    const existingNames = pastRankings.map(ranking => ranking.name)
    let filename = baseFilename
    let counter = 2
    
    while (existingNames.includes(filename)) {
      filename = `${baseFilename} (${counter})`
      counter++
    }
    
    return filename
  }

  // Load existing rankings on component mount
  useEffect(() => {
    loadPastRankings()
  }, [])

  const loadPastRankings = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('No session found')
        setErrorMessage('Sesión no válida. Por favor, inicia sesión nuevamente.')
        return
      }

      const response = await fetch('/api/admin/ranking/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setPastRankings(result.rankings || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to load rankings. Status:', response.status, 'Error:', errorData)
        setErrorMessage(`Error al cargar los rankings existentes (${response.status}). ${errorData.error || 'Verifica tu conexión e intenta nuevamente.'}`)
      }
    } catch (error) {
      console.error('Error loading rankings:', error)
      setErrorMessage(`Error de conexión al cargar rankings: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const uploadedFile = files[0]
      if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        setFile(uploadedFile)
        setUploadStatus('idle')
        setPreviewData([])
        setErrorMessage('')
        setSuccessMessage('')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const uploadedFile = files[0]
      if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        setFile(uploadedFile)
        setUploadStatus('idle')
        setPreviewData([])
        setErrorMessage('')
        setSuccessMessage('')
      } else {
        setErrorMessage('Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('month', selectedMonth)
      formData.append('year', selectedYear)

      const response = await fetch('/api/admin/ranking/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = errorData.error || `Error del servidor (${response.status})`
        throw new Error(errorMsg)
      }

      const result = await response.json()
      setPreviewData(result.previewData || [])
      setTempJsonPath(result.tempJsonPath)
      setUploadStatus('success')
      setSuccessMessage(`Archivo procesado correctamente. Se encontraron ${result.previewData?.length || 0} jugadores. Revisa la vista previa y guarda los cambios.`)
      
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al procesar el archivo. Verifica el formato y vuelve a intentarlo.')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!tempJsonPath) return

    setIsUploading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.')
      }

      const response = await fetch('/api/admin/ranking/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tempJsonPath,
          filename: generateFilename()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = errorData.error || `Error del servidor (${response.status})`
        throw new Error(errorMsg)
      }

      const result = await response.json()
      console.log('Ranking saved successfully:', result.filename)
      
      // Reset form
      setFile(null)
      setPreviewData([])
      setUploadStatus('idle')
      setTempJsonPath(null)
      
      // Show success message
      setSuccessMessage(`¡Ranking "${generateFilename()}" guardado exitosamente! El ranking ya está disponible en el sistema.`)
      
      // Reload rankings list
      await loadPastRankings()
      
    } catch (error) {
      console.error('Save error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al guardar el ranking. Intenta nuevamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteRanking = async (ranking: PastRanking) => {
    setDeletingId(ranking.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.')
      }

      const response = await fetch('/api/admin/ranking/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: ranking.id // Use the ranking ID which is the filename without extension
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = errorData.error || `Error del servidor (${response.status})`
        throw new Error(errorMsg)
      }

      const result = await response.json()
      
      // Remove from local state
      setPastRankings(pastRankings.filter(r => r.id !== ranking.id))
      
      // Clear ranking cache to ensure fresh data
      if (typeof window !== 'undefined') {
        // Clear cache by making a request to invalidate it
        fetch('/api/ranking/latest', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }).catch(() => {
          // Ignore cache clear errors
        })
      }
      
      // Show success message with information about active ranking change
      if (result.wasLatestRanking) {
        if (result.newLatestRanking) {
          setSuccessMessage(`¡Ranking "${ranking.displayName || ranking.name}" eliminado exitosamente! El ranking activo ahora es: "${result.newLatestRanking}". Los cambios ya están activos en el sistema.`)
        } else {
          setSuccessMessage(`¡Ranking "${ranking.displayName || ranking.name}" eliminado exitosamente! No quedan rankings disponibles en el sistema.`)
        }
      } else {
        setSuccessMessage(`¡Ranking "${ranking.displayName || ranking.name}" eliminado exitosamente! El ranking actual no se ha visto afectado.`)
      }
      
      // Reload rankings list to get updated data
      await loadPastRankings()
      
    } catch (error) {
      console.error('Delete error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al eliminar el ranking. Intenta nuevamente.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEditDate = (ranking: PastRanking) => {
    // Extract month and year from the ranking filename
    const match = ranking.name.match(/^ranking-(\d{2})-(\d{4})/)
    if (match) {
      setEditMonth(match[1])
      setEditYear(match[2])
    } else {
      // Fallback to current date
      setEditMonth((currentDate.getMonth() + 1).toString())
      setEditYear(currentDate.getFullYear().toString())
    }
    
    setEditingRanking(ranking)
    setIsEditDateDialogOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleUpdateDate = async () => {
    if (!editingRanking || !editMonth || !editYear) return

    setIsUpdatingDate(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.')
      }

      const response = await fetch('/api/admin/ranking/update-date', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentFilename: editingRanking.id,
          newMonth: editMonth,
          newYear: editYear
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = errorData.error || `Error del servidor (${response.status})`
        throw new Error(errorMsg)
      }

      const result = await response.json()
      
      // Close dialog
      setIsEditDateDialogOpen(false)
      setEditingRanking(null)
      
      // Show success message
      const monthName = monthNames[parseInt(editMonth) - 1]
      setSuccessMessage(`¡Fecha del ranking actualizada exitosamente a ${monthName} ${editYear}! Se actualizaron ${result.affectedRankings} ranking(s) y las diferencias de posición han sido recalculadas.`)
      
      // Reload rankings list
      await loadPastRankings()
      
    } catch (error) {
      console.error('Update date error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al actualizar la fecha. Intenta nuevamente.')
    } finally {
      setIsUpdatingDate(false)
    }
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Ranking</h2>
        <Badge variant="outline" className="w-fit">
          <FileSpreadsheet className="mr-1 h-3 w-3" />
          Actualización por Excel
        </Badge>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subir archivo de ranking</CardTitle>
          <CardDescription>
            Selecciona un archivo Excel (.xlsx) con los datos actualizados del ranking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month and Year Selection */}
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
                <code className="text-muted-foreground">{generateFilename()}</code>
              </div>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {file ? file.name : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos soportados: .xlsx, .xls (máximo 10MB)
              </p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button 
              asChild 
              variant="outline" 
              className="mt-4"
              disabled={isUploading}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Seleccionar archivo
              </label>
            </Button>
          </div>

          {/* Upload Status */}
          {uploadStatus === 'success' && !successMessage && (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Archivo procesado correctamente. Revisa la vista previa y guarda los cambios.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && !errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al procesar el archivo. Verifica el formato y vuelve a intentarlo.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {file && (
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleUpload}
                disabled={isUploading || uploadStatus === 'success'}
                className="flex-1 sm:flex-none"
              >
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
              
              {uploadStatus === 'success' && (
                <Button 
                  onClick={handleSave}
                  disabled={isUploading}
                  className="flex-1 sm:flex-none"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Guardando como {generateFilename()}...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar como {generateFilename()}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Rankings Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings anteriores</CardTitle>
          <CardDescription>
            Gestiona y elimina rankings históricos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {pastRankings.length} rankings encontrados
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Jugadores</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastRankings.map((ranking) => (
                  <TableRow key={ranking.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {ranking.displayName || ranking.name}
                        </div>
                        <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                          {ranking.name}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDate(ranking.date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {ranking.totalPlayers}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={ranking.status === 'current' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {ranking.status === 'current' ? 'Actual' : 'Archivado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver ranking</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditDate(ranking)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar fecha</span>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={deletingId === ranking.id}
                            >
                              {deletingId === ranking.id ? (
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
                                Esta acción eliminará permanentemente el ranking "{ranking.displayName || ranking.name}" 
                                del {formatDate(ranking.date)}. 
                                {ranking.status === 'current' && ' Este es el ranking activo actual, y será reemplazado por el siguiente ranking cronológicamente más reciente.'} 
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRanking(ranking)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pastRankings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No se encontraron rankings anteriores</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section - Only show after successful file processing */}
      {uploadStatus === 'success' && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa del ranking</CardTitle>
            <CardDescription>
              Revisa los datos antes de guardar los cambios como "{generateFilename()}"
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
                    <TableHead className="text-right">Puntos</TableHead>
                    <TableHead className="text-right">Partidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((player) => (
                    <TableRow key={player.position}>
                      <TableCell className="font-medium">
                        #{player.position}
                      </TableCell>
                      <TableCell className="font-medium">
                        {player.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {player.club}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {player.points}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {player.matches}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Date Dialog */}
      <Dialog open={isEditDateDialogOpen} onOpenChange={setIsEditDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fecha del ranking</DialogTitle>
            <DialogDescription>
              Cambiar la fecha cronológica del ranking "{editingRanking?.displayName || editingRanking?.name}".
              Esto puede afectar el orden y las diferencias de posición de otros rankings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-month">Mes</Label>
              <Select value={editMonth} onValueChange={setEditMonth}>
                <SelectTrigger id="edit-month">
                  <SelectValue placeholder="Selecciona el mes" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString().padStart(2, '0')}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-year">Año</Label>
              <Select value={editYear} onValueChange={setEditYear}>
                <SelectTrigger id="edit-year">
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
            <Button 
              variant="outline" 
              onClick={() => setIsEditDateDialogOpen(false)}
              disabled={isUpdatingDate}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateDate}
              disabled={isUpdatingDate || !editMonth || !editYear}
            >
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
    </div>
  )
} 