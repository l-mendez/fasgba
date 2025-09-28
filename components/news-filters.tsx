'use client'

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Club {
  id: number
  name: string
}

interface NewsFiltersProps {
  tags: string[]
  clubs: Club[]
  selectedTag: string
  selectedClub: string
  hasActiveFilters: boolean
}

export function NewsFilters({ 
  tags, 
  clubs, 
  selectedTag, 
  selectedClub, 
  hasActiveFilters 
}: NewsFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)

  // Create URL with updated search params
  const createFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // Reset to first page when filters change
    return `/noticias?${params.toString()}`
  }

  // Mobile filter content component
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Clear filters */}
      {hasActiveFilters && (
        <Link href="/noticias" scroll={false}>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Limpiar filtros
          </Button>
        </Link>
      )}

      {/* Tag filter */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-foreground">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          <Link href={createFilterUrl('tag', 'all')} scroll={false}>
            <Badge
              variant={selectedTag === 'all' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedTag === 'all' 
                  ? 'bg-terracotta hover:bg-terracotta-dark text-white' 
                  : 'hover:bg-gray-200'
              }`}
            >
              Todas
            </Badge>
          </Link>
          {tags.map((tag) => (
            <Link key={tag} href={createFilterUrl('tag', tag)} scroll={false}>
              <Badge
                variant={selectedTag === tag ? 'default' : 'secondary'}
                className={`cursor-pointer transition-colors ${
                  selectedTag === tag 
                    ? 'bg-terracotta hover:bg-terracotta-dark text-white' 
                    : 'hover:bg-gray-200'
                }`}
              >
                {capitalize(tag)}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Club filter */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-foreground">Clubes</h3>
        <Select 
          value={selectedClub} 
          onValueChange={(value) => {
            router.replace(createFilterUrl('club', value), { scroll: false })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clubes</SelectItem>
            <SelectItem value="fasgba">FASGBA</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id.toString()}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop filters */}
      <div className="hidden lg:block space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorías</h3>
          <div className="flex flex-wrap gap-2">
            <Link href={createFilterUrl('tag', 'all')} scroll={false}>
              <Badge
                variant={selectedTag === 'all' ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  selectedTag === 'all'
                    ? 'bg-terracotta text-white hover:bg-terracotta-dark'
                    : 'border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10'
                }`}
              >
                Todas
              </Badge>
            </Link>
            {tags.map((tag) => (
              <Link key={tag} href={createFilterUrl('tag', tag)} scroll={false}>
                <Badge
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-terracotta text-white hover:bg-terracotta-dark'
                      : 'border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10'
                  }`}
                >
                  {capitalize(tag)}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Club</h3>
          <div className="flex items-center gap-4">
            <Select 
              value={selectedClub} 
              onValueChange={(value) => {
                router.replace(createFilterUrl('club', value), { scroll: false })
              }}
            >
              <SelectTrigger className="w-[250px] border-amber/20 focus:ring-amber focus:border-amber">
                <SelectValue placeholder="Seleccionar club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clubes</SelectItem>
                <SelectItem value="fasgba">FASGBA</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {hasActiveFilters && (
              <Link href="/noticias" scroll={false}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="border-amber text-amber-dark hover:bg-amber/10"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 bg-amber/20 text-amber-dark">
                  {(selectedTag !== 'all' ? 1 : 0) + (selectedClub !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filtros de noticias</SheetTitle>
              <SheetDescription>
                Filtra las noticias por categoría o club
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
} 