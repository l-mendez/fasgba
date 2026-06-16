'use client'

import { Button } from "@/components/ui/button"

interface NewsPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function NewsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: NewsPaginationProps) {
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
      <Button
        variant="brandOutline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </Button>

      {getPageNumbers().map((pageNum) => (
        <Button
          key={pageNum}
          variant="outline"
          className={
            currentPage === pageNum
              ? "border-amber bg-amber/10 text-amber-dark hover:bg-amber/20"
              : "border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10"
          }
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}

      <Button
        variant="brandOutline"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Siguiente
      </Button>
    </div>
  )
}
