import request from 'supertest'
import app from '../index.js'
import { prisma } from '../db.js'
import { generateToken } from '../middleware/auth.js'

function authToken(user: { id: number; username: string; name: string; role: string }) {
  return generateToken(user)
}

const admin = { id: 1, username: 'admin', name: '管理员', role: 'ADMIN' }
const sales1 = { id: 2, username: 'sales1', name: '销售张三', role: 'SALES' }

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should login seeded admin user with correct password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'password' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe('admin')
      expect(res.body.user.role).toBe('ADMIN')
    })

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' })

      expect(res.status).toBe(401)
      expect(res.body.error).toContain('密码')
    })

    it('should reject login with empty fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: '' })

      expect(res.status).toBe(400)
    })

    it('should reject weak password demo registration (less than 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'newuser', password: 'Ab1' })

      expect(res.status).toBe(401)
    })

    it('should reject weak password demo registration (no uppercase)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'newuser2', password: 'abcdefg1' })

      expect(res.status).toBe(401)
    })

    it('should reject weak password demo registration (no digit)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'newuser3', password: 'Abcdefgh' })

      expect(res.status).toBe(401)
    })

    it('should register new user with strong password via demo mode', async () => {
      const username = 'demouser_' + Date.now()
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: 'StrongPass1' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe(username)
      expect(res.body.user.role).toBe('SALES')

      // Clean up
      await prisma.user.delete({ where: { id: res.body.user.id } }).catch(() => {})
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user from token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.username).toBe('sales1')
      expect(res.body.name).toBe('销售张三')
      expect(res.body.role).toBe('SALES')
    })

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')

      expect(res.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/auth/users', () => {
    it('should list all users', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${authToken(sales1)}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.length).toBeGreaterThanOrEqual(4)
      expect(res.body.data[0]).toHaveProperty('id')
      expect(res.body.data[0]).toHaveProperty('username')
      expect(res.body.data[0]).toHaveProperty('name')
      expect(res.body.data[0]).toHaveProperty('role')
      // Password should NOT be exposed
      expect(res.body.data[0]).not.toHaveProperty('password')
    })
  })

  describe('PUT /api/auth/profile', () => {
    it('should update own profile name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({ name: '张三(已更名)' })

      expect(res.status).toBe(200)
      expect(res.body.user.name).toBe('张三(已更名)')
      expect(res.body.token).toBeDefined()

      // Verify persisted
      const user = await prisma.user.findUnique({ where: { id: sales1.id } })
      expect(user!.name).toBe('张三(已更名)')

      // Restore
      await prisma.user.update({ where: { id: sales1.id }, data: { name: '销售张三' } })
    })

    it('should reject missing name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken(sales1)}`)
        .send({})

      expect(res.status).toBe(400)
    })

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'hacker' })

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/auth/password', () => {
    beforeEach(async () => {
      // Create a test user so we don't affect the seeded sales1
      await prisma.user.create({
        data: {
          username: 'pwdtest',
          password: '$2b$10$vvcQInZM5vS29QSiAmZOzOYrhlUmP8VvyvdmIbfPSzycSgbG/1yjC', // 'password'
          name: '密码测试',
          role: 'SALES',
        },
      })
    })

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { username: 'pwdtest' } })
    })

    it('should change password with correct old password', async () => {
      const pwdTestUser = await prisma.user.findUnique({ where: { username: 'pwdtest' } })

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken({ id: pwdTestUser!.id, username: 'pwdtest', name: '密码测试', role: 'SALES' })}`)
        .send({ oldPassword: 'password', newPassword: 'NewPass123' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should reject wrong old password', async () => {
      const pwdTestUser = await prisma.user.findUnique({ where: { username: 'pwdtest' } })

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken({ id: pwdTestUser!.id, username: 'pwdtest', name: '密码测试', role: 'SALES' })}`)
        .send({ oldPassword: 'wrongpassword', newPassword: 'NewPass123' })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('旧密码')
    })

    it('should reject weak new password (less than 8 chars)', async () => {
      const pwdTestUser = await prisma.user.findUnique({ where: { username: 'pwdtest' } })

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken({ id: pwdTestUser!.id, username: 'pwdtest', name: '密码测试', role: 'SALES' })}`)
        .send({ oldPassword: 'password', newPassword: 'Abc1' })

      expect(res.status).toBe(400)
    })

    it('should reject weak new password (no complexity)', async () => {
      const pwdTestUser = await prisma.user.findUnique({ where: { username: 'pwdtest' } })

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken({ id: pwdTestUser!.id, username: 'pwdtest', name: '密码测试', role: 'SALES' })}`)
        .send({ oldPassword: 'password', newPassword: 'onlylowercase' })

      expect(res.status).toBe(400)
    })

    it('should reject missing fields', async () => {
      const pwdTestUser = await prisma.user.findUnique({ where: { username: 'pwdtest' } })

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken({ id: pwdTestUser!.id, username: 'pwdtest', name: '密码测试', role: 'SALES' })}`)
        .send({})

      expect(res.status).toBe(400)
    })
  })
})
