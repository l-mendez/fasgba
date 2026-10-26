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

  const tagOptions = [{ value: 'all', label: 'Todas' }, ...tags.map((tag) => ({ value: tag, label: capitalize(tag) }))]

  // Plain elements (not nested components) so they don't remount on every render.
  const tagChips = tagOptions.map(({ value, label }) => (
    <button key={value} type="button" onClick={() => onTagChange(value)}>
      <Badge
        variant={selectedTag === value ? 'default' : 'outline'}
        className={`cursor-pointer ${
          selectedTag === value
            ? 'bg-terracotta text-white hover:bg-terracotta-dark'
            : 'border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10'
        }`}
      >
        {label}
      </Badge>
    </button>
  ))

  const clubSelect = (className: string) => (
    <Select value={selectedClub} onValueChange={onClubChange}>
      <SelectTrigger className={className} aria-label="Club">
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
  )

  return (
    <>
      {/* Desktop filters: categories, clear and club on a single row */}
      <div className="hidden lg:flex flex-wrap items-center gap-2">
        {tagChips}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
        {clubSelect("ml-auto w-[220px] border-amber/20 focus:ring-amber focus:border-amber")}
      </div>

      {/* Mobile filter trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="brandOutline"
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
            <div className="mt-6 space-y-6">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="w-full" onClick={onClear}>
                  Limpiar filtros
                </Button>
              )}
              <div className="flex flex-wrap gap-2">{tagChips}</div>
              {clubSelect("w-full")}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
