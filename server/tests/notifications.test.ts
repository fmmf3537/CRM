import request from 'supertest'
import app from '../index.js'
import { prisma } from '../db.js'
import { generateToken } from '../middleware/auth.js'

function authToken(user: { id: number; username: string; name: string; role: string }) {
  return generateToken(user)
}

const admin = { id: 1, username: 'admin', name: '管理员', role: 'ADMIN' }
const sales1 = { id: 2, username: 'sales1', name: '销售张三', role: 'SALES' }
const sales2 = { id: 3, username: 'sales2', name: '销售李四', role: 'SALES' }

describe('Notification API', () => {
  beforeEach(async () => {
    await prisma.notification.deleteMany()
  })

  describe('GET /api/notifications', () => {
    it('should return only current user notifications', async () => {
      await prisma.notification.createMany({
        data: [
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '通知1' },
          { userId: sales2.id, type: 'SYSTEM_NOTICE', title: '通知2' },
        ],
      })

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].title).toBe('通知1')
    })

    it('should filter by read status', async () => {
      await prisma.notification.createMany({
        data: [
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '未读', readAt: null },
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '已读', readAt: new Date() },
        ],
      })

      const unreadRes = await request(app)
        .get('/api/notifications?read=false')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(unreadRes.status).toBe(200)
      expect(unreadRes.body.data).toHaveLength(1)
      expect(unreadRes.body.data[0].title).toBe('未读')

      const readRes = await request(app)
        .get('/api/notifications?read=true')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(readRes.status).toBe(200)
      expect(readRes.body.data).toHaveLength(1)
      expect(readRes.body.data[0].title).toBe('已读')
    })
  })

  describe('GET /api/notifications/unread-count', () => {
    it('should return correct unread count', async () => {
      await prisma.notification.createMany({
        data: [
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '未读1' },
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '未读2' },
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '已读', readAt: new Date() },
        ],
      })

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.count).toBe(2)
    })
  })

  describe('POST /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const n = await prisma.notification.create({
        data: { userId: sales1.id, type: 'FOLLOW_UP_REMINDER', title: '跟进提醒' },
      })

      const res = await request(app)
        .post(`/api/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.readAt).not.toBeNull()

      const updated = await prisma.notification.findUnique({ where: { id: n.id } })
      expect(updated?.readAt).not.toBeNull()
    })

    it('should reject marking other user notification', async () => {
      const n = await prisma.notification.create({
        data: { userId: sales2.id, type: 'SYSTEM_NOTICE', title: '他人通知' },
      })

      const res = await request(app)
        .post(`/api/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .post('/api/notifications/9999/read')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await prisma.notification.createMany({
        data: [
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '通知1' },
          { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '通知2' },
          { userId: sales2.id, type: 'SYSTEM_NOTICE', title: '他人通知' },
        ],
      })

      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const s1Unread = await prisma.notification.count({
        where: { userId: sales1.id, readAt: null },
      })
      expect(s1Unread).toBe(0)

      const s2Unread = await prisma.notification.count({
        where: { userId: sales2.id, readAt: null },
      })
      expect(s2Unread).toBe(1)
    })

    it('should not fail when there are no unread notifications', async () => {
      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('DELETE /api/notifications/:id', () => {
    it('should delete own notification', async () => {
      const n = await prisma.notification.create({
        data: { userId: sales1.id, type: 'SYSTEM_NOTICE', title: '待删除通知' },
      })

      const res = await request(app)
        .delete(`/api/notifications/${n.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const deleted = await prisma.notification.findUnique({ where: { id: n.id } })
      expect(deleted).toBeNull()
    })

    it('should reject deleting other user notification', async () => {
      const n = await prisma.notification.create({
        data: { userId: sales2.id, type: 'SYSTEM_NOTICE', title: '他人通知' },
      })

      const res = await request(app)
        .delete(`/api/notifications/${n.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .delete('/api/notifications/99999')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(404)
    })

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .delete('/api/notifications/invalid')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/notifications/broadcast', () => {
    it('should allow admin to broadcast to all users', async () => {
      const res = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ title: '系统公告', content: '这是一条测试公告' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.count).toBeGreaterThanOrEqual(4)

      // Verify notifications were created for all seeded users
      const count = await prisma.notification.count({
        where: { type: 'SYSTEM_NOTICE', title: '系统公告' },
      })
      expect(count).toBeGreaterThanOrEqual(4)
    })

    it('should allow admin to broadcast to specific users', async () => {
      const res = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ title: '定向通知', content: '仅发给sales1', userIds: [sales1.id] })

      expect(res.status).toBe(200)
      expect(res.body.count).toBe(1)

      const count = await prisma.notification.count({
        where: { type: 'SYSTEM_NOTICE', title: '定向通知' },
      })
      expect(count).toBe(1)
    })

    it('should reject broadcast from non-admin', async () => {
      const res = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ title: '越权公告' })

      expect(res.status).toBe(403)
    })

    it('should reject broadcast without title', async () => {
      const res = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ content: '无标题' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/notifications pagination', () => {
    it('should support pagination', async () => {
      await prisma.notification.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          userId: sales1.id,
          type: 'SYSTEM_NOTICE' as const,
          title: `分页通知${i + 1}`,
        })),
      })

      const res = await request(app)
        .get('/api/notifications?pageSize=2')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.pagination.totalPages).toBe(3)
      expect(res.body.pagination.total).toBe(5)
    })
  })
})
