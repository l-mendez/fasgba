"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Bell, Moon, LogOut, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function SettingsForm() {
  const [notificaciones, setNotificaciones] = useState<string>("todas")
  const [torneos, setTorneos] = useState<string>("todos")
  const [noticias, setNoticias] = useState<string>("todos")
  const [ranking, setRanking] = useState<boolean>(true)
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log("Cerrar sesión")
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion functionality
    console.log("Eliminar cuenta")
  }

  const handleSaveNotifications = () => {
    // TODO: Implement save functionality
    console.log("Guardando configuración de notificaciones:", {
      notificaciones,
      torneos,
      noticias,
      ranking
    })
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
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              Guardar cambios
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelNotifications}
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
              checked={theme === "dark"}
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