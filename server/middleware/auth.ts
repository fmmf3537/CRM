import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../db'

const JWT_SECRET = process.env.JWT_SECRET || 'skytech-crm-secret-key-2026'

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
    name: string
    role: string
  }
}

export function generateToken(user: { id: number; username: string; name: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as AuthRequest['user']
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: '认证令牌无效或已过期' })
    return
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: '未认证' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: '权限不足' })
      return
    }
    next()
  }
}

export async function seedUsers() {
  const existing = await prisma.user.findFirst()
  if (existing) return

  await prisma.user.createMany({
    data: [
      { username: 'admin', password: '$2b$10$vvcQInZM5vS29QSiAmZOzOYrhlUmP8VvyvdmIbfPSzycSgbG/1yjC', name: '系统管理员', role: 'ADMIN' },
      { username: 'sales1', password: '$2b$10$vvcQInZM5vS29QSiAmZOzOYrhlUmP8VvyvdmIbfPSzycSgbG/1yjC', name: '销售张三', role: 'SALES' },
      { username: 'sales2', password: '$2b$10$vvcQInZM5vS29QSiAmZOzOYrhlUmP8VvyvdmIbfPSzycSgbG/1yjC', name: '销售李四', role: 'SALES' },
      { username: 'manager', password: '$2b$10$vvcQInZM5vS29QSiAmZOzOYrhlUmP8VvyvdmIbfPSzycSgbG/1yjC', name: '销售主管', role: 'MANAGER' },
    ],
  })
}
