// Single source of truth for password validation rules across the entire app

export interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
}

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export interface PasswordStrengthItem {
  id: string
  label: string
  met: boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'minLength',
    label: 'Al menos 8 caracteres',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Al menos 1 letra mayúscula',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'number',
    label: 'Al menos 1 número',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'symbol',
    label: 'Al menos 1 carácter especial (!@#$%...)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
]

export const PASSWORD_MAX_LENGTH = 128

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push('La contraseña es demasiado larga')
  }

  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.test(password)) {
      errors.push(req.label)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function getPasswordStrength(password: string): PasswordStrengthItem[] {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    id: req.id,
    label: req.label,
    met: req.test(password),
  }))
}
