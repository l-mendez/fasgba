import { apiCall } from "@/lib/utils/apiClient"

export type DocumentoAction = "view" | "download"

export function getDocumentoExtension(filePath: string | null | undefined): string {
  return filePath?.split(".").pop()?.toLowerCase() || "pdf"
}

/**
 * Fetches a short-lived signed URL for a documento (bucket is private) and
 * either opens it in a new tab or triggers a download. Throws on failure so
 * callers can surface the error.
 */
export async function openDocumento(
  documento: { id: number; name: string; file_path: string | null },
  action: DocumentoAction
): Promise<void> {
  const { url } = await apiCall(`/api/documentos/download/${documento.id}`)
  if (!url) throw new Error("No se pudo obtener el documento")

  if (action === "view") {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  const link = document.createElement("a")
  link.href = url
  link.download = `${documento.name}.${getDocumentoExtension(documento.file_path)}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
