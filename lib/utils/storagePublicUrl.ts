import { createClient } from "@/lib/supabase/client"

export function getPublicImageUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null
  if (filePath.startsWith("http")) return filePath

  const supabase = createClient()
  return supabase.storage.from("images").getPublicUrl(filePath).data.publicUrl
}
