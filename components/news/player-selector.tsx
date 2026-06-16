"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PlayerSelectorProps {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  onTypeChange: (type: string) => void
}

export function PlayerSelector({
  label,
  type,
  value,
  onChange,
  onTypeChange,
}: PlayerSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col space-y-3 p-3 border rounded-md">
        <RadioGroup value={type} onValueChange={onTypeChange} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id={`custom-${label}`} />
            <Label htmlFor={`custom-${label}`}>Nombre personalizado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="anonymous" id={`anonymous-${label}`} />
            <Label htmlFor={`anonymous-${label}`}>Anónimo</Label>
          </div>
        </RadioGroup>

        {type === "custom" && (
          <Input placeholder="Nombre del jugador" value={value || ""} onChange={(e) => onChange(e.target.value)} />
        )}

        {type === "anonymous" && <p className="text-sm text-muted-foreground">El jugador aparecerá como "Anónimo"</p>}
      </div>
    </div>
  )
}
