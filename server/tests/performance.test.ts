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

describe('Performance API', () => {
  let customerId: number

  beforeEach(async () => {
    await prisma.payment.deleteMany()
    await prisma.achievement.deleteMany()
    await prisma.target.deleteMany()

    // Create a test customer
    const customer = await prisma.customer.create({
      data: { name: '业绩测试客户', industry: 'AGRICULTURE', region: '北京', ownerId: sales1.id },
    })
    customerId = customer.id
  })

  describe('POST /api/targets', () => {
    it('should create target with manager role', async () => {
      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({
          type: 'MONTHLY',
          year: 2026,
          month: 4,
          amount: 1000000,
          ownerId: sales1.id,
        })

      expect(res.status).toBe(201)
      expect(res.body.type).toBe('MONTHLY')
      expect(res.body.year).toBe(2026)
      expect(res.body.month).toBe(4)
      expect(res.body.amount).toBe(1000000)
      expect(res.body.ownerId).toBe(sales1.id)
    })

    it('should reject duplicate target', async () => {
      await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ type: 'MONTHLY', year: 2026, month: 4, amount: 500000, ownerId: sales1.id })

      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ type: 'MONTHLY', year: 2026, month: 4, amount: 600000, ownerId: sales1.id })

      expect(res.status).toBe(409)
    })

    it('should reject sales creating target', async () => {
      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ type: 'MONTHLY', year: 2026, month: 4, amount: 500000, ownerId: sales1.id })

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/targets', () => {
    it('should list targets', async () => {
      await prisma.target.create({
        data: { type: 'MONTHLY', year: 2026, month: 4, amount: 500000, ownerId: sales1.id, createdById: admin.id },
      })

      const res = await request(app)
        .get('/api/targets')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].amount).toBe(500000)
    })

    it('should filter by year', async () => {
      await prisma.target.create({
        data: { type: 'ANNUAL', year: 2025, amount: 5000000, ownerId: sales1.id, createdById: admin.id },
      })
      await prisma.target.create({
        data: { type: 'ANNUAL', year: 2026, amount: 6000000, ownerId: sales1.id, createdById: admin.id },
      })

      const res = await request(app)
        .get('/api/targets?year=2026')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].year).toBe(2026)
    })
  })

  describe('PUT /api/targets/:id', () => {
    it('should update target amount', async () => {
      const target = await prisma.target.create({
        data: { type: 'MONTHLY', year: 2026, month: 4, amount: 500000, ownerId: sales1.id, createdById: admin.id },
      })

      const res = await request(app)
        .put(`/api/targets/${target.id}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ amount: 800000 })

      expect(res.status).toBe(200)
      expect(res.body.amount).toBe(800000)
    })
  })

  describe('POST /api/achievements', () => {
    it('should create achievement with payments', async () => {
      const res = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: '测试成交',
          customerId,
          amount: 500000,
          contractDate: '2026-04-15',
          payments: [
            { amount: 250000, paymentDate: '2026-04-20', status: 'PAID' },
            { amount: 250000, paymentDate: '2026-05-20', status: 'PENDING' },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('测试成交')
      expect(res.body.amount).toBe(500000)
      expect(res.body.payments).toHaveLength(2)
      expect(res.body.payments[0].status).toBe('PAID')
    })

    it('should reject missing customerId', async () => {
      const res = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '测试成交', amount: 500000, contractDate: '2026-04-15' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/achievements', () => {
    it('should list achievements', async () => {
      await prisma.achievement.create({
        data: { name: '业绩A', customerId, amount: 300000, contractDate: new Date('2026-04-10'), createdById: sales1.id },
      })

      const res = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('业绩A')
    })
  })

  describe('GET /api/performance/summary', () => {
    it('should return correct summary with completion rate', async () => {
      // Set target
      await prisma.target.create({
        data: { type: 'MONTHLY', year: 2026, month: 4, amount: 1000000, ownerId: sales1.id, createdById: admin.id },
      })

      // Create achievement
      await prisma.achievement.create({
        data: { name: '业绩1', customerId, amount: 600000, contractDate: new Date('2026-04-15'), createdById: sales1.id },
      })

      const res = await request(app)
        .get('/api/performance/summary?period=month&year=2026&month=4&ownerId=' + sales1.id)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.targetAmount).toBe(1000000)
      expect(res.body.dealAmount).toBe(600000)
      expect(res.body.orderCount).toBe(1)
      expect(res.body.avgOrderValue).toBe(600000)
      expect(res.body.completionRate).toBe(60)
    })

    it('should return zero completion rate when no target', async () => {
      await prisma.achievement.create({
        data: { name: '业绩1', customerId, amount: 600000, contractDate: new Date('2026-04-15'), createdById: sales1.id },
      })

      const res = await request(app)
        .get('/api/performance/summary?period=month&year=2026&month=4')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.targetAmount).toBe(0)
      expect(res.body.completionRate).toBe(0)
    })
  })

  describe('GET /api/performance/ranking', () => {
    it('should return ranking sorted by amount', async () => {
      // Set targets
      await prisma.target.create({
        data: { type: 'MONTHLY', year: 2026, month: 4, amount: 1000000, ownerId: sales1.id, createdById: admin.id },
      })
      await prisma.target.create({
        data: { type: 'MONTHLY', year: 2026, month: 4, amount: 800000, ownerId: sales2.id, createdById: admin.id },
      })

      // Create achievements
      await prisma.achievement.create({
        data: { name: '业绩S1', customerId, amount: 700000, contractDate: new Date('2026-04-10'), createdById: sales1.id },
      })
      await prisma.achievement.create({
        data: { name: '业绩S2-1', customerId, amount: 400000, contractDate: new Date('2026-04-12'), createdById: sales2.id },
      })
      await prisma.achievement.create({
        data: { name: '业绩S2-2', customerId, amount: 200000, contractDate: new Date('2026-04-14'), createdById: sales2.id },
      })

      const res = await request(app)
        .get('/api/performance/ranking?period=month&year=2026&month=4&sortBy=amount')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2)

      const s1 = res.body.data.find((r: any) => r.userId === sales1.id)
      const s2 = res.body.data.find((r: any) => r.userId === sales2.id)

      expect(s1.dealAmount).toBe(700000)
      expect(s1.completionRate).toBe(70)
      expect(s2.dealAmount).toBe(600000)
      expect(s2.completionRate).toBe(75)

      // Check ranking order
      expect(res.body.data[0].rank).toBe(1)
    })

    it('should sort by count correctly', async () => {
      await prisma.achievement.create({
        data: { name: '业绩1', customerId, amount: 100000, contractDate: new Date('2026-04-10'), createdById: sales1.id },
      })
      await prisma.achievement.create({
        data: { name: '业绩2', customerId, amount: 100000, contractDate: new Date('2026-04-12'), createdById: sales1.id },
      })
      await prisma.achievement.create({
        data: { name: '业绩3', customerId, amount: 500000, contractDate: new Date('2026-04-14'), createdById: sales2.id },
      })

      const res = await request(app)
        .get('/api/performance/ranking?period=month&year=2026&month=4&sortBy=count')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].orderCount).toBeGreaterThanOrEqual(res.body.data[1]?.orderCount || 0)
    })
  })
})
