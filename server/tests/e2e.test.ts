import request from 'supertest'
import app from '../index.js'
import { prisma } from '../db.js'
import { generateToken } from '../middleware/auth.js'

function authToken(user: { id: number; username: string; name: string; role: string }) {
  return generateToken(user)
}

const admin = { id: 1, username: 'admin', name: '管理员', role: 'ADMIN' }
const sales1 = { id: 2, username: 'sales1', name: '销售张三', role: 'SALES' }

describe('E2E Scenarios', () => {
  beforeEach(async () => {
    await prisma.notification.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.achievement.deleteMany()
    await prisma.target.deleteMany()
    await prisma.stageHistory.deleteMany()
    await prisma.opportunity.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.contact.deleteMany()
    await prisma.businessInfo.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.user.deleteMany({ where: { id: { gt: 4 } } })
  })

  describe('Scenario 1: Login Flow', () => {
    it('should login and access protected routes', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'sales1', password: 'password' })

      expect(loginRes.status).toBe(200)
      expect(loginRes.body.token).toBeDefined()
      expect(loginRes.body.user.username).toBe('sales1')

      const token = loginRes.body.token
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(meRes.status).toBe(200)
      expect(meRes.body.name).toBe('销售张三')
    })
  })

  describe('Scenario 2: Customer Management', () => {
    it('should create customer and view details', async () => {
      // Create customer
      const createRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: 'E2E测试客户',
          industry: 'AGRICULTURE',
          region: '北京',
          contacts: [{ name: '张三', phone: '13800138000', isPrimary: true }],
        })

      expect(createRes.status).toBe(201)
      expect(createRes.body.name).toBe('E2E测试客户')
      const customerId = createRes.body.id

      // List customers
      const listRes = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(listRes.status).toBe(200)
      expect(listRes.body.data.some((c: any) => c.id === customerId)).toBe(true)

      // Get detail
      const detailRes = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(detailRes.status).toBe(200)
      expect(detailRes.body.name).toBe('E2E测试客户')
      expect(detailRes.body.contacts).toHaveLength(1)
      expect(detailRes.body.contacts[0].name).toBe('张三')
    })
  })

  describe('Scenario 3: Lead Conversion', () => {
    it('should create lead, assign self, convert to customer', async () => {
      // Create lead
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: 'E2E线索',
          contactName: '李四',
          contactPhone: '13900139000',
          industry: 'AGRICULTURE',
          region: '上海',
        })

      expect(leadRes.status).toBe(201)
      expect(leadRes.body.status).toBe('NEW')
      const leadId = leadRes.body.id

      // Claim lead
      const claimRes = await request(app)
        .post(`/api/leads/${leadId}/claim`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(claimRes.status).toBe(200)
      expect(claimRes.body.assigneeId).toBe(sales1.id)

      // Convert to customer
      const convertRes = await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          customerName: 'E2E转化客户',
          industry: 'AGRICULTURE',
          region: '上海',
        })

      expect(convertRes.status).toBe(200)
      expect(convertRes.body.customerId).toBeDefined()

      // Verify customer exists
      const customerRes = await request(app)
        .get(`/api/customers/${convertRes.body.customerId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(customerRes.status).toBe(200)
      expect(customerRes.body.name).toBe('E2E转化客户')

      // Verify lead status updated
      const leadCheck = await request(app)
        .get(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(leadCheck.status).toBe(200)
      expect(leadCheck.body.status).toBe('CONVERTED')
    })
  })

  describe('Scenario 4: Activity Record with Score', () => {
    it('should record visit activity and verify score', async () => {
      // Create customer first
      const customerRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '活动测试客户', industry: 'AGRICULTURE', region: '北京' })

      const customerId = customerRes.body.id

      // Create activity
      const activityRes = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          type: 'VISIT',
          title: '上门拜访测试',
          content: '与客户讨论需求',
          time: new Date().toISOString(),
          customerId,
        })

      expect(activityRes.status).toBe(201)
      expect(activityRes.body.score).toBe(3) // VISIT = 3分
      expect(activityRes.body.type).toBe('VISIT')

      // Verify in list
      const listRes = await request(app)
        .get('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(listRes.status).toBe(200)
      expect(listRes.body.data.some((a: any) => a.title === '上门拜访测试')).toBe(true)

      // Verify workload
      const workloadRes = await request(app)
        .get('/api/activities/workload')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(workloadRes.status).toBe(200)
      expect(workloadRes.body.totalActivities).toBeGreaterThanOrEqual(1)
      expect(workloadRes.body.totalScore).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Scenario 5: Opportunity Advance and Close', () => {
    it('should create opportunity, advance stage, close won', async () => {
      // Create customer
      const customerRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '商机测试客户', industry: 'AGRICULTURE', region: '北京' })

      const customerId = customerRes.body.id

      // Create opportunity
      const oppRes = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: 'E2E商机',
          customerId,
          amount: 500000,
          stage: 'STAGE_01',
        })

      expect(oppRes.status).toBe(201)
      expect(oppRes.body.stage).toBe('STAGE_01')
      expect(oppRes.body.winRate).toBe(10)
      const oppId = oppRes.body.id

      // Advance to STAGE_02
      const advRes = await request(app)
        .post(`/api/opportunities/${oppId}/advance`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ toStage: 'STAGE_02' })

      expect(advRes.status).toBe(200)
      expect(advRes.body.stage).toBe('STAGE_02')
      expect(advRes.body.winRate).toBe(25)

      // Verify stage history
      expect(advRes.body.stageHistories.length).toBeGreaterThanOrEqual(1)

      // Close as WON
      const closeRes = await request(app)
        .post(`/api/opportunities/${oppId}/close`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ result: 'WON', remarks: '成功签约' })

      expect(closeRes.status).toBe(200)
      expect(closeRes.body.status).toBe('WON')
      expect(closeRes.body.stage).toBe('STAGE_05')
      expect(closeRes.body.winRate).toBe(100)
    })

    it('should reject skipping stages', async () => {
      const customerRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '跳过测试', industry: 'AGRICULTURE', region: '北京' })

      const oppRes = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '跳过商机', customerId: customerRes.body.id, stage: 'STAGE_01' })

      const skipRes = await request(app)
        .post(`/api/opportunities/${oppRes.body.id}/advance`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ toStage: 'STAGE_03' })

      expect(skipRes.status).toBe(400)
    })
  })

  describe('Scenario 6: Performance Ranking', () => {
    it('should record achievement and verify ranking', async () => {
      // Create customer
      const customerRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '业绩测试客户', industry: 'AGRICULTURE', region: '北京' })

      const customerId = customerRes.body.id

      // Set target for sales1
      await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({
          type: 'MONTHLY',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          amount: 1000000,
          ownerId: sales1.id,
        })

      // Record achievement
      const achRes = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: 'E2E成交',
          customerId,
          amount: 600000,
          contractDate: new Date().toISOString().slice(0, 10),
        })

      expect(achRes.status).toBe(201)
      expect(achRes.body.amount).toBe(600000)

      // Check summary
      const summaryRes = await request(app)
        .get('/api/performance/summary')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(summaryRes.status).toBe(200)
      expect(summaryRes.body.dealAmount).toBe(600000)
      expect(summaryRes.body.completionRate).toBe(60)

      // Check ranking
      const rankRes = await request(app)
        .get('/api/performance/ranking?sortBy=amount')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(rankRes.status).toBe(200)
      const myRank = rankRes.body.data.find((r: any) => r.userId === sales1.id)
      expect(myRank).toBeDefined()
      expect(myRank.dealAmount).toBe(600000)
      expect(myRank.rank).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Scenario 7: Notification Center', () => {
    it('should create notification via activity and mark as read', async () => {
      // Create customer
      const customerRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '通知测试客户', industry: 'AGRICULTURE', region: '北京' })

      // Create activity with next follow-up (triggers notification)
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 1)

      await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          type: 'PHONE',
          title: '电话沟通',
          time: new Date().toISOString(),
          customerId: customerRes.body.id,
          nextFollowUpAt: nextDate.toISOString(),
        })

      // Check unread count
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(countRes.status).toBe(200)
      expect(countRes.body.count).toBeGreaterThanOrEqual(1)

      // Mark all as read
      const readAllRes = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(readAllRes.status).toBe(200)

      // Verify count is 0
      const countAfterRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(countAfterRes.body.count).toBe(0)
    })
  })

  describe('Scenario 8: Admin System Management', () => {
    it('should manage users and configs as admin', async () => {
      // Create user
      const createRes = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({
          username: 'e2enewuser',
          name: 'E2E新用户',
          password: 'E2ePass1',
          role: 'SALES',
        })

      expect(createRes.status).toBe(201)
      const userId = createRes.body.id

      // Update user
      const updateRes = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ name: 'E2E已更新', role: 'MANAGER' })

      expect(updateRes.status).toBe(200)
      expect(updateRes.body.role).toBe('MANAGER')

      // Update config
      const configRes = await request(app)
        .put('/api/admin/config/regions')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({
          value: [
            { value: 'NORTH', label: '华北' },
            { value: 'SOUTH', label: '华南' },
          ],
        })

      expect(configRes.status).toBe(200)
      expect(configRes.body.value).toHaveLength(2)

      // Read config back
      const readRes = await request(app)
        .get('/api/admin/config/regions')
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(readRes.status).toBe(200)
      expect(readRes.body.value[0].value).toBe('NORTH')

      // Delete user
      const deleteRes = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(deleteRes.status).toBe(200)
    })

    it('should reject non-admin access', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(403)
    })
  })

  describe('Scenario 9: Password Change Flow', () => {
    it('should change password and login with new password', async () => {
      // Create a test user
      const bcrypt = await import('bcryptjs')
      const user = await prisma.user.create({
        data: {
          username: 'pwdscenario',
          name: '密码场景测试',
          password: await bcrypt.hash('OldPass1', 10),
          role: 'SALES',
        },
      })
      const userToken = authToken({ id: user.id, username: 'pwdscenario', name: '密码场景测试', role: 'SALES' })

      // Change password
      const changeRes = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ oldPassword: 'OldPass1', newPassword: 'NewPass2' })

      expect(changeRes.status).toBe(200)
      expect(changeRes.body.success).toBe(true)

      // Login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'pwdscenario', password: 'NewPass2' })

      expect(loginRes.status).toBe(200)
      expect(loginRes.body.token).toBeDefined()

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Scenario 10: Profile Update Flow', () => {
    it('should update profile and persist across token refresh', async () => {
      const bcrypt = await import('bcryptjs')
      const user = await prisma.user.create({
        data: {
          username: 'profilescenario',
          name: '原名称',
          password: await bcrypt.hash('TestPass1', 10),
          role: 'SALES',
        },
      })
      const userToken = authToken({ id: user.id, username: 'profilescenario', name: '原名称', role: 'SALES' })

      // Update profile
      const updateRes = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: '新显示名称' })

      expect(updateRes.status).toBe(200)
      expect(updateRes.body.user.name).toBe('新显示名称')
      expect(updateRes.body.token).toBeDefined()

      // Verify via /me with new token
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${updateRes.body.token}`)

      expect(meRes.status).toBe(200)
      expect(meRes.body.name).toBe('新显示名称')

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Scenario 11: Notification Delete and Broadcast', () => {
    it('should broadcast and delete notification', async () => {
      // Admin broadcasts
      const broadcastRes = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ title: '场景测试公告', content: '测试广播内容', userIds: [sales1.id] })

      expect(broadcastRes.status).toBe(200)
      expect(broadcastRes.body.count).toBe(1)

      // Sales1 reads notification
      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1)
      const notificationId = listRes.body.data[0].id

      // Sales1 deletes notification
      const deleteRes = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(deleteRes.status).toBe(200)

      // Verify deleted
      const deleted = await prisma.notification.findUnique({ where: { id: notificationId } })
      expect(deleted).toBeNull()
    })
  })

  describe('Scenario 12: Target and Achievement Lifecycle', () => {
    it('should create, update, and delete target and achievement', async () => {
      // Create customer first
      const customer = await prisma.customer.create({
        data: { name: '生命周期测试客户', industry: 'AGRICULTURE', region: '北京', ownerId: sales1.id },
      })

      // Create target
      const targetRes = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ type: 'MONTHLY', year: 2026, month: 6, amount: 500000, ownerId: sales1.id })

      expect(targetRes.status).toBe(201)
      const targetId = targetRes.body.id

      // Create achievement
      const achievementRes = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '生命周期战绩', customerId: customer.id, amount: 300000, contractDate: '2026-06-15' })

      expect(achievementRes.status).toBe(201)
      const achievementId = achievementRes.body.id

      // Update achievement
      const updateRes = await request(app)
        .put(`/api/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ amount: 400000 })

      expect(updateRes.status).toBe(200)
      expect(updateRes.body.amount).toBe(400000)

      // Delete achievement
      const delAchievementRes = await request(app)
        .delete(`/api/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(delAchievementRes.status).toBe(200)

      // Delete target
      const delTargetRes = await request(app)
        .delete(`/api/targets/${targetId}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(delTargetRes.status).toBe(200)
    })
  })
})
