import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  code: string
  details?: string
}

export interface ApiSuccess<T = any> {
  data?: T
  success?: boolean
  [key: string]: any
}

/**
 * Creates a successful API response
 */
export function apiSuccess<T = any>(
  data: T, 
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  let responseBody: any
  
  // Handle different response formats
  if (data === null || data === undefined) {
    responseBody = { success: true }
  } else if (typeof data === 'object' && 'success' in data) {
    responseBody = data
  } else {
    responseBody = data
  }

  return NextResponse.json(responseBody, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
}

/**
 * Creates an error API response
 */
export function apiError(
  message: string,
  status: number = 500,
  code?: string,
  details?: string
): NextResponse {
  const errorCode = code || getErrorCodeFromStatus(status)
  
  const errorResponse: ApiError = {
    error: message,
    code: errorCode
  }

  if (details) {
    errorResponse.details = details
  }

  return NextResponse.json(errorResponse, { 
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Creates a validation error response
 */
export function validationError(message: string, details?: string): NextResponse {
  return apiError(message, 400, 'VALIDATION_ERROR', details)
}

/**
 * Creates an unauthorized error response
 */
export function unauthorizedError(message: string = 'Authentication required'): NextResponse {
  return apiError(message, 401, 'UNAUTHORIZED')
}

/**
 * Creates a forbidden error response
 */
export function forbiddenError(message: string = 'Insufficient permissions'): NextResponse {
  return apiError(message, 403, 'FORBIDDEN')
}

/**
 * Creates a not found error response
 */
export function notFoundError(message: string, details?: string): NextResponse {
  return apiError(message, 404, 'NOT_FOUND', details)
}

/**
 * Creates a conflict error response
 */
export function conflictError(message: string, details?: string): NextResponse {
  return apiError(message, 409, 'CONFLICT', details)
}

/**
 * Creates a payload too large error response
 */
export function payloadTooLargeError(message: string = 'File too large'): NextResponse {
  return apiError(message, 413, 'PAYLOAD_TOO_LARGE')
}

/**
 * Creates an internal server error response
 */
export function internalServerError(message: string = 'Internal server error'): NextResponse {
  return apiError(message, 500, 'INTERNAL_SERVER_ERROR')
}

/**
 * Gets default error code based on HTTP status
 */
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST'
    case 401: return 'UNAUTHORIZED'
    case 403: return 'FORBIDDEN'
    case 404: return 'NOT_FOUND'
    case 409: return 'CONFLICT'
    case 413: return 'PAYLOAD_TOO_LARGE'
    case 500: return 'INTERNAL_SERVER_ERROR'
    default: return 'UNKNOWN_ERROR'
  }
}

/**
 * Handles and formats unknown errors
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return validationError(error.message)
    }
    if (error.name === 'UnauthorizedError') {
      return unauthorizedError(error.message)
    }
    if (error.name === 'ForbiddenError') {
      return forbiddenError(error.message)
    }
    if (error.name === 'NotFoundError') {
      return notFoundError(error.message)
    }
    
    return internalServerError('An unexpected error occurred')
  }

  return internalServerError('An unknown error occurred')
}

/**
 * No content response (204)
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * Created response (201)
 */
export function created<T = any>(data: T): NextResponse {
  return apiSuccess(data, 201)
} 