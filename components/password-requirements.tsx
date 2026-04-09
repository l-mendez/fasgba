'use client'

import { Check, Circle } from 'lucide-react'
import { getPasswordStrength } from '@/lib/utils/passwordValidation'

interface PasswordRequirementsProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null

  const strength = getPasswordStrength(password)

  return (
    <ul className="space-y-1 mt-2">
      {strength.map((item) => (
        <li key={item.id} className="flex items-center gap-2 text-sm">
          {item.met ? (
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className={item.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
