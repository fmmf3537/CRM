import request from 'supertest'
import app from '../index.js'
import { prisma } from '../db.js'
import { generateToken } from '../middleware/auth.js'

function authToken(user: { id: number; username: string; name: string; role: string }) {
  return generateToken(user)
}

const _admin = { id: 1, username: 'admin', name: '管理员', role: 'ADMIN' }
const sales1 = { id: 2, username: 'sales1', name: '销售张三', role: 'SALES' }

describe('Activity API', () => {
  let customerId: number

  beforeEach(async () => {
    await prisma.activity.deleteMany()
    await prisma.notification.deleteMany()

    // Create a test customer
    const customer = await prisma.customer.create({
      data: { name: '活动测试客户', industry: 'AGRICULTURE', region: '北京', ownerId: sales1.id },
    })
    customerId = customer.id
  })

  describe('POST /api/activities', () => {
    it('should create activity with correct score', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          type: 'EXHIBITION',
          title: '参加无人机展会',
          content: '与客户面谈',
          time: new Date().toISOString(),
          duration: 120,
          customerId,
        })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('参加无人机展会')
      expect(res.body.score).toBe(5) // EXHIBITION = 5分
      expect(res.body.type).toBe('EXHIBITION')
    })

    it('should update customer lastFollowUpAt', async () => {
      await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          type: 'PHONE',
          title: '电话沟通',
          time: new Date().toISOString(),
          customerId,
        })

      const customer = await prisma.customer.findUnique({ where: { id: customerId } })
      expect(customer!.lastFollowUpAt).not.toBeNull()
    })

    it('should create notification when nextFollowUpAt set', async () => {
      const nextTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          type: 'VISIT',
          title: '上门拜访',
          time: new Date().toISOString(),
          customerId,
          nextFollowUpAt: nextTime.toISOString(),
          nextFollowUpNote: '准备报价单',
        })

      expect(res.status).toBe(201)

      const notifications = await prisma.notification.findMany({ where: { userId: sales1.id } })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toContain('跟进提醒')
      expect(notifications[0].type).toBe('FOLLOW_UP_REMINDER')
    })

    it('should return 400 when title or time is missing', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ type: 'PHONE' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/activities', () => {
    beforeEach(async () => {
      await prisma.activity.createMany({
        data: [
          { type: 'PHONE', title: '电话1', time: new Date(), score: 1, createdById: sales1.id, customerId },
          { type: 'VISIT', title: '拜访1', time: new Date(), score: 3, createdById: sales1.id, customerId },
          { type: 'PHONE', title: '电话2', time: new Date(), score: 1, createdById: sales1.id, customerId },
        ],
      })
    })

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/activities?type=PHONE')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data.every((a: any) => a.type === 'PHONE')).toBe(true)
    })

    it('should filter by customerId', async () => {
      const res = await request(app)
        .get(`/api/activities?customerId=${customerId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(3)
    })
  })

  describe('GET /api/activities/workload', () => {
    beforeEach(async () => {
      const now = new Date()
      await prisma.activity.createMany({
        data: [
          { type: 'PHONE', title: '电话', time: now, score: 1, createdById: sales1.id },
          { type: 'VISIT', title: '拜访', time: now, score: 3, createdById: sales1.id },
          { type: 'EXHIBITION', title: '展会', time: now, score: 5, createdById: sales1.id },
          { type: 'PHONE', title: '电话2', time: now, score: 1, createdById: sales1.id },
        ],
      })
    })

    it('should return correct workload stats', async () => {
      const res = await request(app)
        .get('/api/activities/workload?period=month')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.totalActivities).toBe(4)
      expect(res.body.totalScore).toBe(10)
      expect(res.body.byType).toHaveLength(3)
      expect(res.body.trend).toHaveLength(30)
    })
  })

  describe('GET /api/activities/calendar', () => {
    beforeEach(async () => {
      const now = new Date()
      await prisma.activity.createMany({
        data: [
          { type: 'PHONE', title: '今天电话', time: now, score: 1, createdById: sales1.id },
          { type: 'VISIT', title: '今天拜访', time: now, score: 3, createdById: sales1.id },
        ],
      })
    })

    it('should return activities grouped by date', async () => {
      const now = new Date()
      const res = await request(app)
        .get(`/api/activities/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      const today = now.toISOString().split('T')[0]
      expect(res.body[today]).toHaveLength(2)
    })
  })

  describe('PUT /api/activities/:id', () => {
    it('should allow owner to update', async () => {
      const activity = await prisma.activity.create({
        data: { type: 'PHONE', title: '旧标题', time: new Date(), score: 1, createdById: sales1.id },
      })

      const res = await request(app)
        .put(`/api/activities/${activity.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ type: 'PHONE', title: '新标题', time: new Date().toISOString() })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('新标题')
    })
  })

  describe('DELETE /api/activities/:id', () => {
    it('should delete activity', async () => {
      const activity = await prisma.activity.create({
        data: { type: 'PHONE', title: '待删除', time: new Date(), score: 1, createdById: sales1.id },
      })

      const res = await request(app)
        .delete(`/api/activities/${activity.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
