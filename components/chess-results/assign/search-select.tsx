"use client"

import { useState, type ReactNode } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface SearchOption {
  value: string
  label: string
  detail?: string | null
}

interface SearchSelectProps {
  /** Accessible name of the picker. */
  label: string
  /** What the trigger shows (current choice). */
  display: ReactNode
  options: SearchOption[]
  selected?: string | null
  onSelect: (value: string) => void
  placeholder: string
  /** Offers creating a new item from the typed text. */
  createLabel?: (query: string) => string
  onCreate?: (query: string) => void
  /** Extra first option (e.g. "Sin club"). */
  emptyOption?: { label: string; onSelect: () => void }
  disabled?: boolean
  invalid?: boolean
}

/** Searchable select (combobox) with an optional "create new" action. */
export function SearchSelect({
  label, display, options, selected, onSelect, placeholder, createLabel, onCreate, emptyOption, disabled, invalid,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const close = () => {
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-auto min-h-9 w-full justify-between gap-2 py-1.5 text-left font-normal", invalid && "border-terracotta")}
        >
          <span className="min-w-0 flex-1 break-words">{display}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
          <CommandList className="max-h-64">
            <CommandEmpty>Sin resultados.</CommandEmpty>
            {(onCreate || emptyOption) && (
              <CommandGroup>
                {onCreate && createLabel && (
                  <CommandItem value={`__create ${query}`} onSelect={() => { onCreate(query.trim()); close() }}>
                    <Plus className="mr-2 h-4 w-4 text-terracotta" />
                    {createLabel(query.trim())}
                  </CommandItem>
                )}
                {emptyOption && (
                  <CommandItem value="__empty" onSelect={() => { emptyOption.onSelect(); close() }}>
                    <span className="ml-6">{emptyOption.label}</span>
                  </CommandItem>
                )}
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.detail ?? ""} ${option.value}`}
                  onSelect={() => { onSelect(option.value); close() }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0 text-terracotta", selected !== option.value && "invisible")} />
                  <span className="min-w-0">
                    <span className="block break-words">{option.label}</span>
                    {option.detail && <span className="block text-xs text-muted-foreground">{option.detail}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
