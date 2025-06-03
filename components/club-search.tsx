"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function ClubSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    
    const params = new URLSearchParams(searchParams)
    if (term.trim()) {
      params.set('search', term.trim())
    } else {
      params.delete('search')
    }
    
    router.push(`/clubes?${params.toString()}`)
  }

  return (
    <div className="w-full md:w-1/3">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Buscar club..." 
          className="w-full pl-10" 
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
    </div>
  )
} 