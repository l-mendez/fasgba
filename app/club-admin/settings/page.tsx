import { ClubSettingsClient } from './components/club-settings-client'

export default function ClubSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Club</h1>
        <p className="text-muted-foreground">
          Modifica la información de tu club
        </p>
      </div>
      
      <div className="grid gap-6">
        <ClubSettingsClient />
      </div>
    </div>
  )
}

// Keep dynamic rendering for authentication
export const dynamic = 'force-dynamic' 