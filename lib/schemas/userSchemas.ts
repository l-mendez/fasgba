import { z } from 'zod'
import { API_CONSTANTS } from '@/lib/utils/constants'

// Schema for user profile updates
export const updateUserProfileSchema = z.object({
  nombre: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  apellido: z.string().min(1, 'Surname is required').max(100, 'Surname too long').optional(),
  telefono: z.string().max(50, 'Phone number too long').optional(),
  direccion: z.string().max(500, 'Address too long').optional(),
  fecha_nacimiento: z.string().refine((date) => {
    if (!date) return true // Optional field
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed <= new Date()
  }, 'Invalid birth date').optional(),
})

// Schema for password update
export const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
})

// Schema for permission parameter
export const permissionParamSchema = z.object({
  permission: z.enum(API_CONSTANTS.USER_PERMISSIONS),
})

// Schema for file upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    return file.size <= API_CONSTANTS.MAX_AVATAR_SIZE
  }, `File size must be less than ${API_CONSTANTS.MAX_AVATAR_SIZE / (1024 * 1024)}MB`).refine((file) => {
    return API_CONSTANTS.ALLOWED_AVATAR_TYPES.includes(file.type)
  }, `File type must be one of: ${API_CONSTANTS.ALLOWED_AVATAR_TYPES.join(', ')}`),
})

// Validation functions
export function validateUpdateUserProfile(data: unknown) {
  try {
    return updateUserProfileSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUpdatePassword(data: unknown) {
  try {
    return updatePasswordSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validatePermissionParam(permission: string) {
  try {
    return permissionParamSchema.parse({ permission }).permission
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Invalid permission parameter')
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateFileUpload(file: File) {
  try {
    return fileUploadSchema.parse({ file }).file
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`File validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

// Helper function to validate file from FormData
export function validateFileFromFormData(formData: FormData): File {
  const file = formData.get('file') as File
  
  if (!file) {
    const validationError = new Error('No file provided')
    validationError.name = 'ValidationError'
    throw validationError
  }
  
  if (!(file instanceof File)) {
    const validationError = new Error('Invalid file format')
    validationError.name = 'ValidationError'
    throw validationError
  }
  
  return validateFileUpload(file)
} 