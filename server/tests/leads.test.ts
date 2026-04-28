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
const manager = { id: 4, username: 'manager', name: '主管', role: 'MANAGER' }

describe('Lead API', () => {
  beforeEach(async () => {
    await prisma.lead.deleteMany()
  })

  describe('POST /api/leads', () => {
    it('should create lead with auto-generated leadNo', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({
          name: '测试线索公司',
          contactName: '张三',
          contactPhone: '13800138000',
          source: 'WEBSITE',
          region: '北京',
        })

      expect(res.status).toBe(201)
      expect(res.body.leadNo).toMatch(/^L\d{8}\d{4}$/)
      expect(res.body.name).toBe('测试线索公司')
      expect(res.body.status).toBe('NEW')
      expect(res.body.assignStatus).toBe('UNASSIGNED')
    })

    it('should return 400 when name or contactName is missing', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '仅公司名' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/leads', () => {
    beforeEach(async () => {
      await prisma.lead.createMany({
        data: [
          { leadNo: 'L202601010001', name: '无人机科技公司', contactName: '李四', source: 'WEBSITE', region: '北京', status: 'NEW', assignStatus: 'UNASSIGNED' },
          { leadNo: 'L202601010002', name: '蓝天物流', contactName: '王五', source: 'PHONE', region: '上海', status: 'CONTACTED', assignStatus: 'ASSIGNED', assigneeId: sales1.id },
          { leadNo: 'L202601010003', name: '绿野生态', contactName: '赵六', source: 'EXHIBITION', region: '深圳', status: 'QUALIFIED', assignStatus: 'ASSIGNED', assigneeId: sales2.id },
        ],
      })
    })

    it('should filter by source', async () => {
      const res = await request(app)
        .get('/api/leads?source=WEBSITE')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].source).toBe('WEBSITE')
    })

    it('should filter unassigned leads', async () => {
      const res = await request(app)
        .get('/api/leads?assignStatus=UNASSIGNED')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].assignStatus).toBe('UNASSIGNED')
    })

    it('should search by keyword', async () => {
      const res = await request(app)
        .get('/api/leads?keyword=无人机')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toContain('无人机')
    })
  })

  describe('POST /api/leads/:id/assign', () => {
    it('should assign lead and set protect expiry', async () => {
      const lead = await prisma.lead.create({
        data: { leadNo: 'L202601010004', name: '待分配公司', contactName: '钱七', status: 'NEW', assignStatus: 'UNASSIGNED' },
      })

      const res = await request(app)
        .post(`/api/leads/${lead.id}/assign`)
        .set('Authorization', `Bearer ${authToken(manager)}`)
        .send({ assigneeId: sales1.id })

      expect(res.status).toBe(200)
      expect(res.body.assignStatus).toBe('ASSIGNED')
      expect(res.body.assigneeId).toBe(sales1.id)
      expect(res.body.protectExpiry).toBeDefined()
      expect(new Date(res.body.protectExpiry).getTime()).toBeGreaterThan(Date.now())
    })

    it('should not reassign during protect period', async () => {
      const lead = await prisma.lead.create({
        data: {
          leadNo: 'L202601010005', name: '保护期公司', contactName: '孙八',
          status: 'CONTACTED', assignStatus: 'ASSIGNED', assigneeId: sales1.id,
          protectExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      const res = await request(app)
        .post(`/api/leads/${lead.id}/assign`)
        .set('Authorization', `Bearer ${authToken(manager)}`)
        .send({ assigneeId: sales2.id })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('保护期')
    })
  })

  describe('POST /api/leads/:id/claim', () => {
    it('should allow sales to claim unassigned lead', async () => {
      const lead = await prisma.lead.create({
        data: { leadNo: 'L202601010006', name: '可认领公司', contactName: '周九', status: 'NEW', assignStatus: 'UNASSIGNED' },
      })

      const res = await request(app)
        .post(`/api/leads/${lead.id}/claim`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.assignStatus).toBe('ASSIGNED')
      expect(res.body.assigneeId).toBe(sales1.id)
      expect(res.body.status).toBe('CONTACTED')
    })

    it('should not allow claiming assigned lead', async () => {
      const lead = await prisma.lead.create({
        data: { leadNo: 'L202601010007', name: '已分配公司', contactName: '吴十', status: 'CONTACTED', assignStatus: 'ASSIGNED', assigneeId: sales2.id },
      })

      const res = await request(app)
        .post(`/api/leads/${lead.id}/claim`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/leads/:id/convert', () => {
    it('should convert lead to customer and bring info', async () => {
      const lead = await prisma.lead.create({
        data: {
          leadNo: 'L202601010008', name: '转化测试公司', contactName: '郑十一',
          contactPhone: '13900139000', contactTitle: '经理',
          source: 'WEBSITE', region: '北京', budget: '100万', notes: '需要巡检无人机',
          status: 'QUALIFIED', assignStatus: 'ASSIGNED', assigneeId: sales1.id,
        },
      })

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.customerId).toBeDefined()

      const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } })
      expect(updatedLead!.status).toBe('CONVERTED')
      expect(updatedLead!.convertedCustomerId).toBe(res.body.customerId)

      const customer = await prisma.customer.findUnique({ where: { id: res.body.customerId }, include: { contacts: true } })
      expect(customer!.name).toBe('转化测试公司')
      expect(customer!.contacts).toHaveLength(1)
      expect(customer!.contacts[0].name).toBe('郑十一')
      expect(customer!.contacts[0].phone).toBe('13900139000')
    })
  })

  describe('POST /api/leads/:id/abandon', () => {
    it('should abandon lead with reason', async () => {
      const lead = await prisma.lead.create({
        data: { leadNo: 'L202601010009', name: '放弃公司', contactName: '王十二', status: 'NEW', assignStatus: 'UNASSIGNED' },
      })

      const res = await request(app)
        .post(`/api/leads/${lead.id}/abandon`)
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ reason: '客户无预算' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ABANDONED')
      expect(res.body.invalidReason).toBe('客户无预算')
    })
  })

  describe('GET /api/leads/stats', () => {
    beforeEach(async () => {
      await prisma.lead.createMany({
        data: [
          { leadNo: 'L202601010010', name: 'A', contactName: 'A', source: 'WEBSITE', status: 'CONVERTED', assignStatus: 'UNASSIGNED' },
          { leadNo: 'L202601010011', name: 'B', contactName: 'B', source: 'WEBSITE', status: 'NEW', assignStatus: 'UNASSIGNED' },
          { leadNo: 'L202601010012', name: 'C', contactName: 'C', source: 'PHONE', status: 'ABANDONED', assignStatus: 'UNASSIGNED' },
        ],
      })
    })

    it('should return correct stats', async () => {
      const res = await request(app)
        .get('/api/leads/stats')
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(200)
      expect(res.body.total).toBe(3)
      expect(res.body.converted).toBe(1)
      expect(res.body.conversionRate).toBe('33.33%')
      expect(res.body.bySource).toHaveLength(2)
      expect(res.body.byStatus).toHaveLength(3)
    })
  })

  describe('POST /api/leads/batch-import', () => {
    it('should import leads from Excel buffer', async () => {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet([
        { '公司名称': '导入公司1', '联系人': '张一', '电话': '13800138001', '来源': 'WEBSITE' },
        { '公司名称': '导入公司2', '联系人': '李二', '电话': '13800138002', '来源': 'PHONE' },
      ])
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      const base64 = Buffer.from(buffer).toString('base64')

      const res = await request(app)
        .post('/api/leads/batch-import')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ buffer: base64 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(2)
    })
  })
})
