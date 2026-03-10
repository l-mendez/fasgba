import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1, 'El nombre del equipo es requerido').max(255, 'El nombre es demasiado largo'),
})

export const updateTeamSchema = z.object({
  name: z.string().min(1, 'El nombre del equipo es requerido').max(255, 'El nombre es demasiado largo').optional(),
})
