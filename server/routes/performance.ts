import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

function getPeriodRange(period: string, year: number, quarter?: number, month?: number) {
  if (period === 'month' && month) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    return { start, end }
  }
  if (period === 'quarter' && quarter) {
    const start = new Date(year, (quarter - 1) * 3, 1)
    const end = new Date(year, quarter * 3, 0, 23, 59, 59)
    return { start, end }
  }
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59)
  return { start, end }
}

// GET /api/performance/summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const { period = 'month', year, quarter, month, ownerId } = req.query as Record<string, string>

  const now = new Date()
  const targetYear = year ? parseInt(year, 10) : now.getFullYear()
  const targetQuarter = quarter ? parseInt(quarter, 10) : undefined
  const targetMonth = month ? parseInt(month, 10) : undefined

  const { start, end } = getPeriodRange(period, targetYear, targetQuarter, targetMonth)

  const targetWhere: any = { year: targetYear }
  const achievementWhere: any = {
    contractDate: { gte: start, lte: end },
  }

  if (ownerId) {
    targetWhere.ownerId = parseInt(ownerId, 10)
    achievementWhere.createdById = parseInt(ownerId, 10)
  }

  if (period === 'month') {
    targetWhere.type = 'MONTHLY'
    targetWhere.month = targetMonth || now.getMonth() + 1
  } else if (period === 'quarter') {
    targetWhere.type = 'QUARTERLY'
    targetWhere.quarter = targetQuarter || Math.floor(now.getMonth() / 3) + 1
  } else {
    targetWhere.type = 'ANNUAL'
  }

  const [targetsAgg, achievementsAgg, achievementsCount, paymentAgg] = await Promise.all([
    prisma.target.aggregate({ where: targetWhere, _sum: { amount: true } }),
    prisma.achievement.aggregate({ where: achievementWhere, _sum: { amount: true } }),
    prisma.achievement.count({ where: achievementWhere }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        achievement: achievementWhere,
      },
      _sum: { amount: true },
    }),
  ])

  const targetAmount = targetsAgg._sum.amount || 0
  const dealAmount = achievementsAgg._sum.amount || 0
  const paidAmount = paymentAgg._sum.amount || 0
  const completionRate = targetAmount > 0 ? ((dealAmount / targetAmount) * 100).toFixed(1) : '0.0'

  res.json({
    period,
    year: targetYear,
    quarter: targetQuarter,
    month: targetMonth,
    targetAmount,
    dealAmount,
    paidAmount,
    orderCount: achievementsCount,
    avgOrderValue: achievementsCount > 0 ? dealAmount / achievementsCount : 0,
    completionRate: parseFloat(completionRate),
  })
})

// GET /api/performance/ranking
router.get('/ranking', async (req: AuthRequest, res: Response) => {
  const { period = 'month', year, quarter, month, sortBy = 'amount' } = req.query as Record<string, string>

  const now = new Date()
  const targetYear = year ? parseInt(year, 10) : now.getFullYear()
  const targetQuarter = quarter ? parseInt(quarter, 10) : undefined
  const targetMonth = month ? parseInt(month, 10) : undefined

  const { start, end } = getPeriodRange(period, targetYear, targetQuarter, targetMonth)

  const users = await prisma.user.findMany({
    where: { role: { in: ['SALES', 'MANAGER'] } },
    select: { id: true, name: true, role: true },
    orderBy: { id: 'asc' },
  })

  const targetWhere: any = { year: targetYear }
  if (period === 'month') {
    targetWhere.type = 'MONTHLY'
    targetWhere.month = targetMonth || now.getMonth() + 1
  } else if (period === 'quarter') {
    targetWhere.type = 'QUARTERLY'
    targetWhere.quarter = targetQuarter || Math.floor(now.getMonth() / 3) + 1
  } else {
    targetWhere.type = 'ANNUAL'
  }

  const targets = await prisma.target.findMany({
    where: targetWhere,
    select: { ownerId: true, amount: true },
  })

  const achievements = await prisma.achievement.groupBy({
    by: ['createdById'],
    where: { contractDate: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: { id: true },
  })

  const allAchievementsInPeriod = await prisma.achievement.findMany({
    where: { contractDate: { gte: start, lte: end } },
    include: { payments: { where: { status: 'PAID' }, select: { amount: true } } },
  })

  const paidByUser: Record<number, number> = {}
  for (const a of allAchievementsInPeriod) {
    const paid = a.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    paidByUser[a.createdById] = (paidByUser[a.createdById] || 0) + paid
  }

  const ranking = users.map((user) => {
    const targetAmount = targets
      .filter((t) => t.ownerId === user.id)
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const dealAmount = achievements
      .find((a) => a.createdById === user.id)?._sum.amount || 0
    const orderCount = achievements
      .find((a) => a.createdById === user.id)?._count.id || 0
    const paidAmount = paidByUser[user.id] || 0
    const completionRate = targetAmount > 0 ? (dealAmount / targetAmount) * 100 : 0

    return {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetAmount,
      dealAmount,
      paidAmount,
      orderCount,
      avgOrderValue: orderCount > 0 ? dealAmount / orderCount : 0,
      completionRate,
    }
  })

  ranking.sort((a, b) => {
    if (sortBy === 'amount') return b.dealAmount - a.dealAmount
    if (sortBy === 'count') return b.orderCount - a.orderCount
    if (sortBy === 'rate') return b.completionRate - a.completionRate
    return b.dealAmount - a.dealAmount
  })

  const result = ranking.map((item, index) => ({ ...item, rank: index + 1 }))

  res.json({ period, year: targetYear, quarter: targetQuarter, month: targetMonth, data: result })
})

export default router
