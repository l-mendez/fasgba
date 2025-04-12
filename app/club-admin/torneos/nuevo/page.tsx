"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export default function NuevoTorneoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    hora: "",
    lugar: "Círculo de Ajedrez Punta Alta",
    direccion: "",
    ritmo: "",
    rondas: "",
    sistema: "",
    inscripcionAbierta: true,
    costo: "",
    imagen: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, inscripcionAbierta: checked }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí iría la lógica para crear el nuevo torneo
    console.log("Datos del formulario:", formData)
    // Redireccionar a la lista de torneos
    // router.push("/club-admin/torneos")
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/club-admin/torneos">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Torneo</h1>
          <p className="text-muted-foreground">Crea un nuevo torneo para tu club.</p>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del torneo</CardTitle>
            <CardDescription>Completa los campos para crear un nuevo torneo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del torneo</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción del torneo"
                className="resize-none"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                <Input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha de finalización</Label>
                <Input
                  id="fechaFin"
                  name="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora de inicio</Label>
              <Input id="hora" name="hora" type="time" value={formData.hora} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lugar">Lugar</Label>
              <Input id="lugar" name="lugar" value={formData.lugar} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ritmo">Ritmo de juego</Label>
                <Input
                  id="ritmo"
                  name="ritmo"
                  value={formData.ritmo}
                  onChange={handleChange}
                  placeholder="Ej: 90 min + 30 seg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rondas">Rondas</Label>
                <Input
                  id="rondas"
                  name="rondas"
                  type="number"
                  value={formData.rondas}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sistema">Sistema</Label>
                <Select value={formData.sistema} onValueChange={(value) => handleSelectChange("sistema", value)}>
                  <SelectTrigger id="sistema">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suizo">Suizo</SelectItem>
                    <SelectItem value="round-robin">Round Robin</SelectItem>
                    <SelectItem value="eliminacion">Eliminación directa</SelectItem>
                    <SelectItem value="grupos">Grupos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costo">Costo de inscripción</Label>
                <Input
                  id="costo"
                  name="costo"
                  value={formData.costo}
                  onChange={handleChange}
                  placeholder="Ej: $2000 general, $1000 sub-18"
                />
              </div>
              <div className="flex items-center space-x-2 self-end">
                <Checkbox
                  id="inscripcionAbierta"
                  checked={formData.inscripcionAbierta}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="inscripcionAbierta" className="text-sm font-normal">
                  Abrir inscripciones inmediatamente
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen del torneo</Label>
              <Input
                id="imagen"
                name="imagen"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData((prev) => ({ ...prev, imagen: e.target.files[0] }))}
              />
              <p className="text-xs text-muted-foreground">Imagen promocional del torneo. Recomendado: 1200x600px.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/club-admin/torneos">Cancelar</Link>
            </Button>
            <Button type="submit">Crear torneo</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

