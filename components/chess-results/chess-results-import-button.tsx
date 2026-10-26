"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChessResultsImportDialog, type ChessResultsImportDialogProps } from "./chess-results-import-dialog"

type ImportButtonProps = Pick<ChessResultsImportDialogProps, "chooseClub" | "club"> & { className?: string }

/** "Importar desde chess-results" button that opens the import dialog. */
export function ChessResultsImportButton({ className, ...dialogProps }: ImportButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" className={className} onClick={() => setOpen(true)}>
        <Download className="mr-2 h-4 w-4" />
        Importar desde chess-results
      </Button>
      <ChessResultsImportDialog open={open} onOpenChange={setOpen} {...dialogProps} />
    </>
  )
}
