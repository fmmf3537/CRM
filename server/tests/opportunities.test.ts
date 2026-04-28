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

describe('Opportunity API', () => {
  let customerId: number

  beforeEach(async () => {
    await prisma.stageHistory.deleteMany()
    await prisma.opportunity.deleteMany()

    // Create a test customer
    const customer = await prisma.customer.create({
      data: { name: '商机测试客户', industry: 'AGRICULTURE', region: '北京', ownerId: sales1.id },
    })
    customerId = customer.id
  })

  describe('POST /api/opportunities', () => {
    it('should create opportunity with auto winRate for STAGE_01', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: '测试商机01',
          customerId,
          amount: 100000,
          stage: 'STAGE_01',
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('测试商机01')
      expect(res.body.stage).toBe('STAGE_01')
      expect(res.body.status).toBe('IN_PROGRESS')
      expect(res.body.winRate).toBe(10)
    })

    it('should create opportunity with auto winRate for STAGE_03', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: '测试商机03',
          customerId,
          amount: 500000,
          stage: 'STAGE_03',
        })

      expect(res.status).toBe(201)
      expect(res.body.stage).toBe('STAGE_03')
      expect(res.body.winRate).toBe(50)
    })

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          customerId,
          amount: 100000,
        })

      expect(res.status).toBe(400)
    })

    it('should reject missing customerId', async () => {
      const res = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: '测试商机',
          amount: 100000,
        })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/opportunities', () => {
    it('should list opportunities with pagination', async () => {
      await prisma.opportunity.create({
        data: {
          name: '商机A',
          customerId,
          ownerId: sales1.id,
          stage: 'STAGE_01',
          status: 'IN_PROGRESS',
          winRate: 10,
        },
      })

      const res = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('商机A')
      expect(res.body.pagination.total).toBe(1)
    })

    it('should filter by stage', async () => {
      await prisma.opportunity.create({
        data: { name: '商机S1', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })
      await prisma.opportunity.create({
        data: { name: '商机S2', customerId, ownerId: sales1.id, stage: 'STAGE_02', status: 'IN_PROGRESS', winRate: 25 },
      })

      const res = await request(app)
        .get('/api/opportunities?stage=STAGE_02')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('商机S2')
    })
  })

  describe('GET /api/opportunities/:id', () => {
    it('should return opportunity with stageHistories', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '商机详情', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })
      await prisma.stageHistory.create({
        data: { opportunityId: opp.id, fromStage: 'STAGE_01', toStage: 'STAGE_01', changedById: sales1.id, remarks: '创建商机' },
      })

      const res = await request(app)
        .get(`/api/opportunities/${opp.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('商机详情')
      expect(res.body.stageHistories).toHaveLength(1)
      expect(res.body.stageHistories[0].remarks).toBe('创建商机')
    })
  })

  describe('POST /api/opportunities/:id/advance', () => {
    it('should advance to next stage and create stageHistory', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '推进测试', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/advance`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ toStage: 'STAGE_02', remarks: '需求已确认' })

      expect(res.status).toBe(200)
      expect(res.body.stage).toBe('STAGE_02')
      expect(res.body.winRate).toBe(25)
      expect(res.body.stageHistories).toHaveLength(1)
      expect(res.body.stageHistories[0].fromStage).toBe('STAGE_01')
      expect(res.body.stageHistories[0].toStage).toBe('STAGE_02')
      expect(res.body.stageHistories[0].remarks).toBe('需求已确认')
    })

    it('should reject skipping stages', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '跳阶段测试', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/advance`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ toStage: 'STAGE_03' })

      expect(res.status).toBe(400)
    })

    it('should reject backward advancement', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '回退测试', customerId, ownerId: sales1.id, stage: 'STAGE_03', status: 'IN_PROGRESS', winRate: 50 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/advance`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ toStage: 'STAGE_02' })

      expect(res.status).toBe(400)
    })

    it('should reject advancing closed opportunity', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '已关闭', customerId, ownerId: sales1.id, stage: 'STAGE_05', status: 'WON', winRate: 100 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/advance`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ toStage: 'STAGE_05' })

      expect(res.status).toBe(403)
    })

    it('should allow manager to advance others opportunity', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '经理推进', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/advance`)
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ toStage: 'STAGE_02' })

      expect(res.status).toBe(200)
    })

    it('should reject other sales advancing opportunity', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '越权推进', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/advance`)
        .set('Authorization', `Bearer ${authToken(sales2)}`)
        .send({ toStage: 'STAGE_02' })

      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/opportunities/:id/close', () => {
    it('should close as WON and set stage to STAGE_05', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '赢单测试', customerId, ownerId: sales1.id, stage: 'STAGE_04', status: 'IN_PROGRESS', winRate: 75 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/close`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ result: 'WON', remarks: '客户已签约' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('WON')
      expect(res.body.stage).toBe('STAGE_05')
      expect(res.body.winRate).toBe(100)
      expect(res.body.stageHistories[0].toStage).toBe('STAGE_05')
      expect(res.body.stageHistories[0].remarks).toBe('客户已签约')
    })

    it('should close as LOST and set stage to STAGE_99', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '输单测试', customerId, ownerId: sales1.id, stage: 'STAGE_03', status: 'IN_PROGRESS', winRate: 50 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/close`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ result: 'LOST', remarks: '竞争对手中标' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('LOST')
      expect(res.body.stage).toBe('STAGE_99')
      expect(res.body.winRate).toBe(0)
      expect(res.body.stageHistories[0].toStage).toBe('STAGE_99')
    })

    it('should reject closing already closed opportunity', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '已关闭', customerId, ownerId: sales1.id, stage: 'STAGE_99', status: 'LOST', winRate: 0 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/close`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ result: 'LOST' })

      expect(res.status).toBe(403)
    })

    it('should reject invalid result', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '无效关闭', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/close`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ result: 'INVALID' })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/opportunities/:id', () => {
    it('should update opportunity fields', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '编辑前', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .put(`/api/opportunities/${opp.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '编辑后', amount: 200000 })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('编辑后')
      expect(res.body.amount).toBe(200000)
    })

    it('should reject editing closed opportunity', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '已关闭', customerId, ownerId: sales1.id, stage: 'STAGE_99', status: 'LOST', winRate: 0 },
      })

      const res = await request(app)
        .put(`/api/opportunities/${opp.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '尝试编辑' })

      expect(res.status).toBe(403)
    })

    it('should reject update by other sales', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '权限测试', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .put(`/api/opportunities/${opp.id}`)
        .set('Authorization', `Bearer ${authToken(sales2)}`)
        .send({ name: '越权编辑' })

      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/opportunities/:id', () => {
    it('should delete opportunity', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '删除测试', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .delete(`/api/opportunities/${opp.id}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const deleted = await prisma.opportunity.findUnique({ where: { id: opp.id } })
      expect(deleted).toBeNull()
    })

    it('should reject delete by other sales', async () => {
      const opp = await prisma.opportunity.create({
        data: { name: '权限删除', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10 },
      })

      const res = await request(app)
        .delete(`/api/opportunities/${opp.id}`)
        .set('Authorization', `Bearer ${authToken(sales2)}`)

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/opportunities/pipeline', () => {
    it('should return pipeline analysis with correct aggregation', async () => {
      // Create multiple opportunities at different stages
      await prisma.opportunity.create({
        data: { name: 'P1', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10, amount: 100000 },
      })
      await prisma.opportunity.create({
        data: { name: 'P2', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10, amount: 200000 },
      })
      await prisma.opportunity.create({
        data: { name: 'P3', customerId, ownerId: sales1.id, stage: 'STAGE_02', status: 'IN_PROGRESS', winRate: 25, amount: 300000 },
      })
      await prisma.opportunity.create({
        data: { name: 'P4', customerId, ownerId: sales1.id, stage: 'STAGE_03', status: 'IN_PROGRESS', winRate: 50, amount: 400000 },
      })
      await prisma.opportunity.create({
        data: { name: 'P5', customerId, ownerId: sales1.id, stage: 'STAGE_05', status: 'WON', winRate: 100, amount: 500000 },
      })
      await prisma.opportunity.create({
        data: { name: 'P6', customerId, ownerId: sales1.id, stage: 'STAGE_99', status: 'LOST', winRate: 0, amount: 600000 },
      })

      const res = await request(app)
        .get('/api/opportunities/pipeline')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.totalCount).toBe(6)
      expect(res.body.totalAmount).toBe(2100000)
      expect(res.body.lostCount).toBe(1)
      expect(res.body.lostAmount).toBe(600000)

      const s1 = res.body.pipeline.find((p: any) => p.stage === 'STAGE_01')
      expect(s1.count).toBe(2)
      expect(s1.amount).toBe(300000)
      expect(s1.winRate).toBe(10)

      const s2 = res.body.pipeline.find((p: any) => p.stage === 'STAGE_02')
      expect(s2.count).toBe(1)
      expect(s2.amount).toBe(300000)

      const s5 = res.body.pipeline.find((p: any) => p.stage === 'STAGE_05')
      expect(s5.count).toBe(1)
      expect(s5.amount).toBe(500000)
    })

    it('should filter by date range', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      await prisma.opportunity.create({
        data: { name: '旧商机', customerId, ownerId: sales1.id, stage: 'STAGE_01', status: 'IN_PROGRESS', winRate: 10, amount: 100000, createdAt: yesterday },
      })

      const todayStr = new Date().toISOString().slice(0, 10)
      const res = await request(app)
        .get(`/api/opportunities/pipeline?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.totalCount).toBe(0)
    })
  })
})
