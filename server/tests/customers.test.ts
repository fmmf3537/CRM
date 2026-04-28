import request from 'supertest'
import app from '../index'
import { prisma } from '../db'
import { generateToken } from '../middleware/auth'

// Helper: create authenticated agent
function authAgent(user: { id: number; username: string; name: string; role: string }) {
  const token = generateToken(user)
  return { token, user }
}

const admin = authAgent({ id: 1, username: 'admin', name: '管理员', role: 'ADMIN' })
const sales1 = authAgent({ id: 2, username: 'sales1', name: '销售张三', role: 'SALES' })
const sales2 = authAgent({ id: 3, username: 'sales2', name: '销售李四', role: 'SALES' })

describe('Customer API', () => {
  describe('POST /api/customers', () => {
    it('should create customer successfully and return 201', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${sales1.token}`)
        .send({
          name: '测试客户公司',
          industry: 'AGRICULTURE',
          region: '北京',
          contacts: [{ name: '张三', phone: '13800138000', isPrimary: true }],
          businessInfo: { requirements: '需要农业植保无人机', budget: '50万' },
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('测试客户公司')
      expect(res.body.contacts).toHaveLength(1)
      expect(res.body.businessInfo).toBeDefined()
    })

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({ name: '测试', industry: 'AGRICULTURE', region: '北京' })

      expect(res.status).toBe(401)
    })

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${sales1.token}`)
        .send({ industry: 'AGRICULTURE', region: '北京' })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('客户名称')
    })
  })

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      // Seed some customers
      await prisma.customer.create({
        data: {
          name: '无人机科技公司',
          industry: 'AGRICULTURE',
          region: '北京',
          ownerId: sales1.user.id,
          contacts: { create: { name: '李四', isPrimary: true } },
        },
      })
      await prisma.customer.create({
        data: {
          name: '蓝天物流',
          industry: 'LOGISTICS',
          region: '上海',
          ownerId: sales2.user.id,
          contacts: { create: { name: '王五', isPrimary: true } },
        },
      })
    })

    it('should search "无人机" and return matching results', async () => {
      const res = await request(app)
        .get('/api/customers?keyword=无人机')
        .set('Authorization', `Bearer ${sales1.token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toContain('无人机')
      expect(res.body.pagination.total).toBe(1)
    })

    it('should filter by industry', async () => {
      const res = await request(app)
        .get('/api/customers?industry=LOGISTICS')
        .set('Authorization', `Bearer ${sales1.token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].industry).toBe('LOGISTICS')
    })

    it('should return paginated results', async () => {
      const res = await request(app)
        .get('/api/customers?page=1&pageSize=1')
        .set('Authorization', `Bearer ${sales1.token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.pagination.totalPages).toBe(2)
    })
  })

  describe('GET /api/customers/:id', () => {
    it('should return customer detail with contacts and businessInfo', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: '详情测试客户',
          industry: 'SECURITY',
          region: '深圳',
          ownerId: sales1.user.id,
          contacts: {
            create: [
              { name: '联系人A', isPrimary: true, phone: '13900139000' },
              { name: '联系人B', decisionRole: 'DECISION_MAKER' },
            ],
          },
          businessInfo: { create: { requirements: '安防巡检', budget: '100万' } },
        },
      })

      const res = await request(app)
        .get(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${sales1.token}`)

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('详情测试客户')
      expect(res.body.contacts).toHaveLength(2)
      expect(res.body.businessInfo).toBeDefined()
      expect(res.body.businessInfo.budget).toBe('100万')
    })

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .get('/api/customers/99999')
        .set('Authorization', `Bearer ${sales1.token}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/customers/:id', () => {
    it('should allow owner to update their customer', async () => {
      const customer = await prisma.customer.create({
        data: { name: '可编辑客户', industry: 'ENERGY', region: '广州', ownerId: sales1.user.id },
      })

      const res = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${sales1.token}`)
        .send({ name: '已更新客户', industry: 'ENERGY', region: '广州' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('已更新客户')
    })

    it('should return 403 when sales tries to modify another sales customer', async () => {
      const customer = await prisma.customer.create({
        data: { name: '他人客户', industry: 'TELECOM', region: '成都', ownerId: sales2.user.id },
      })

      const res = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${sales1.token}`)
        .send({ name: '恶意修改', industry: 'TELECOM', region: '成都' })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('无权')
    })

    it('should allow manager to modify any customer', async () => {
      const manager = authAgent({ id: 4, username: 'manager', name: '主管', role: 'MANAGER' })
      const customer = await prisma.customer.create({
        data: { name: '销售的客户', industry: 'FILM', region: '杭州', ownerId: sales1.user.id },
      })

      const res = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({ name: '主管修改后', industry: 'FILM', region: '杭州' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('主管修改后')
    })
  })

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer and cascade contacts', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: '待删除客户',
          industry: 'MINING',
          region: '西安',
          ownerId: sales1.user.id,
          contacts: { create: { name: '删除联系人', isPrimary: true } },
          businessInfo: { create: { requirements: '矿山巡检' } },
        },
      })

      const res = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${sales1.token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const deleted = await prisma.customer.findUnique({ where: { id: customer.id } })
      expect(deleted).toBeNull()
    })
  })

  describe('POST /api/customers/import', () => {
    it('should import customers from Excel buffer', async () => {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet([
        { '客户名称': '导入客户1', '行业': 'AGRICULTURE', '地区': '武汉' },
        { '客户名称': '导入客户2', '行业': 'LOGISTICS', '地区': '南京' },
      ])
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      const base64 = Buffer.from(buffer).toString('base64')

      const res = await request(app)
        .post('/api/customers/import')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ buffer: base64 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(2)
    })
  })
})
