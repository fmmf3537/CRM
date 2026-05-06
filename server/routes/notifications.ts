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

// DELETE /api/notifications/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的通知ID' }); return }

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) { res.status(404).json({ error: '通知不存在' }); return }
  if (notification.userId !== req.user!.id) {
    res.status(403).json({ error: '无权操作此通知' })
    return
  }

  await prisma.notification.delete({ where: { id } })
  res.json({ success: true })
})

// POST /api/notifications/broadcast - Admin broadcast (ADMIN only)
router.post('/broadcast', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: '仅管理员可以发送系统公告' })
    return
  }

  const { title, content, userIds } = req.body
  if (!title) {
    res.status(400).json({ error: '标题为必填项' })
    return
  }

  try {
    let targetUserIds: number[] = []
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds.map(Number)
    } else {
      const allUsers = await prisma.user.findMany({ select: { id: true } })
      targetUserIds = allUsers.map((u) => u.id)
    }

    await prisma.notification.createMany({
      data: targetUserIds.map((userId) => ({
        userId,
        type: 'SYSTEM_NOTICE',
        title,
        content: content || '',
        relatedType: 'SYSTEM',
      })),
    })

    res.json({ success: true, count: targetUserIds.length })
  } catch (err: any) {
    res.status(500).json({ error: '发送公告失败', message: err.message })
  }
})

export default router
