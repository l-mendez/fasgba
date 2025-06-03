"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated, isAdmin, isClubAdmin, error: authError } = useAuth()

  const handleAddAdmin = async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to perform this action')
      return
    }

    setIsLoading(true)
    setMessage(null)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('No valid session found')
        return
      }

      const response = await fetch('/api/setup/add-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        setMessage(result.message)
        // Refresh the page to update the auth state
        window.location.reload()
      } else {
        setError(result.error || 'Failed to add admin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const checkTableStatus = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tournaments')
        .select('count')
        .limit(1)
      
      if (error) {
        setMessage(`Error al verificar la tabla: ${error.message}`)
      } else {
        setMessage('Verificación de tabla completada. La tabla tournaments está accesible.')
      }
    } catch (error) {
      setMessage(`Error al verificar la tabla: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">
              Database Setup
            </h1>
            <p className="text-muted-foreground">
              Set up admin users and check database status
            </p>
          </div>

          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Current user authentication and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <strong>Is Club Admin:</strong> {isClubAdmin ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <strong>User ID:</strong> {user?.id ? user.id.substring(0, 8) + '...' : 'N/A'}
                </div>
              </div>
              {user?.email && (
                <div className="text-sm">
                  <strong>Email:</strong> {user.email}
                </div>
              )}
              {authError && (
                <div className="text-sm text-red-500">
                  <strong>Auth Error:</strong> {authError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Setup</CardTitle>
              <CardDescription>
                Add the current user as a site-wide administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <div className="text-amber-600 bg-amber-50 p-3 rounded-md">
                  ⚠️ You must be logged in to add yourself as an admin.
                  <br />
                  Please <a href="/login" className="underline text-terracotta">log in</a> first.
                </div>
              ) : isAdmin ? (
                <div className="text-green-600 bg-green-50 p-3 rounded-md">
                  ✅ You are already an administrator!
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This will add your current user account to the admins table, giving you 
                    site-wide administrative permissions.
                  </p>
                  <Button 
                    onClick={handleAddAdmin}
                    disabled={isLoading}
                    className="bg-terracotta hover:bg-terracotta/90"
                  >
                    {isLoading ? 'Adding...' : 'Make Me Admin'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>Check the status of database tables</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={checkTableStatus}
                variant="outline"
              >
                Check Table Status
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
} 