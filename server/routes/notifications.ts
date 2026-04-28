import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// GET /api/notifications - List current user's notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', pageSize = '10', read } = req.query as Record<string, string>
  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = { userId: req.user!.id }
  if (read === 'true') where.readAt = { not: null }
  if (read === 'false') where.readAt = null

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ])

  res.json({
    data: notifications,
    pagination: { page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) },
  })
})

// GET /api/notifications/unread-count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.id, readAt: null },
  })
  res.json({ count })
})

// POST /api/notifications/:id/read
router.post('/:id/read', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的通知ID' }); return }

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) { res.status(404).json({ error: '通知不存在' }); return }
  if (notification.userId !== req.user!.id) {
    res.status(403).json({ error: '无权操作此通知' })
    return
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })

  res.json(updated)
})

// POST /api/notifications/read-all
router.post('/read-all', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, readAt: null },
    data: { readAt: new Date() },
  })

  res.json({ success: true })
})

export default router
