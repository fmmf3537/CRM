import { Router } from 'express'
import type { Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)
router.use(requireRole('ADMIN'))

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users
router.get('/users', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true },
    orderBy: { id: 'asc' },
  })
  res.json({ data: users })
})

// POST /api/admin/users - Create user
router.post('/users', async (req: AuthRequest, res: Response) => {
  const { username, name, password, role } = req.body
  if (!username || !name || !password) {
    res.status(400).json({ error: '用户名、姓名和密码为必填项' })
    return
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: role || 'SALES',
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: '用户名已存在' })
      return
    }
    res.status(500).json({ error: '创建用户失败', message: err.message })
  }
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的用户ID' }); return }

  const { name, role } = req.body

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, role },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    })
    res.json(user)
  } catch (err: any) {
    res.status(500).json({ error: '更新用户失败', message: err.message })
  }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的用户ID' }); return }

  if (id === req.user!.id) {
    res.status(403).json({ error: '不能删除自己' })
    return
  }

  try {
    await prisma.user.delete({ where: { id } })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: '删除用户失败', message: err.message })
  }
})

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  const { password } = req.body
  if (isNaN(id)) { res.status(400).json({ error: '无效的用户ID' }); return }
  if (!password || password.length < 4) {
    res.status(400).json({ error: '密码至少4位' })
    return
  }

  try {
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: '重置密码失败', message: err.message })
  }
})

// ==================== CONFIG MANAGEMENT ====================

const DEFAULT_CONFIGS: Record<string, string> = {
  customerGrades: JSON.stringify([
    { value: 'A', label: 'A级（战略客户）' },
    { value: 'B', label: 'B级（重要客户）' },
    { value: 'C', label: 'C级（普通客户）' },
    { value: 'D', label: 'D级（潜在客户）' },
  ]),
  industries: JSON.stringify([
    { value: 'AGRICULTURE', label: '农业植保' },
    { value: 'SECURITY', label: '城市安防' },
    { value: 'LOGISTICS', label: '物流配送' },
    { value: 'SURVEYING', label: '测绘勘探' },
    { value: 'ENVIRONMENT', label: '环境监测' },
    { value: 'FILM', label: '影视航拍' },
    { value: 'CONSTRUCTION', label: '建筑工程' },
    { value: 'ENERGY', label: '能源电力' },
    { value: 'TELECOM', label: '通信巡检' },
    { value: 'FIREFIGHTING', label: '消防救援' },
  ]),
  productCategories: JSON.stringify([
    { value: 'drone', label: '无人机整机' },
    { value: 'payload', label: '任务载荷' },
    { value: 'software', label: '软件系统' },
    { value: 'service', label: '运维服务' },
  ]),
  regions: JSON.stringify([
    { value: '华北', label: '华北' },
    { value: '华东', label: '华东' },
    { value: '华南', label: '华南' },
    { value: '华中', label: '华中' },
    { value: '西南', label: '西南' },
    { value: '西北', label: '西北' },
    { value: '东北', label: '东北' },
  ]),
  leadSources: JSON.stringify([
    { value: 'WEBSITE', label: '官网' },
    { value: 'EXHIBITION', label: '展会' },
    { value: 'PHONE', label: '电话咨询' },
    { value: 'REFERRAL', label: '客户推荐' },
    { value: 'ADVERTISEMENT', label: '广告投放' },
    { value: 'WALK_IN', label: '上门拜访' },
    { value: 'OTHER', label: '其他' },
  ]),
  activityTypes: JSON.stringify([
    { value: 'PHONE', label: '电话沟通', score: 1 },
    { value: 'VISIT', label: '上门拜访', score: 3 },
    { value: 'DEMO', label: '产品演示', score: 3 },
    { value: 'DINNER', label: '商务宴请', score: 2 },
    { value: 'EXHIBITION', label: '展会活动', score: 5 },
    { value: 'MESSAGE', label: '消息沟通', score: 1 },
    { value: 'NEGOTIATION', label: '商务谈判', score: 4 },
    { value: 'OTHER', label: '其他', score: 1 },
  ]),
  stages: JSON.stringify([
    { value: 'STAGE_01', label: '线索', winRate: 10 },
    { value: 'STAGE_02', label: '需求确认', winRate: 25 },
    { value: 'STAGE_03', label: '方案报价', winRate: 50 },
    { value: 'STAGE_04', label: '商务谈判', winRate: 75 },
    { value: 'STAGE_05', label: '签约成交', winRate: 100 },
    { value: 'STAGE_99', label: '流失', winRate: 0 },
  ]),
}

async function ensureConfig(key: string) {
  const existing = await prisma.config.findUnique({ where: { key } })
  if (!existing && DEFAULT_CONFIGS[key]) {
    await prisma.config.create({
      data: { key, value: DEFAULT_CONFIGS[key] },
    })
    return DEFAULT_CONFIGS[key]
  }
  return existing?.value
}

// GET /api/admin/config/:key
router.get('/config/:key', async (req: AuthRequest, res: Response) => {
  const { key } = req.params
  if (!DEFAULT_CONFIGS[key]) {
    res.status(400).json({ error: '无效的配置项' })
    return
  }

  const value = await ensureConfig(key)
  res.json({ key, value: JSON.parse(value || '[]') })
})

// PUT /api/admin/config/:key
router.put('/config/:key', async (req: AuthRequest, res: Response) => {
  const { key } = req.params
  const { value } = req.body

  if (!DEFAULT_CONFIGS[key]) {
    res.status(400).json({ error: '无效的配置项' })
    return
  }
  if (!value || !Array.isArray(value)) {
    res.status(400).json({ error: 'value 必须是数组' })
    return
  }

  try {
    const updated = await prisma.config.upsert({
      where: { key },
      create: { key, value: JSON.stringify(value), updatedById: req.user!.id },
      update: { value: JSON.stringify(value), updatedById: req.user!.id },
    })
    res.json({ key, value: JSON.parse(updated.value) })
  } catch (err: any) {
    res.status(500).json({ error: '更新配置失败', message: err.message })
  }
})

export default router
