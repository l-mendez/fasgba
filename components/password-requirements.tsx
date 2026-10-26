import { Check, Circle } from 'lucide-react'
import { getPasswordStrength } from '@/lib/utils/passwordValidation'

interface PasswordRequirementsProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const strength = getPasswordStrength(password)

  return (
    <ul className="mt-2 space-y-1">
      {strength.map((item) => (
        <li key={item.id} className="flex items-center gap-2 text-xs">
          {item.met ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-amber" />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className={item.met ? 'text-foreground' : 'text-muted-foreground'}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
