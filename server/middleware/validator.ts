import type { _Request, Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.js'

export function validateBody(schema: Record<string, 'string' | 'number' | 'boolean' | 'email'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors: string[] = []
    for (const [key, type] of Object.entries(schema)) {
      const value = req.body[key]
      if (value === undefined || value === null || value === '') {
        errors.push(`${key} 为必填项`)
        continue
      }
      if (type === 'number' && isNaN(Number(value))) {
        errors.push(`${key} 必须为数字`)
      }
      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          errors.push(`${key} 格式不正确`)
        }
      }
    }
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: errors.join('; '), error: errors.join('; ') })
      return
    }
    next()
  }
}

export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim()
}
