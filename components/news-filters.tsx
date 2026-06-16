'use client'

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
  onTagChange: (tag: string) => void
  onClubChange: (club: string) => void
  onClear: () => void
}

export function NewsFilters({
  tags,
  clubs,
  selectedTag,
  selectedClub,
  hasActiveFilters,
  onTagChange,
  onClubChange,
  onClear,
}: NewsFiltersProps) {
  const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)

  // Mobile filter content (a plain element, not a nested component, so it
  // doesn't remount on every render).
  const filterContent = (
    <div className="space-y-6">
      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClear}
        >
          Limpiar filtros
        </Button>
      )}

      {/* Tag filter */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-foreground">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onTagChange('all')}>
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
          </button>
          {tags.map((tag) => (
            <button key={tag} type="button" onClick={() => onTagChange(tag)}>
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
            </button>
          ))}
        </div>
      </div>

      {/* Club filter */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-foreground">Clubes</h3>
        <Select value={selectedClub} onValueChange={onClubChange}>
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
            <button type="button" onClick={() => onTagChange('all')}>
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
            </button>
            {tags.map((tag) => (
              <button key={tag} type="button" onClick={() => onTagChange(tag)}>
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
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Club</h3>
          <div className="flex items-center gap-4">
            <Select value={selectedClub} onValueChange={onClubChange}>
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
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                onClick={onClear}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
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
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
