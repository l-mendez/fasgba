import { BookOpen, ClipboardList, FileText, Folder, GraduationCap, type LucideIcon } from "lucide-react"

import { InfoPill } from "@/components/info-pill"
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/documentosUtils"

const CATEGORY_ICONS: Record<DocumentCategory, LucideIcon> = {
  reglamentos: BookOpen,
  actas: FileText,
  minutas: ClipboardList,
  escuela: GraduationCap,
  otros: Folder,
}

export function CategoryPill({ category }: { category: DocumentCategory }) {
  return <InfoPill icon={CATEGORY_ICONS[category] ?? Folder}>{DOCUMENT_CATEGORIES[category]}</InfoPill>
}
