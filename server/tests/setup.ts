import { prisma } from '../db.js'

beforeEach(async () => {
  // Use TRUNCATE with CASCADE for PostgreSQL to handle foreign keys cleanly
  const tables = [
    'notifications',
    'payments',
    'stage_histories',
    'achievements',
    'targets',
    'opportunities',
    'activities',
    'leads',
    'contacts',
    'business_info',
    'customers',
  ]
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
  }
  await prisma.user.deleteMany({ where: { id: { gt: 4 } } })
})

afterAll(async () => {
  await prisma.$disconnect()
})
