'use client'

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

interface NewsPaginationProps {
  currentPage: number
  totalPages: number
}

export function NewsPagination({ 
  currentPage, 
  totalPages
}: NewsPaginationProps) {
  const urlSearchParams = useSearchParams()
  
  // Create URL with updated page
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    const queryString = params.toString()
    return `/noticias${queryString ? `?${queryString}` : ''}`
  }

  // Generate array of page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxPagesToShow; i++) {
        pages.push(i)
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={createPageUrl(currentPage - 1)}
        className={currentPage === 1 ? 'pointer-events-none' : ''}
      >
        <Button
          variant="outline"
          className="border-amber text-amber-dark hover:bg-amber/10"
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
      </Link>
      
      {getPageNumbers().map((pageNum) => (
        <Link key={pageNum} href={createPageUrl(pageNum)}>
          <Button
            variant="outline"
            className={
              currentPage === pageNum
                ? "border-amber bg-amber/10 text-amber-dark hover:bg-amber/20"
                : "border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10"
            }
          >
            {pageNum}
          </Button>
        </Link>
      ))}
      
      <Link
        href={createPageUrl(currentPage + 1)}
        className={currentPage === totalPages ? 'pointer-events-none' : ''}
      >
        <Button
          variant="outline"
          className="border-amber text-amber-dark hover:bg-amber/10"
          disabled={currentPage === totalPages}
        >
          Siguiente
        </Button>
      </Link>
    </div>
  )
} 