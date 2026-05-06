import express from 'express'
import cors from 'cors'
import path from 'path'
import rateLimit from 'express-rate-limit'
import { seedUsers } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customers.js'
import leadRoutes from './routes/leads.js'
import activityRoutes from './routes/activities.js'
import opportunityRoutes from './routes/opportunities.js'
import targetRoutes from './routes/targets.js'
import achievementRoutes from './routes/achievements.js'
import performanceRoutes from './routes/performance.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3006

// CORS: restrict origins in production
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',') || [])
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3006', 'http://127.0.0.1:5173'],
  credentials: true,
}))

// Global rate limit: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
  skip: (req) => {
    if (process.env.NODE_ENV === 'production') return false
    const ip = req.ip
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
  },
})
app.use(globalLimiter)

// Strict rate limit for login: 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请15分钟后再试' },
})
app.use('/api/auth/login', loginLimiter)

app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/opportunities', opportunityRoutes)
app.use('/api/targets', targetRoutes)
app.use('/api/achievements', achievementRoutes)
app.use('/api/performance', performanceRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Serve static frontend in production
const distPath = path.resolve(process.cwd(), 'dist')
app.use(express.static(distPath))
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API 不存在' })
    return
  }
  res.sendFile(path.join(distPath, 'index.html'))
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: '服务器内部错误' })
})

async function start() {
  await seedUsers()

  // Scheduled task: check overdue follow-ups every 30 minutes
  setInterval(async () => {
    try {
      const { prisma } = await import('./db.js')
      const now = new Date()
      const overdueActivities = await prisma.activity.findMany({
        where: {
          nextFollowUpAt: { lt: now },
          result: 'PENDING',
        },
        include: {
          createdBy: { select: { id: true } },
          customer: { select: { name: true } },
        },
      })

      for (const activity of overdueActivities) {
        // Check if already notified (avoid duplicates)
        const existing = await prisma.notification.findFirst({
          where: {
            userId: activity.createdById,
            type: 'OVERDUE_REMINDER',
            relatedId: activity.id,
            relatedType: 'ACTIVITY',
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: activity.createdById,
              type: 'OVERDUE_REMINDER',
              title: `逾期跟进提醒: ${activity.title}`,
              content: `活动「${activity.title}」${activity.customer ? `（客户：${activity.customer.name}）` : ''}的跟进已逾期，请及时处理。`,
              relatedId: activity.id,
              relatedType: 'ACTIVITY',
            },
          })
        }
      }
    } catch (err) {
      console.error('逾期提醒任务失败:', err)
    }
  }, 30 * 60 * 1000)

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

start()

export default app
