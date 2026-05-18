'use server'

import * as XLSX from 'xlsx-js-style'
import { requireAdminAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  parseWorkbook,
  buildPersistedJson,
  type RankingUploadResult,
} from '@/lib/rankingParser'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
]

export async function uploadRankingAction(
  formData: FormData
): Promise<{ ok: true; data: RankingUploadResult } | ActionError> {
  try {
    await requireAdminAction()

    const file = formData.get('file')
    const month = formData.get('month')
    const year = formData.get('year')

    if (!(file instanceof File)) return { ok: false, error: 'No file provided', code: 'VALIDATION' }
    if (typeof month !== 'string' || typeof year !== 'string') return { ok: false, error: 'Month and year are required', code: 'VALIDATION' }
    if (file.size > MAX_FILE_SIZE) return { ok: false, error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`, code: 'PAYLOAD_TOO_LARGE' }
    if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: `File type must be Excel (.xlsx or .xls). Received: ${file.type}`, code: 'VALIDATION' }

    const admin = createAdminClient()
    const filename = `ranking-${month.padStart(2, '0')}-${year}`
    const tempExcelPath = `temp/${filename}.xlsx`
    const tempJsonPath = `temp/${filename}.json`
    const tempAnalyticsPath = `temp/${filename}-analytics.json`

    // Upload Excel file to temp storage
    const { error: uploadError } = await admin.storage
      .from('ranking-data')
      .upload(tempExcelPath, file, { contentType: file.type, upsert: true })

    if (uploadError) return { ok: false, error: 'Failed to upload file: ' + uploadError.message, code: 'INTERNAL' }

    let parsed
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'buffer' })
      parsed = await parseWorkbook(workbook, parseInt(month), parseInt(year), admin)
    } catch (parseError) {
      await admin.storage.from('ranking-data').remove([tempExcelPath])
      const msg = parseError instanceof Error ? parseError.message : 'Unknown parse error'
      return { ok: false, error: `Error al procesar el archivo Excel: ${msg}`, code: 'VALIDATION' }
    }

    const { jsonPayload, analyticsPayload } = buildPersistedJson(parsed, filename, parseInt(month), parseInt(year))

    const { error: jsonError } = await admin.storage
      .from('ranking-data')
      .upload(tempJsonPath, Buffer.from(JSON.stringify(jsonPayload, null, 2)), {
        contentType: 'application/json',
        upsert: true,
      })

    if (jsonError) {
      await admin.storage.from('ranking-data').remove([tempExcelPath])
      return { ok: false, error: 'Failed to process ranking data', code: 'INTERNAL' }
    }

    if (analyticsPayload) {
      const { error: analyticsError } = await admin.storage
        .from('ranking-data')
        .upload(tempAnalyticsPath, Buffer.from(JSON.stringify(analyticsPayload, null, 2)), { contentType: 'application/json', upsert: true })
      // Analytics is supplementary - don't fail the upload
      if (analyticsError) console.warn('Failed to upload analytics data:', analyticsError)
    }

    // Delete the temp Excel file
    await admin.storage.from('ranking-data').remove([tempExcelPath])

    return {
      ok: true,
      data: {
        filename,
        totalPlayers: jsonPayload.totalPlayers,
        previewData: jsonPayload.players.slice(0, 10),
        tempJsonPath,
        tempAnalyticsPath: analyticsPayload ? tempAnalyticsPath : undefined,
        isMultiSheet: parsed.isMultiSheet,
        hasAnalytics: !!analyticsPayload,
        analyticsCount: parsed.analyticsDetails.length,
        requiresRecalculation: parsed.requiresRecalculation,
      },
    }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
