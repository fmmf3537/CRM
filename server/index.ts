import express from 'express'
import cors from 'cors'
import path from 'path'
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

app.use(cors())
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
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

start()

export default app
