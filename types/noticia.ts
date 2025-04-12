export interface Noticia {
  id: string
  titulo: string
  fecha: string
  autor: string
  categoria: string
  estado: 'publicada' | 'borrador'
  comentarios: number
  contenido?: string
  imagen_url?: string
  created_at: string
  updated_at: string
} 