import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin-page-header'
import { ClubSettingsClient } from './components/club-settings-client'

export const metadata: Metadata = { title: 'Configuración del club' }

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