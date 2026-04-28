import type { Response } from 'express'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: string
  error?: string
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  res.status(statusCode).json(response)
}

export function sendError(res: Response, message: string, statusCode = 400, code?: string): void {
  const response: ApiResponse = {
    success: false,
    message,
    code: code || `ERR_${statusCode}`,
    error: message,
  }
  res.status(statusCode).json(response)
}
