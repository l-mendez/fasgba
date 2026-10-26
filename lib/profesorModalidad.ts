import { Monitor, Users, type LucideIcon } from "lucide-react"

const MODALIDADES = {
  presencial: { label: "Presencial", icon: Users },
  virtual: { label: "Virtual", icon: Monitor },
} as const

// "ambos" maps to both modalities so each gets its own pill.
export function getModalidades(modalidad: string): { label: string; icon: LucideIcon }[] {
  if (modalidad === "ambos") return [MODALIDADES.presencial, MODALIDADES.virtual]
  const single = MODALIDADES[modalidad as keyof typeof MODALIDADES]
  return single ? [single] : []
}
