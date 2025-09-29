"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Bell, Moon, LogOut, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export function SettingsForm({ initial }: { initial?: { type?: string; torneos?: string; noticias?: string; ranking?: boolean } }) {
  const [notificaciones, setNotificaciones] = useState<string>(initial?.type || "todas")
  const [torneos, setTorneos] = useState<string>(initial?.torneos || "todos")
  const [noticias, setNoticias] = useState<string>(initial?.noticias || "todos")
  const [ranking, setRanking] = useState<boolean>(typeof initial?.ranking === 'boolean' ? !!initial?.ranking : true)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { toast } = useToast()

// Sync state if SSR initial changes (e.g., unsubscribe handler updated metadata)
useEffect(() => {
  if (initial?.type && initial.type !== notificaciones) setNotificaciones(initial.type)
  if (initial?.torneos && initial.torneos !== torneos) setTorneos(initial.torneos)
  if (initial?.noticias && initial.noticias !== noticias) setNoticias(initial.noticias)
  if (typeof initial?.ranking === 'boolean' && initial.ranking !== ranking) setRanking(!!initial.ranking)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initial?.type, initial?.torneos, initial?.noticias, initial?.ranking])

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log("Cerrar sesión")
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion functionality
    console.log("Eliminar cuenta")
  }

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/users/me/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          notifications: {
            type: notificaciones,
            torneos,
            noticias,
            ranking,
          }
        })
      })
      if (!res.ok) throw new Error('Failed to save notifications')
      
      // Show success toast
      toast({
        title: "Cambios Guardados",
        description: "Tus preferencias de notificaciones se han actualizado correctamente.",
      })
    } catch (e) {
      console.log('Failed to save notification prefs')
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelNotifications = () => {
    // TODO: Reset to original values from database/server
    console.log("Cancelando cambios en notificaciones")
    // For now, reset to default values
    setNotificaciones("todas")
    setTorneos("todos")
    setNoticias("todos")
    setRanking(true)
  }

  return (
    <div className="space-y-6">
      {/* Notificaciones Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="notificaciones">Tipo de notificaciones</Label>
            <Select value={notificaciones} onValueChange={setNotificaciones}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de notificaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="personalizar">Personalizar</SelectItem>
                <SelectItem value="ninguna">Ninguna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional sub-options when "Personalizar" is selected */}
          {notificaciones === "personalizar" && (
            <div className="space-y-6 border-l-2 border-amber/30 pl-6 ml-4">
              <div className="space-y-2">
                <Label htmlFor="torneos">Torneos</Label>
                <Select value={torneos} onValueChange={setTorneos}>
                  <SelectTrigger>
                    <SelectValue placeholder="Notificaciones de torneos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="fasgba-y-clubes">FASGBA y Clubes que sigo</SelectItem>
                    <SelectItem value="fasgba">FASGBA</SelectItem>
                    <SelectItem value="clubes">Clubes que sigo</SelectItem>
                    <SelectItem value="ninguno">Ninguno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="noticias-notif">Noticias</Label>
                <Select value={noticias} onValueChange={setNoticias}>
                  <SelectTrigger>
                    <SelectValue placeholder="Notificaciones de noticias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="fasgba-y-clubes">FASGBA y Clubes que sigo</SelectItem>
                    <SelectItem value="fasgba">FASGBA</SelectItem>
                    <SelectItem value="clubes">Clubes que sigo</SelectItem>
                    <SelectItem value="ninguno">Ninguno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ranking-notif">Ranking</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificaciones sobre cambios en el ranking
                  </p>
                </div>
                <Switch
                  id="ranking-notif"
                  checked={ranking}
                  onCheckedChange={setRanking}
                />
              </div>
            </div>
          )}

          {/* Save and Cancel buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber/20">
            <Button
              onClick={handleSaveNotifications}
              disabled={isSaving}
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelNotifications}
              disabled={isSaving}
              className="border-amber text-amber-dark hover:bg-amber/10"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apariencia Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-amber" />
            Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza la apariencia de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="modo-oscuro">Modo Oscuro</Label>
              <p className="text-sm text-muted-foreground">
                Cambia a una interfaz con colores oscuros
              </p>
            </div>
            <Switch
              id="modo-oscuro"
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cuenta Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-terracotta">Cuenta</CardTitle>
          <CardDescription>
            Gestiona tu cuenta y sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-amber text-amber-dark hover:bg-amber/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Zona de Peligro</h4>
            <p className="text-sm text-muted-foreground">
              Esta acción eliminará permanentemente tu cuenta y todos los datos asociados.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar mi cuenta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 