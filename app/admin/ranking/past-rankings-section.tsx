import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PastRankingsSectionProps {
  children: ReactNode
}

export function PastRankingsSection({ children }: PastRankingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rankings anteriores</CardTitle>
        <CardDescription>
          Gestiona y elimina rankings históricos del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
