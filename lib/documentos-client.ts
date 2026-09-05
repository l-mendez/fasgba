import { apiCall } from "@/lib/utils/apiClient"

export type DocumentoAction = "view" | "download"

/**
 * Opens (new tab) or downloads a documento through a short-lived signed URL
 * (the bucket is private). The tab for "view" is opened synchronously inside
 * the click so popup blockers don't discard it while the URL is fetched.
 * Throws on failure so callers can surface the error.
 */
export async function openDocumento(documento: { id: number }, action: DocumentoAction): Promise<void> {
  const tab = action === "view" ? window.open("", "_blank", "noopener,noreferrer") : null

  try {
    const { url } = await apiCall(`/api/documentos/download/${documento.id}${action === "download" ? "?download=1" : ""}`)
    if (!url) throw new Error("No se pudo obtener el documento")

    if (tab) {
      tab.location.href = url
    } else {
      // Signed URL carries Content-Disposition: attachment, so navigating to it
      // saves the file without leaving the page.
      window.location.assign(url)
    }
  } catch (error) {
    tab?.close()
    throw error
  }
}
