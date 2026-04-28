import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

function isManagerPlus(req: AuthRequest): boolean {
  return ['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(req.user!.role)
}

// GET /api/achievements
router.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', pageSize = '10', customerId, createdById, startDate, endDate, keyword } = req.query as Record<string, string>
  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = {}
  if (customerId) where.customerId = parseInt(customerId, 10)
  if (createdById) where.createdById = parseInt(createdById, 10)
  if (startDate || endDate) {
    where.contractDate = {}
    if (startDate) where.contractDate.gte = new Date(startDate)
    if (endDate) where.contractDate.lte = new Date(endDate + 'T23:59:59')
  }
  if (keyword) {
    where.OR = [{ name: { contains: keyword } }]
  }

  const [achievements, total] = await Promise.all([
    prisma.achievement.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: { contractDate: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        payments: true,
      },
    }),
    prisma.achievement.count({ where }),
  ])

  res.json({
    data: achievements,
    pagination: { page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) },
  })
})

// GET /api/achievements/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的战绩ID' }); return }

  const achievement = await prisma.achievement.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      payments: true,
    },
  })
  if (!achievement) { res.status(404).json({ error: '业绩记录不存在' }); return }

  res.json(achievement)
})

// POST /api/achievements
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, customerId, opportunityId, amount, currency, contractDate, payments } = req.body

  if (!name || !customerId || !contractDate) {
    res.status(400).json({ error: '名称、客户和签约日期为必填项' })
    return
  }

  try {
    const achievement = await prisma.$transaction(async (tx) => {
      const created = await tx.achievement.create({
        data: {
          name,
          customerId: parseInt(customerId, 10),
          opportunityId: opportunityId ? parseInt(opportunityId, 10) : undefined,
          amount: amount ? parseFloat(amount) : 0,
          currency: currency || 'CNY',
          contractDate: new Date(contractDate),
          createdById: req.user!.id,
        },
        include: {
          customer: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          payments: true,
        },
      })

      if (payments && Array.isArray(payments) && payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map((p: any) => ({
            achievementId: created.id,
            amount: parseFloat(p.amount) || 0,
            paymentDate: p.paymentDate ? new Date(p.paymentDate) : undefined,
            status: p.status || 'PENDING',
          })),
        })
      }

      return tx.achievement.findUnique({
        where: { id: created.id },
        include: {
          customer: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          payments: true,
        },
      })
    })

    res.status(201).json(achievement)
  } catch (err: any) {
    res.status(500).json({ error: '录入业绩失败', message: err.message })
  }
})

// PUT /api/achievements/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的战绩ID' }); return }

  const existing = await prisma.achievement.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ error: '业绩记录不存在' }); return }
  if (existing.createdById !== req.user!.id && !isManagerPlus(req)) {
    res.status(403).json({ error: '无权修改此业绩记录' })
    return
  }

  const { name, amount, currency, contractDate, payments } = req.body

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.achievement.update({
        where: { id },
        data: {
          name,
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          currency,
          contractDate: contractDate ? new Date(contractDate) : undefined,
        },
      })

      if (payments && Array.isArray(payments)) {
        await tx.payment.deleteMany({ where: { achievementId: id } })
        if (payments.length > 0) {
          await tx.payment.createMany({
            data: payments.map((p: any) => ({
              achievementId: id,
              amount: parseFloat(p.amount) || 0,
              paymentDate: p.paymentDate ? new Date(p.paymentDate) : undefined,
              status: p.status || 'PENDING',
            })),
          })
        }
      }

      return tx.achievement.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          payments: true,
        },
      })
    })

    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: '更新业绩失败', message: err.message })
  }
})

export default router
