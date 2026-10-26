import { AdminPageHeader } from '@/components/admin-page-header'
import { ClubSettingsClient } from './components/club-settings-client'

export default function ClubSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Configuración" />
      <ClubSettingsClient />
    </div>
  )
}

// Keep dynamic rendering for authentication
export const dynamic = 'force-dynamic' 