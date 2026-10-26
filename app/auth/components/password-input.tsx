"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

// Password field with a show/hide toggle.
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const label = visible ? "Ocultar contraseña" : "Mostrar contraseña"

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        title={label}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-terracotta"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
