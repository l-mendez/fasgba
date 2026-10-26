"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Club {
  id: number
  name: string
}

interface UserCreateFormProps {
  clubs: Club[]
}

export function UserCreateForm({ clubs }: UserCreateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    club: "",
    role: "user",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      
      // TODO: Implement user creation functionality
      // This would typically involve calling an API to create the user
      console.log("Form submitted:", formData)
      
      // For now, just show success and redirect
      setSuccess("Usuario creado correctamente")
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/usuarios")
      }, 1500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() => router.push("/admin/usuarios")}
          variant="outline"
          size="icon"
          aria-label="Volver a usuarios"
          title="Volver a usuarios"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Nuevo usuario</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-muted">
          <CheckCircle2 className="h-4 w-4 text-amber" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Apellido</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club">Club</Label>
            <Select
              value={formData.club}
              onValueChange={(value) => setFormData({ ...formData, club: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin club</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="club_admin">Administrador de Club</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/usuarios")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
      </form>
    </div>
  )
} 