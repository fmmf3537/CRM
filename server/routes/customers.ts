import { Router } from 'express'
import type { _Request, Response } from 'express'
import { prisma } from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth'
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js'
import { streamCsv } from '../utils/csvStream.js'
import * as XLSX from 'xlsx'

const router = Router()

// All customer routes require auth
router.use(authMiddleware)

// Helper: check ownership
function canModify(req: AuthRequest, ownerId: number): boolean {
  const user = req.user!
  return user.id === ownerId || ['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(user.role)
}

// GET /api/customers - List with pagination, search, filters
router.get('/', cacheMiddleware(30000), async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    pageSize = '10',
    keyword = '',
    industry,
    region,
    grade,
    status,
    ownerId,
  } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page, 10))
  const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10)))
  const skip = (pageNum - 1) * sizeNum

  const where: any = {}

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { alias: { contains: keyword } },
      { address: { contains: keyword } },
      { contacts: { some: { name: { contains: keyword } } } },
    ]
  }

  if (industry) where.industry = industry
  if (region) where.region = { contains: region }
  if (grade) where.grade = grade
  if (status) where.status = status
  if (ownerId) where.ownerId = parseInt(ownerId, 10)

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: sizeNum,
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
        contacts: { where: { isPrimary: true }, take: 1 },
        _count: { select: { contacts: true } },
      },
    }),
    prisma.customer.count({ where }),
  ])

  res.json({
    data: customers,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
      totalPages: Math.ceil(total / sizeNum),
    },
  })
})

// GET /api/customers/:id - Detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的客户ID' })
    return
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      contacts: true,
      businessInfo: true,
    },
  })

  if (!customer) {
    res.status(404).json({ error: '客户不存在' })
    return
  }

  res.json(customer)
})

// POST /api/customers - Create
router.post('/', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/customers')
  const { name, alias, industry, scale, region, address, source, grade, status, contacts, businessInfo } = req.body

  if (!name || !industry || !region) {
    res.status(400).json({ error: '客户名称、行业和地区为必填项' })
    return
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name,
        alias,
        industry,
        scale: scale || 'MEDIUM',
        region,
        address,
        source,
        grade: grade || 'C',
        status: status || 'POTENTIAL',
        ownerId: req.user!.id,
        contacts: contacts?.length
          ? {
              create: contacts.map((c: any) => ({
                name: c.name,
                title: c.title,
                phone: c.phone,
                email: c.email,
                wechat: c.wechat,
                decisionRole: c.decisionRole || 'TECHNICAL_CONTACT',
                isPrimary: c.isPrimary || false,
              })),
            }
          : undefined,
        businessInfo: businessInfo
          ? {
              create: {
                requirements: businessInfo.requirements,
                interestedProducts: businessInfo.interestedProducts,
                budget: businessInfo.budget,
                purchaseTime: businessInfo.purchaseTime,
                competitors: businessInfo.competitors,
                specialRequirements: businessInfo.specialRequirements,
              },
            }
          : undefined,
      },
      include: {
        contacts: true,
        businessInfo: true,
        owner: { select: { id: true, name: true } },
      },
    })

    res.status(201).json(customer)
  } catch (err: any) {
    res.status(500).json({ error: '创建客户失败', message: err.message })
  }
})

// PUT /api/customers/:id - Update
router.put('/:id', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/customers')
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的客户ID' })
    return
  }

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: '客户不存在' })
    return
  }

  if (!canModify(req, existing.ownerId)) {
    res.status(403).json({ error: '无权修改此客户' })
    return
  }

  const { name, alias, industry, scale, region, address, source, grade, status, contacts, businessInfo } = req.body

  try {
    // Delete existing contacts and businessInfo if new ones provided
    if (contacts !== undefined) {
      await prisma.contact.deleteMany({ where: { customerId: id } })
    }
    if (businessInfo !== undefined) {
      await prisma.businessInfo.deleteMany({ where: { customerId: id } })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        alias,
        industry,
        scale,
        region,
        address,
        source,
        grade,
        status,
        lastFollowUpAt: status === 'FOLLOWING' ? new Date() : undefined,
        contacts: contacts?.length
          ? {
              create: contacts.map((c: any) => ({
                name: c.name,
                title: c.title,
                phone: c.phone,
                email: c.email,
                wechat: c.wechat,
                decisionRole: c.decisionRole || 'TECHNICAL_CONTACT',
                isPrimary: c.isPrimary || false,
              })),
            }
          : undefined,
        businessInfo: businessInfo
          ? {
              create: {
                requirements: businessInfo.requirements,
                interestedProducts: businessInfo.interestedProducts,
                budget: businessInfo.budget,
                purchaseTime: businessInfo.purchaseTime,
                competitors: businessInfo.competitors,
                specialRequirements: businessInfo.specialRequirements,
              },
            }
          : undefined,
      },
      include: {
        contacts: true,
        businessInfo: true,
        owner: { select: { id: true, name: true } },
      },
    })

    res.json(customer)
  } catch (err: any) {
    res.status(500).json({ error: '更新客户失败', message: err.message })
  }
})

// DELETE /api/customers/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/customers')
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的客户ID' })
    return
  }

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: '客户不存在' })
    return
  }

  if (!canModify(req, existing.ownerId)) {
    res.status(403).json({ error: '无权删除此客户' })
    return
  }

  await prisma.customer.delete({ where: { id } })
  res.json({ success: true })
})

// POST /api/customers/import - Excel import
router.post('/import', requireRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'SALES'), async (req: AuthRequest, res: Response) => {
  invalidateCache('/api/customers')
  try {
    if (!req.file && !req.body.buffer) {
      res.status(400).json({ error: '请上传Excel文件' })
      return
    }

    // Handle base64 buffer from frontend
    let buffer: Buffer
    if (req.body.buffer) {
      buffer = Buffer.from(req.body.buffer, 'base64')
    } else {
      buffer = req.file!.buffer
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)

    const created = []
    for (const row of rows) {
      const customer = await prisma.customer.create({
        data: {
          name: row['客户名称'] || row['name'] || '未命名客户',
          alias: row['客户简称'] || row['alias'] || null,
          industry: row['行业'] || row['industry'] || 'AGRICULTURE',
          scale: row['规模'] || row['scale'] || 'MEDIUM',
          region: row['地区'] || row['region'] || '未知',
          address: row['地址'] || row['address'] || null,
          source: row['来源'] || row['source'] || null,
          grade: row['等级'] || row['grade'] || 'C',
          status: row['状态'] || row['status'] || 'POTENTIAL',
          ownerId: req.user!.id,
        },
      })
      created.push(customer)
    }

    res.json({ success: true, count: created.length, data: created })
  } catch (err: any) {
    res.status(500).json({ error: '导入失败', message: err.message })
  }
})

// GET /api/customers/export - Excel export
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, industry, region, grade, status, ownerId } = req.query as Record<string, string>

    const where: any = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { alias: { contains: keyword } },
      ]
    }
    if (industry) where.industry = industry
    if (region) where.region = { contains: region }
    if (grade) where.grade = grade
    if (status) where.status = status
    if (ownerId) where.ownerId = parseInt(ownerId, 10)

    const customers = await prisma.customer.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        contacts: true,
        businessInfo: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const rows = customers.map((c) => ({
      name: c.name,
      alias: c.alias || '',
      industry: c.industry,
      scale: c.scale,
      region: c.region,
      address: c.address || '',
      source: c.source || '',
      grade: c.grade,
      status: c.status,
      owner: c.owner.name,
      contactsCount: c.contacts.length,
      createdAt: c.createdAt.toISOString(),
    }))

    streamCsv(res, 'customers.csv', [
      { key: 'name', label: '客户名称' },
      { key: 'alias', label: '客户简称' },
      { key: 'industry', label: '行业' },
      { key: 'scale', label: '规模' },
      { key: 'region', label: '地区' },
      { key: 'address', label: '地址' },
      { key: 'source', label: '来源' },
      { key: 'grade', label: '等级' },
      { key: 'status', label: '状态' },
      { key: 'owner', label: '负责人' },
      { key: 'contactsCount', label: '联系人数量' },
      { key: 'createdAt', label: '创建时间' },
    ], rows)
  } catch (err: any) {
    res.status(500).json({ error: '导出失败', message: err.message })
  }
})

export default router
