import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, payloadTooLargeError, forbiddenError } from '@/lib/utils/apiResponse'
import * as XLSX from 'xlsx-js-style'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel' // .xls
]

interface ExcelPlayer {
  __EMPTY?: number;
  ID?: string;
  TIT?: string;
  Nombre?: string;
  'Ranking Nuevo'?: number;
  Club?: string;
  'Categoría'?: string;
  Posicion?: number;
  Puntos?: number;
  Partidos?: number;
  // Allow for flexible column naming
  [key: string]: any;
}

interface RankingPlayer {
  position: number;
  name: string;
  title?: string; // Player title if they have one
  club: string;
  points: number;
  matches: number;
  changes?: {
    position: number | null; // positive = moved up, negative = moved down, null = new player
    points: number; // positive = gained points, negative = lost points
    isNew: boolean; // true if player wasn't in previous ranking
  };
}

interface PreviousPlayer {
  position: number;
  name: string;
  points: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check if user has admin permissions - use regular client for auth check
    const supabase = await createClient()
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()
    
    if (adminError || !adminData) {
      return forbiddenError('Admin access required')
    }

    // Use admin client for storage operations
    const adminSupabase = createAdminClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const month = formData.get('month') as string
    const year = formData.get('year') as string
    
    if (!file) {
      return handleError(new Error('No file provided'))
    }

    if (!month || !year) {
      return handleError(new Error('Month and year are required'))
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLargeError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return handleError(new Error(`File type must be Excel (.xlsx or .xls). Received: ${file.type}`))
    }

    // Generate filename
    const filename = `ranking-${month.padStart(2, '0')}-${year}`
    const tempExcelPath = `temp/${filename}.xlsx`
    const tempJsonPath = `temp/${filename}.json`

    // Upload Excel file to temp storage using admin client
    const { error: uploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(tempExcelPath, file, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return handleError(new Error('Failed to upload file: ' + uploadError.message))
    }

    // Helper function to normalize names with proper capitalization
    const normalizePlayerName = (name: string): string => {
      return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    // Parse Excel file
    let rankingData: RankingPlayer[]
    try {
      const fileBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas de trabajo válidas')
      }
      
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      
      if (!sheet) {
        throw new Error(`No se pudo acceder a la hoja de trabajo: ${sheetName}`)
      }
      
      const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet)
      
      if (!rawData || rawData.length === 0) {
        throw new Error('La hoja de Excel está vacía o no contiene datos válidos')
      }


      // Transform data to standard format
      const transformedData: RankingPlayer[] = []
      const errors: string[] = []
      
      rawData.forEach((row, index) => {
        const rowNumber = index + 2 // +2 because index is 0-based and Excel rows start at 1, plus header row
        
        try {
          // Try to extract data from various possible column names
          const name = row.Nombre || row.Name || row.NOMBRE || ''
          const title = row.TIT || row.Titulo || row.TITULO || ''
          const club = row.Club || row.CLUB || ''
          const points = row.Puntos || row['Ranking Nuevo'] || row.Points || row.ELO || 0
          const matches = row.Partidos || row.Matches || row.PARTIDOS || 0
          const position = row.Posicion || row.ID || row.__EMPTY || (index + 1)

          // Validate required fields
          if (!name || String(name).trim() === '') {
            if (Object.keys(row).length > 1) { // Only report if row has other data
              errors.push(`Fila ${rowNumber}: Falta el nombre del jugador`)
            }
            return // Skip this row
          }

          const transformedPlayer = {
            position: typeof position === 'number' ? position : parseInt(String(position)) || (index + 1),
            name: normalizePlayerName(String(name)),
            title: title ? String(title).trim().toUpperCase() : undefined, // Keep titles in uppercase (GM, IM, etc.)
            club: String(club).trim(),
            points: Math.round(typeof points === 'number' ? points : parseInt(String(points)) || 0),
            matches: typeof matches === 'number' ? matches : parseInt(String(matches)) || 0
          }

          // Validate transformed data
          if (isNaN(transformedPlayer.position)) {
            errors.push(`Fila ${rowNumber}: Posición inválida para ${transformedPlayer.name}`)
            return
          }
          
          if (isNaN(transformedPlayer.points)) {
            errors.push(`Fila ${rowNumber}: Puntos inválidos para ${transformedPlayer.name}`)
            return
          }
          
          if (isNaN(transformedPlayer.matches)) {
            errors.push(`Fila ${rowNumber}: Número de partidos inválido para ${transformedPlayer.name}`)
            return
          }

          transformedData.push(transformedPlayer)
          
        } catch (rowError) {
          errors.push(`Fila ${rowNumber}: Error al procesar datos - ${rowError instanceof Error ? rowError.message : 'Error desconocido'}`)
        }
      })

      if (errors.length > 0 && transformedData.length === 0) {
        const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : []
        const columnInfo = availableColumns.length > 0 ? 
          `\n\nColumnas encontradas en el archivo: ${availableColumns.join(', ')}\n\nColumnas esperadas: Posicion/ID, Nombre/Name/NOMBRE, Club/CLUB, Puntos/Points/ELO, Partidos/Matches/PARTIDOS` : 
          ''
        throw new Error(`Error al procesar el archivo Excel:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... y ${errors.length - 5} errores más` : ''}${columnInfo}`)
      }

      if (transformedData.length === 0) {
        const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : []
        const columnInfo = availableColumns.length > 0 ? 
          `\n\nColumnas encontradas en el archivo: ${availableColumns.join(', ')}\n\nColumnas esperadas: Posicion/ID, Nombre/Name/NOMBRE, Club/CLUB, Puntos/Points/ELO, Partidos/Matches/PARTIDOS` : 
          ''
        throw new Error(`No se encontraron jugadores válidos en el archivo Excel. Verifica que las columnas tengan los nombres correctos.${columnInfo}`)
      }

      if (errors.length > 0) {
        console.warn(`Skipped ${errors.length} rows with errors:`, errors)
      }

      rankingData = transformedData.sort((a, b) => a.position - b.position) // Sort by position

    } catch (parseError) {
      // Clean up uploaded file
      await adminSupabase.storage.from('ranking-data').remove([tempExcelPath])
      
      console.error('Parse error:', parseError)
      
      // Provide specific error message
      if (parseError instanceof Error) {
        return handleError(new Error(`Error al procesar el archivo Excel: ${parseError.message}`))
      } else {
        return handleError(new Error('Error desconocido al procesar el archivo Excel. Verifica que sea un archivo Excel válido con las columnas correctas.'))
      }
    }

    // Find previous ranking and calculate changes
    const previousRanking = await findPreviousRanking(adminSupabase, parseInt(month), parseInt(year))
    
    let enhancedRankingData: RankingPlayer[]
    if (previousRanking) {
      enhancedRankingData = calculatePlayerChanges(rankingData, previousRanking.players)
    } else {
      // First ranking - mark all players as new
      enhancedRankingData = rankingData.map(player => ({
        ...player,
        changes: {
          position: null,
          points: 0,
          isNew: true
        }
      }))
    }

    // Create JSON data with enhanced ranking information
    const jsonData = {
      filename: filename,
      lastUpdated: new Date().toISOString(),
      totalPlayers: enhancedRankingData.length,
      month: parseInt(month),
      year: parseInt(year),
      previousRanking: previousRanking?.filename || null,
      players: enhancedRankingData
    }

    // Upload JSON to temp storage using admin client
    const jsonBuffer = Buffer.from(JSON.stringify(jsonData, null, 2))
    const { error: jsonUploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(tempJsonPath, jsonBuffer, {
        contentType: 'application/json',
        upsert: true
      })
    
    if (jsonUploadError) {
      // Clean up Excel file
      await adminSupabase.storage.from('ranking-data').remove([tempExcelPath])
      console.error('JSON upload error:', jsonUploadError)
      return handleError(new Error('Failed to process ranking data'))
    }

    // Delete the Excel file from temp (keep only JSON) using admin client
    await adminSupabase.storage.from('ranking-data').remove([tempExcelPath])

    return apiSuccess({
      filename: filename,
      totalPlayers: enhancedRankingData.length,
      previewData: enhancedRankingData.slice(0, 10), // Return first 10 for preview
      tempJsonPath,
      requiresRecalculation: await checkIfRecalculationNeeded(adminSupabase, parseInt(month), parseInt(year))
    })

  } catch (error) {
    return handleError(error)
  }
}

// Helper function to find previous ranking
async function findPreviousRanking(adminSupabase: any, currentMonth: number, currentYear: number) {
  try {
    // List all ranking files
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError || !files) {
      console.warn('Could not list files to find previous ranking:', listError)
      return null
    }

    // Filter and sort ranking files
    const rankingFiles = files
      .filter(file => 
        file.name.endsWith('.json') && 
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(file => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        
        const month = parseInt(match[1])
        const year = parseInt(match[2])
        
        return {
          filename: file.name,
          month,
          year,
          date: new Date(year, month - 1), // month - 1 because Date months are 0-indexed
          created_at: file.created_at
        }
      })
      .filter(Boolean)

    // First, check if there's already a ranking for the same month/year
    const sameMonthRankings = rankingFiles
      .filter(ranking => ranking.month === currentMonth && ranking.year === currentYear)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Oldest first for same month
    
    if (sameMonthRankings.length > 0) {
      // Use the most recent existing ranking for the same month as previous
      const sameMonthPrevious = sameMonthRankings[sameMonthRankings.length - 1]
      
      // Download and parse the same-month previous ranking
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(sameMonthPrevious.filename)
      
      if (downloadError || !fileData) {
        console.warn('Could not download same-month previous ranking:', downloadError)
      } else {
        const jsonContent = await fileData.text()
        const previousData = JSON.parse(jsonContent)
        
        return {
          filename: sameMonthPrevious.filename.replace('.json', ''),
          players: previousData.players || []
        }
      }
    }

    // If no same-month ranking exists, fall back to chronologically previous ranking
    const chronologicalRankings = rankingFiles
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Most recent first

    const currentDate = new Date(currentYear, currentMonth - 1)
    const previousRanking = chronologicalRankings.find(ranking => 
      ranking.date.getTime() < currentDate.getTime()
    )

    if (!previousRanking) {
      return null
    }
    
    // Download and parse the chronologically previous ranking
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(previousRanking.filename)
    
    if (downloadError || !fileData) {
      console.warn('Could not download previous ranking:', downloadError)
      return null
    }

    const jsonContent = await fileData.text()
    const previousData = JSON.parse(jsonContent)
    
    return {
      filename: previousRanking.filename.replace('.json', ''),
      players: previousData.players || []
    }
  } catch (error) {
    console.warn('Error finding previous ranking:', error)
    return null
  }
}

// Helper function to calculate changes for each player
function calculatePlayerChanges(newPlayers: RankingPlayer[], previousPlayers: PreviousPlayer[]) {
  // Helper function to normalize names for comparison
  const normalizeName = (name: string): string => {
    return name
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return newPlayers.map(player => {
    // Find player in previous ranking (using normalized name matching)
    const previousPlayer = previousPlayers.find(p => 
      normalizeName(p.name) === normalizeName(player.name)
    )

    if (!previousPlayer) {
      // New player
      return {
        ...player,
        changes: {
          position: null,
          points: 0, // No comparison possible
          isNew: true
        }
      }
    }

    // Calculate changes
    const positionChange = previousPlayer.position - player.position // Positive = moved up in ranking
    const pointsChange = Math.round(player.points - previousPlayer.points)

    return {
      ...player,
      changes: {
        position: positionChange,
        points: pointsChange,
        isNew: false
      }
    }
  })
}

// Helper function to check if uploading this ranking will require recalculating subsequent rankings
async function checkIfRecalculationNeeded(adminSupabase: any, currentMonth: number, currentYear: number): Promise<boolean> {
  try {
    // List all ranking files
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError || !files) {
      return false
    }

    // Filter and sort ranking files chronologically
    const rankingFiles = files
      .filter(file => 
        file.name.endsWith('.json') && 
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(file => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        
        const month = parseInt(match[1])
        const year = parseInt(match[2])
        
        return {
          filename: file.name,
          month,
          year,
          date: new Date(year, month - 1)
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Chronological order

    // Find if there are any rankings after the current one being uploaded
    const currentDate = new Date(currentYear, currentMonth - 1)
    const subsequentRankings = rankingFiles.filter(ranking => 
      ranking.date.getTime() > currentDate.getTime()
    )

    return subsequentRankings.length > 0
  } catch (error) {
    console.warn('Error checking recalculation need:', error)
    return false
  }
} 