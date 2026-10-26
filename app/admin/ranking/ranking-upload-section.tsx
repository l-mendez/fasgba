import { RankingUploadClient } from "./ranking-upload-client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RankingUploadSectionProps {
  existingRankingNames: string[]
}

export function RankingUploadSection({ existingRankingNames }: RankingUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir archivo de ranking</CardTitle>
        <CardDescription>
          Excel (.xlsx) con 3 hojas (Ranking, Analítico, Consolidado) o una sola hoja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RankingUploadClient existingRankingNames={existingRankingNames} />
      </CardContent>
    </Card>
  )
}
