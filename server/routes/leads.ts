import { Router } from 'express'
import type { Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js'
import * as XLSX from 'xlsx'

const router = Router()
router.use(authMiddleware)

function canModifyLead(req: AuthRequest, assigneeId: number | null): boolean {
  const user = req.user!
  if (assigneeId === null) return true
  return user.id === assigneeId || ['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(user.role)
}

async function generateLeadNo(): Promise<string> {
  const now = new Date()
  const prefix = `L${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const count = await prisma.lead.count({
    where: { leadNo: { startsWith: prefix } },
  })
  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

// GET /api/leads - List
router.get('/', cacheMiddleware(30000), async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    pageSize = '10',
    keyword = '',
    source,
    status,
    region,
    assignStatus,
    assigneeId,
  } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = {}
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { contactName: { contains: keyword } },
      { leadNo: { contains: keyword } },
    ]
  }
  if (source) where.source = source
  if (status) where.status = status
  if (region) where.region = { contains: region }
  if (assignStatus) where.assignStatus = assignStatus
  if (assigneeId) where.assigneeId = parseInt(assigneeId, 10)

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: { createdAt: 'desc' },
      include: { assignee: { select: { id: true, name: true } } },
    }),
    prisma.lead.count({ where }),
  ])

  res.json({
    data: leads,
    pagination: { page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) },
  })
})

// GET /api/leads/stats - Statistics
router.get('/stats', cacheMiddleware(60000), async (_req: AuthRequest, res: Response) => {
  const [bySource, byStatus, total, converted] = await Promise.all([
    prisma.lead.groupBy({ by: ['source'], _count: { source: true } }),
    prisma.lead.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'CONVERTED' } }),
  ])

  res.json({
    total,
    converted,
    conversionRate: total > 0 ? ((converted / total) * 100).toFixed(2) + '%' : '0%',
    bySource: bySource.map((s) => ({ source: s.source, count: s._count.source })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
  })
})

// GET /api/leads/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的线索ID' }); return }

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true } } },
  })
  if (!lead) { res.status(404).json({ error: '线索不存在' }); return }

  res.json(lead)
})

// POST /api/leads - Create
router.post('/', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads')
  const { name, contactName, contactPhone, contactEmail, contactTitle, source, priority, industry, region, budget, notes } = req.body
  if (!name || !contactName) {
    res.status(400).json({ error: '公司名称和联系人姓名为必填项' })
    return
  }

  try {
    const leadNo = await generateLeadNo()
    const lead = await prisma.lead.create({
      data: {
        leadNo,
        name,
        contactName,
        contactPhone,
        contactEmail,
        contactTitle,
        source: source || 'OTHER',
        priority: priority || 'MEDIUM',
        industry,
        region,
        budget,
        notes,
      },
      include: { assignee: { select: { id: true, name: true } } },
    })
    res.status(201).json(lead)
  } catch (err: any) {
    res.status(500).json({ error: '创建线索失败', message: err.message })
  }
})

// PUT /api/leads/:id - Update
router.put('/:id', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads')
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的线索ID' }); return }

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ error: '线索不存在' }); return }

  if (!canModifyLead(req, existing.assigneeId)) {
    res.status(403).json({ error: '无权修改此线索' })
    return
  }

  const { name, contactName, contactPhone, contactEmail, contactTitle, source, status, priority, industry, region, budget, notes } = req.body

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { name, contactName, contactPhone, contactEmail, contactTitle, source, status, priority, industry, region, budget, notes },
      include: { assignee: { select: { id: true, name: true } } },
    })
    res.json(lead)
  } catch (err: any) {
    res.status(500).json({ error: '更新线索失败', message: err.message })
  }
})

// POST /api/leads/:id/assign - Assign lead
router.post('/:id/assign', requireRole('ADMIN', 'MANAGER', 'EXECUTIVE'), async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads')
  const id = parseInt(req.params.id, 10)
  const { assigneeId } = req.body
  if (isNaN(id) || !assigneeId) { res.status(400).json({ error: '参数错误' }); return }

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) { res.status(404).json({ error: '线索不存在' }); return }

  // Check protect expiry
  if (lead.protectExpiry && new Date() < new Date(lead.protectExpiry)) {
    res.status(403).json({ error: '该线索处于保护期内，不可重新分配' })
    return
  }

  const now = new Date()
  const protectExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      assigneeId: parseInt(assigneeId, 10),
      assignStatus: 'ASSIGNED',
      assignedAt: now,
      protectExpiry,
      status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
    },
    include: { assignee: { select: { id: true, name: true } } },
  })

  res.json(updated)
})

// POST /api/leads/:id/claim - Claim unassigned lead
router.post('/:id/claim', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads')
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的线索ID' }); return }

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) { res.status(404).json({ error: '线索不存在' }); return }
  if (lead.assignStatus !== 'UNASSIGNED') {
    res.status(403).json({ error: '该线索已被分配，无法认领' })
    return
  }

  const now = new Date()
  const protectExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      assigneeId: req.user!.id,
      assignStatus: 'ASSIGNED',
      assignedAt: now,
      protectExpiry,
      status: 'CONTACTED',
    },
    include: { assignee: { select: { id: true, name: true } } },
  })

  res.json(updated)
})

// POST /api/leads/:id/convert - Convert to customer
router.post('/:id/convert', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads', '/api/customers')
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: '无效的线索ID' }); return }

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) { res.status(404).json({ error: '线索不存在' }); return }

  if (!canModifyLead(req, lead.assigneeId)) {
    res.status(403).json({ error: '无权转化此线索' })
    return
  }

  const { customerName, industry: bodyIndustry, region: bodyRegion } = req.body || {}

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create customer from lead
      const customer = await tx.customer.create({
        data: {
          name: customerName || lead.name,
          industry: bodyIndustry || lead.industry || 'AGRICULTURE',
          region: bodyRegion || lead.region || '未知',
          source: lead.source,
          grade: 'C',
          status: 'POTENTIAL',
          ownerId: lead.assigneeId || req.user!.id,
          contacts: {
            create: [{
              name: lead.contactName,
              title: lead.contactTitle,
              phone: lead.contactPhone,
              email: lead.contactEmail,
              isPrimary: true,
            }],
          },
          businessInfo: lead.budget || lead.notes ? {
            create: {
              budget: lead.budget,
              requirements: lead.notes,
            },
          } : undefined,
        },
      })

      // Update lead status
      await tx.lead.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedCustomerId: customer.id,
        },
      })

      return customer
    })

    res.json({ success: true, customerId: result.id })
  } catch (err: any) {
    res.status(500).json({ error: '转化失败', message: err.message })
  }
})

// POST /api/leads/:id/abandon - Abandon lead
router.post('/:id/abandon', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads')
  const id = parseInt(req.params.id, 10)
  const { reason } = req.body
  if (isNaN(id)) { res.status(400).json({ error: '无效的线索ID' }); return }

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) { res.status(404).json({ error: '线索不存在' }); return }

  if (!canModifyLead(req, lead.assigneeId)) {
    res.status(403).json({ error: '无权放弃此线索' })
    return
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      status: 'ABANDONED',
      invalidReason: reason,
    },
    include: { assignee: { select: { id: true, name: true } } },
  })

  res.json(updated)
})

// POST /api/leads/batch-import - Import
router.post('/batch-import', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/leads')
  try {
    const { buffer } = req.body
    if (!buffer) { res.status(400).json({ error: '请上传Excel文件' }); return }

    const buf = Buffer.from(buffer, 'base64')
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)

    const created = []
    for (const row of rows) {
      const leadNo = await generateLeadNo()
      const lead = await prisma.lead.create({
        data: {
          leadNo,
          name: row['公司名称'] || row['name'] || '未命名线索',
          contactName: row['联系人'] || row['contactName'] || '-',
          contactPhone: row['电话'] || row['contactPhone'] || null,
          contactEmail: row['邮箱'] || row['contactEmail'] || null,
          source: row['来源'] || row['source'] || 'OTHER',
          priority: row['优先级'] || row['priority'] || 'MEDIUM',
          industry: row['行业'] || row['industry'] || null,
          region: row['地区'] || row['region'] || null,
          budget: row['预算'] || row['budget'] || null,
          notes: row['备注'] || row['notes'] || null,
        },
      })
      created.push(lead)
    }

    res.json({ success: true, count: created.length, data: created })
  } catch (err: any) {
    res.status(500).json({ error: '导入失败', message: err.message })
  }
})

export default router
