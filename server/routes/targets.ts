import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// GET /api/targets
router.get('/', async (req: AuthRequest, res: Response) => {
  const { ownerId, year, type, page = '1', pageSize = '50' } = req.query as Record<string, string>
  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = {}
  if (ownerId) where.ownerId = parseInt(ownerId, 10)
  if (year) where.year = parseInt(year, 10)
  if (type) where.type = type

  const [targets, total] = await Promise.all([
    prisma.target.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: [{ year: 'desc' }, { ownerId: 'asc' }, { type: 'asc' }],
      include: {
        owner: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.target.count({ where }),
  ])

  res.json({
    data: targets,
    pagination: { page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) },
  })
})

// POST /api/targets
router.post('/', requireRole('MANAGER', 'EXECUTIVE', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { type, year, quarter, month, amount, currency, ownerId } = req.body

  if (!type || !year || amount === undefined || !ownerId) {
    res.status(400).json({ error: '类型、年份、金额和负责人为必填项' })
    return
  }

  const data: any = {
    type,
    year: parseInt(year, 10),
    amount: parseFloat(amount),
    currency: currency || 'CNY',
    ownerId: parseInt(ownerId, 10),
    createdById: req.user!.id,
  }
  if (quarter !== undefined) data.quarter = parseInt(quarter, 10)
  if (month !== undefined) data.month = parseInt(month, 10)

  try {
    // Check duplicate manually for SQLite NULL handling
    const existing = await prisma.target.findFirst({
      where: {
        type: data.type,
        year: data.year,
        ownerId: data.ownerId,
        quarter: data.quarter ?? null,
        month: data.month ?? null,
      },
    })
    if (existing) {
      res.status(409).json({ error: '该周期目标已存在' })
      return
    }

    const target = await prisma.target.create({
      data,
      include: {
        owner: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })
    res.status(201).json(target)
  } catch (err: any) {
    res.status(500).json({ error: '创建目标失败', message: err.message })
  }
})

// PUT /api/targets/:id
router.put('/:id', requireRole('MANAGER', 'EXECUTIVE', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的目标ID' }); return }

  const { amount, currency } = req.body

  try {
    const target = await prisma.target.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        currency,
      },
      include: {
        owner: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })
    res.json(target)
  } catch (err: any) {
    res.status(500).json({ error: '更新目标失败', message: err.message })
  }
})

export default router
