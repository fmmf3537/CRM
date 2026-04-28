import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// Score config
const SCORE_MAP: Record<string, number> = {
  PHONE: 1,
  VISIT: 3,
  DEMO: 4,
  DINNER: 2,
  EXHIBITION: 5,
  MESSAGE: 0.5,
  NEGOTIATION: 4,
  OTHER: 1,
}

// GET /api/activities - List
router.get('/', async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    pageSize = '10',
    customerId,
    leadId,
    type,
    startDate,
    endDate,
    result,
  } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = {}
  if (customerId) where.customerId = parseInt(customerId, 10)
  if (leadId) where.leadId = parseInt(leadId, 10)
  if (type) where.type = type
  if (result) where.result = result
  if (startDate || endDate) {
    where.time = {}
    if (startDate) where.time.gte = new Date(startDate)
    if (endDate) where.time.lte = new Date(endDate + 'T23:59:59')
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: { time: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true, leadNo: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.activity.count({ where }),
  ])

  res.json({
    data: activities,
    pagination: { page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) },
  })
})

// GET /api/activities/calendar - Calendar view
router.get('/calendar', async (req: AuthRequest, res: Response) => {
  const { year, month } = req.query as Record<string, string>

  const now = new Date()
  const targetYear = year ? parseInt(year, 10) : now.getFullYear()
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1

  const start = new Date(targetYear, targetMonth - 1, 1)
  const end = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  const activities = await prisma.activity.findMany({
    where: {
      time: { gte: start, lte: end },
    },
    orderBy: { time: 'asc' },
    include: {
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  const grouped: Record<string, typeof activities> = {}
  for (const act of activities) {
    const dateKey = act.time.toISOString().split('T')[0]
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(act)
  }

  res.json(grouped)
})

// GET /api/activities/workload - Workload stats
router.get('/workload', async (req: AuthRequest, res: Response) => {
  const { userId, period = 'month' } = req.query as Record<string, string>

  const targetUserId = userId ? parseInt(userId, 10) : req.user!.id

  let start: Date
  const end = new Date()
  if (period === 'week') {
    start = new Date(end)
    start.setDate(end.getDate() - 7)
  } else if (period === 'year') {
    start = new Date(end)
    start.setFullYear(end.getFullYear() - 1)
  } else {
    start = new Date(end)
    start.setMonth(end.getMonth() - 1)
  }

  const [activities, totalScore, byType, _dailyAvg] = await Promise.all([
    prisma.activity.findMany({
      where: {
        createdById: targetUserId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activity.aggregate({
      where: {
        createdById: targetUserId,
        createdAt: { gte: start, lte: end },
      },
      _sum: { score: true },
      _count: { id: true },
    }),
    prisma.activity.groupBy({
      by: ['type'],
      where: {
        createdById: targetUserId,
        createdAt: { gte: start, lte: end },
      },
      _sum: { score: true },
      _count: { type: true },
    }),
    prisma.activity.groupBy({
      by: ['createdAt'],
      where: {
        createdById: targetUserId,
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
    }),
  ])

  const trend: { date: string; count: number; score: number }[] = []
  const trendMap = new Map<string, { count: number; score: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    trendMap.set(key, { count: 0, score: 0 })
  }
  for (const act of activities) {
    const key = act.createdAt.toISOString().split('T')[0]
    if (trendMap.has(key)) {
      const cur = trendMap.get(key)!
      cur.count++
      cur.score += act.score
    }
  }
  for (const [date, val] of trendMap) {
    trend.push({ date, count: val.count, score: val.score })
  }

  const dayDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

  res.json({
    period,
    totalActivities: totalScore._count.id,
    totalScore: totalScore._sum.score || 0,
    dailyAverage: (totalScore._count.id / dayDiff).toFixed(2),
    byType: byType.map((t) => ({
      type: t.type,
      count: t._count.type,
      score: t._sum.score || 0,
    })),
    trend,
  })
})

// GET /api/activities/by-customer/:customerId
router.get('/by-customer/:customerId', async (req: AuthRequest, res: Response) => {
  const customerId = parseInt(req.params.customerId, 10)
  if (isNaN(customerId)) { res.status(400).json({ error: '无效的客户ID' }); return }

  const activities = await prisma.activity.findMany({
    where: { customerId },
    orderBy: { time: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  })

  res.json(activities)
})

// GET /api/activities/by-lead/:leadId
router.get('/by-lead/:leadId', async (req: AuthRequest, res: Response) => {
  const leadId = parseInt(req.params.leadId, 10)
  if (isNaN(leadId)) { res.status(400).json({ error: '无效的线索ID' }); return }

  const activities = await prisma.activity.findMany({
    where: { leadId },
    orderBy: { time: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  })

  res.json(activities)
})

// GET /api/activities/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的活动ID' }); return }

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true, leadNo: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })
  if (!activity) { res.status(404).json({ error: '活动不存在' }); return }

  res.json(activity)
})

// POST /api/activities - Create
router.post('/', async (req: AuthRequest, res: Response) => {
  const { type, title, content, time, duration, location, result, customerId, leadId, nextFollowUpAt, nextFollowUpNote } = req.body

  if (!type || !title || !time) {
    res.status(400).json({ error: '活动类型、主题和时间为必填项' })
    return
  }

  const score = SCORE_MAP[type] || 0

  try {
    const activity = await prisma.$transaction(async (tx) => {
      const act = await tx.activity.create({
        data: {
          type,
          title,
          content,
          time: new Date(time),
          duration: duration ? parseInt(duration, 10) : undefined,
          location,
          result: result || 'PENDING',
          score,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
          nextFollowUpNote,
          customerId: customerId ? parseInt(customerId, 10) : undefined,
          leadId: leadId ? parseInt(leadId, 10) : undefined,
          createdById: req.user!.id,
        },
        include: {
          customer: { select: { id: true, name: true } },
          lead: { select: { id: true, name: true, leadNo: true } },
          createdBy: { select: { id: true, name: true } },
        },
      })

      // Update customer's lastFollowUpAt if customerId provided
      if (customerId) {
        await tx.customer.update({
          where: { id: parseInt(customerId, 10) },
          data: { lastFollowUpAt: new Date() },
        })
      }

      // Create notification if nextFollowUpAt set
      if (nextFollowUpAt) {
        await tx.notification.create({
          data: {
            userId: req.user!.id,
            type: 'FOLLOW_UP_REMINDER' as any,
            title: `跟进提醒: ${title}`,
            content: nextFollowUpNote || `请在 ${new Date(nextFollowUpAt).toLocaleString('zh-CN')} 进行跟进`,
            relatedId: act.id,
            relatedType: 'ACTIVITY',
          },
        })
      }

      return act
    })

    res.status(201).json(activity)
  } catch (err: any) {
    res.status(500).json({ error: '创建活动失败', message: err.message })
  }
})

// PUT /api/activities/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的活动ID' }); return }

  const existing = await prisma.activity.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ error: '活动不存在' }); return }
  if (existing.createdById !== req.user!.id && !['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(req.user!.role)) {
    res.status(403).json({ error: '无权修改此活动' })
    return
  }

  const { type, title, content, time, duration, location, result, customerId, leadId, nextFollowUpAt, nextFollowUpNote } = req.body

  try {
    const score = type ? (SCORE_MAP[type] || 0) : existing.score

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        type,
        title,
        content,
        time: time ? new Date(time) : undefined,
        duration: duration !== undefined ? parseInt(duration, 10) : undefined,
        location,
        result,
        score,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
        nextFollowUpNote,
        customerId: customerId !== undefined ? (customerId ? parseInt(customerId, 10) : null) : undefined,
        leadId: leadId !== undefined ? (leadId ? parseInt(leadId, 10) : null) : undefined,
      },
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true, leadNo: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    res.json(activity)
  } catch (err: any) {
    res.status(500).json({ error: '更新活动失败', message: err.message })
  }
})

// DELETE /api/activities/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的活动ID' }); return }

  const existing = await prisma.activity.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ error: '活动不存在' }); return }
  if (existing.createdById !== req.user!.id && !['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(req.user!.role)) {
    res.status(403).json({ error: '无权删除此活动' })
    return
  }

  await prisma.activity.delete({ where: { id } })
  res.json({ success: true })
})

export default router
