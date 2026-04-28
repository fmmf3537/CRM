import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken, verifyToken, authMiddleware } from '../middleware/auth.js'
import { prisma } from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' })
    return
  }

  // Demo login: accept any non-empty username with password >= 4 chars
  // For seeded users, verify bcrypt
  const user = await prisma.user.findUnique({ where: { username } })
  if (user) {
    // Check seeded user password (password is 'password' for seeded users)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ error: '密码错误' })
      return
    }
    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
    return
  }

  // Demo mode: create user on-the-fly
  if (password.length >= 4) {
    const newUser = await prisma.user.create({
      data: { username, password: await bcrypt.hash(password, 10), name: username, role: 'SALES' },
    })
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
    })
    res.json({ token, user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role } })
    return
  }

  res.status(401).json({ error: '登录失败' })
})

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未认证' })
    return
  }
  try {
    const decoded = verifyToken(authHeader.slice(7))
    const user = await prisma.user.findUnique({ where: { id: decoded!.id } })
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role })
  } catch {
    res.status(401).json({ error: '认证失败' })
  }
})

router.get('/users', authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true },
    orderBy: { id: 'asc' },
  })
  res.json({ data: users })
})

export default router
