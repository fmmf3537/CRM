import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken, verifyToken, authMiddleware } from '../middleware/auth.js'
import { prisma } from '../db.js'
import { validateBody } from '../middleware/validator.js'

const router = Router()

router.post('/login', validateBody({ username: 'string', password: 'string' }), async (req, res) => {
  const { username, password } = req.body

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

  // Demo mode: create user on-the-fly with password policy
  if (password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
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

// PUT /api/auth/profile - Update own profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name } = req.body
  if (!name) {
    res.status(400).json({ error: '姓名为必填项' })
    return
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: { id: true, username: true, name: true, role: true },
    })

    // Return new token with updated name
    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })

    res.json({ token, user })
  } catch (err: any) {
    res.status(500).json({ error: '更新资料失败', message: err.message })
  }
})

// PUT /api/auth/password - Change own password
router.put('/password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: '旧密码和新密码为必填项' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: '新密码至少8位，需包含大小写字母和数字' })
    return
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    res.status(400).json({ error: '新密码需包含大小写字母和数字' })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) {
      res.status(403).json({ error: '旧密码错误' })
      return
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    })

    res.json({ success: true, message: '密码修改成功' })
  } catch (err: any) {
    res.status(500).json({ error: '修改密码失败', message: err.message })
  }
})

export default router
