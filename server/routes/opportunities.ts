import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// Stage win rate mapping
const WIN_RATE_MAP: Record<string, number> = {
  STAGE_01: 10,
  STAGE_02: 25,
  STAGE_03: 50,
  STAGE_04: 75,
  STAGE_05: 100,
  STAGE_99: 0,
}

const STAGE_ORDER = ['STAGE_01', 'STAGE_02', 'STAGE_03', 'STAGE_04', 'STAGE_05', 'STAGE_99']

// Helper: check ownership
function canModifyOpp(req: AuthRequest, ownerId: number): boolean {
  const user = req.user!
  return user.id === ownerId || ['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(user.role)
}

// GET /api/opportunities/pipeline - Pipeline analysis (BEFORE /:id)
router.get('/pipeline', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>

  const where: any = {}
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
  }

  const [byStage, totalAmount, totalCount] = await Promise.all([
    prisma.opportunity.groupBy({
      by: ['stage'],
      where,
      _sum: { amount: true },
      _count: { stage: true },
    }),
    prisma.opportunity.aggregate({ where, _sum: { amount: true } }),
    prisma.opportunity.count({ where }),
  ])

  // Calculate conversion rates between stages
  const stages = STAGE_ORDER.filter((s) => s !== 'STAGE_99')
  const pipeline = stages.map((stage, index) => {
    const data = byStage.find((s) => s.stage === stage)
    const nextStage = stages[index + 1]
    const nextData = byStage.find((s) => s.stage === nextStage)

    const count = data ? data._count.stage : 0
    const amount = data ? (data._sum.amount || 0) : 0
    const nextCount = nextData ? nextData._count.stage : 0
    const conversionRate = count > 0 ? ((nextCount / count) * 100).toFixed(1) + '%' : '-'

    return {
      stage,
      count,
      amount,
      winRate: WIN_RATE_MAP[stage],
      conversionRate: index < stages.length - 1 ? conversionRate : '-',
    }
  })

  const lost = byStage.find((s) => s.stage === 'STAGE_99')

  res.json({
    pipeline,
    totalAmount: totalAmount._sum.amount || 0,
    totalCount,
    lostCount: lost ? lost._count.stage : 0,
    lostAmount: lost ? (lost._sum.amount || 0) : 0,
  })
})

// GET /api/opportunities - List
router.get('/', async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    pageSize = '10',
    stage,
    status,
    customerId,
    ownerId,
    startDate,
    endDate,
    keyword,
  } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = {}
  if (stage) where.stage = stage
  if (status) where.status = status
  if (customerId) where.customerId = parseInt(customerId, 10)
  if (ownerId) where.ownerId = parseInt(ownerId, 10)
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
    ]
  }
  if (startDate || endDate) {
    where.expectedCloseDate = {}
    if (startDate) where.expectedCloseDate.gte = new Date(startDate)
    if (endDate) where.expectedCloseDate.lte = new Date(endDate + 'T23:59:59')
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.opportunity.count({ where }),
  ])

  res.json({
    data: opportunities,
    pagination: { page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) },
  })
})

// GET /api/opportunities/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的商机ID' }); return }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      stageHistories: {
        orderBy: { changedAt: 'desc' },
        include: { changedBy: { select: { id: true, name: true } } },
      },
    },
  })
  if (!opportunity) { res.status(404).json({ error: '商机不存在' }); return }

  res.json(opportunity)
})

// POST /api/opportunities - Create
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, customerId, amount, currency, stage, expectedCloseDate, description, source, competitor } = req.body

  if (!name || !customerId) {
    res.status(400).json({ error: '商机名称和客户为必填项' })
    return
  }

  const initialStage = stage || 'STAGE_01'
  const winRate = WIN_RATE_MAP[initialStage] || 10

  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        customerId: parseInt(customerId, 10),
        amount: amount ? parseFloat(amount) : 0,
        currency: currency || 'CNY',
        stage: initialStage,
        status: 'IN_PROGRESS',
        winRate,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        ownerId: req.user!.id,
        description,
        source,
        competitor,
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    })

    // Create initial stage history
    await prisma.stageHistory.create({
      data: {
        opportunityId: opportunity.id,
        fromStage: initialStage,
        toStage: initialStage,
        changedById: req.user!.id,
        remarks: '创建商机',
      },
    })

    res.status(201).json(opportunity)
  } catch (err: any) {
    res.status(500).json({ error: '创建商机失败', message: err.message })
  }
})

// PUT /api/opportunities/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的商机ID' }); return }

  const existing = await prisma.opportunity.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ error: '商机不存在' }); return }
  if (!canModifyOpp(req, existing.ownerId)) {
    res.status(403).json({ error: '无权修改此商机' })
    return
  }
  if (existing.status !== 'IN_PROGRESS') {
    res.status(403).json({ error: '已关闭的商机不可编辑' })
    return
  }

  const { name, amount, currency, expectedCloseDate, description, source, competitor } = req.body

  try {
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        name,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        currency,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        description,
        source,
        competitor,
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    })

    res.json(opportunity)
  } catch (err: any) {
    res.status(500).json({ error: '更新商机失败', message: err.message })
  }
})

// POST /api/opportunities/:id/advance - Advance stage
router.post('/:id/advance', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  const { toStage, remarks } = req.body

  if (isNaN(id) || !toStage) { res.status(400).json({ error: '参数错误' }); return }

  const opportunity = await prisma.opportunity.findUnique({ where: { id } })
  if (!opportunity) { res.status(404).json({ error: '商机不存在' }); return }
  if (!canModifyOpp(req, opportunity.ownerId)) {
    res.status(403).json({ error: '无权操作此商机' })
    return
  }
  if (opportunity.status !== 'IN_PROGRESS') {
    res.status(403).json({ error: '已关闭的商机不可推进' })
    return
  }

  // Validate stage sequence
  const currentIndex = STAGE_ORDER.indexOf(opportunity.stage)
  const targetIndex = STAGE_ORDER.indexOf(toStage)

  if (targetIndex === -1) { res.status(400).json({ error: '无效的目标阶段' }); return }
  if (targetIndex <= currentIndex) {
    res.status(400).json({ error: '只能向前推进阶段' })
    return
  }
  if (targetIndex - currentIndex > 1) {
    res.status(400).json({ error: '不能跳阶段推进' })
    return
  }

  const winRate = WIN_RATE_MAP[toStage] || 10

  const updated = await prisma.$transaction(async (tx) => {
    await tx.stageHistory.create({
      data: {
        opportunityId: id,
        fromStage: opportunity.stage,
        toStage,
        changedById: req.user!.id,
        remarks: remarks || '阶段推进',
      },
    })

    return tx.opportunity.update({
      where: { id },
      data: { stage: toStage, winRate },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        stageHistories: {
          orderBy: { changedAt: 'desc' },
          include: { changedBy: { select: { id: true, name: true } } },
        },
      },
    })
  })

  res.json(updated)
})

// POST /api/opportunities/:id/close - Close opportunity
router.post('/:id/close', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  const { result, remarks } = req.body

  if (isNaN(id) || !result || !['WON', 'LOST'].includes(result)) {
    res.status(400).json({ error: '参数错误，result 必须为 WON 或 LOST' })
    return
  }

  const opportunity = await prisma.opportunity.findUnique({ where: { id } })
  if (!opportunity) { res.status(404).json({ error: '商机不存在' }); return }
  if (!canModifyOpp(req, opportunity.ownerId)) {
    res.status(403).json({ error: '无权操作此商机' })
    return
  }
  if (opportunity.status !== 'IN_PROGRESS') {
    res.status(403).json({ error: '商机已关闭' })
    return
  }

  const toStage = result === 'WON' ? 'STAGE_05' : 'STAGE_99'
  const status = result === 'WON' ? 'WON' : 'LOST'
  const winRate = WIN_RATE_MAP[toStage]

  const updated = await prisma.$transaction(async (tx) => {
    await tx.stageHistory.create({
      data: {
        opportunityId: id,
        fromStage: opportunity.stage,
        toStage,
        changedById: req.user!.id,
        remarks: remarks || (result === 'WON' ? '赢单关闭' : '输单关闭'),
      },
    })

    return tx.opportunity.update({
      where: { id },
      data: {
        stage: toStage,
        status,
        winRate,
        closedAt: new Date(),
        closeReason: remarks,
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        stageHistories: {
          orderBy: { changedAt: 'desc' },
          include: { changedBy: { select: { id: true, name: true } } },
        },
      },
    })
  })

  res.json(updated)
})

// DELETE /api/opportunities/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的商机ID' }); return }

  const existing = await prisma.opportunity.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ error: '商机不存在' }); return }
  if (!canModifyOpp(req, existing.ownerId)) {
    res.status(403).json({ error: '无权删除此商机' })
    return
  }

  await prisma.opportunity.delete({ where: { id } })
  res.json({ success: true })
})

export default router
