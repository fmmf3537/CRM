import request from 'supertest'
import app from '../index.js'
import { prisma } from '../db.js'
import { generateToken } from '../middleware/auth.js'

function authToken(user: { id: number; username: string; name: string; role: string }) {
  return generateToken(user)
}

const admin = { id: 1, username: 'admin', name: '管理员', role: 'ADMIN' }
const sales1 = { id: 2, username: 'sales1', name: '销售张三', role: 'SALES' }

describe('Admin API', () => {
  describe('Authentication & Authorization', () => {
    it('should reject non-admin accessing admin users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(403)
    })

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/admin/users')
      expect(res.status).toBe(401)
    })
  })

  describe('User Management', () => {
    it('should list all users for admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('should create new user', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({
          username: 'testuser99',
          name: '测试用户',
          password: 'password',
          role: 'SALES',
        })

      expect(res.status).toBe(201)
      expect(res.body.username).toBe('testuser99')
      expect(res.body.name).toBe('测试用户')
      expect(res.body.role).toBe('SALES')
    })

    it('should reject duplicate username', async () => {
      await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ username: 'dupuser', name: '用户A', password: 'password', role: 'SALES' })

      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ username: 'dupuser', name: '用户B', password: 'password', role: 'SALES' })

      expect(res.status).toBe(409)
    })

    it('should update user', async () => {
      const user = await prisma.user.create({
        data: { username: 'updateme', name: '更新前', password: 'hash', role: 'SALES' },
      })

      const res = await request(app)
        .put(`/api/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ name: '更新后', role: 'MANAGER' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('更新后')
      expect(res.body.role).toBe('MANAGER')
    })

    it('should delete user', async () => {
      const user = await prisma.user.create({
        data: { username: 'deleteme', name: '删除我', password: 'hash', role: 'SALES' },
      })

      const res = await request(app)
        .delete(`/api/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const deleted = await prisma.user.findUnique({ where: { id: user.id } })
      expect(deleted).toBeNull()
    })

    it('should reject self-deletion', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${admin.id}`)
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(403)
    })

    it('should reset password', async () => {
      const user = await prisma.user.create({
        data: { username: 'resetme', name: '重置密码', password: await require('bcryptjs').hash('oldpass', 10), role: 'SALES' },
      })

      const res = await request(app)
        .post(`/api/admin/users/${user.id}/reset-password`)
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ password: 'newpass123' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('Config Management', () => {
    it('should return default config', async () => {
      const res = await request(app)
        .get('/api/admin/config/industries')
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(200)
      expect(res.body.key).toBe('industries')
      expect(Array.isArray(res.body.value)).toBe(true)
      expect(res.body.value.length).toBeGreaterThan(0)
    })

    it('should update config', async () => {
      const newValue = [
        { value: 'TEST_A', label: '测试A' },
        { value: 'TEST_B', label: '测试B' },
      ]

      const res = await request(app)
        .put('/api/admin/config/industries')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ value: newValue })

      expect(res.status).toBe(200)
      expect(res.body.value).toHaveLength(2)
      expect(res.body.value[0].label).toBe('测试A')
    })

    it('should reject invalid config key', async () => {
      const res = await request(app)
        .get('/api/admin/config/invalid_key')
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(400)
    })

    it('should reject non-array value', async () => {
      const res = await request(app)
        .put('/api/admin/config/industries')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ value: 'not-an-array' })

      expect(res.status).toBe(400)
    })

    it('should persist config across reads', async () => {
      const customValue = [{ value: 'PERSIST', label: '持久化测试' }]

      await request(app)
        .put('/api/admin/config/regions')
        .set('Authorization', `Bearer ${authToken(admin)}`)
        .send({ value: customValue })

      const res = await request(app)
        .get('/api/admin/config/regions')
        .set('Authorization', `Bearer ${authToken(admin)}`)

      expect(res.status).toBe(200)
      expect(res.body.value).toHaveLength(1)
      expect(res.body.value[0].value).toBe('PERSIST')
    })
  })
})
