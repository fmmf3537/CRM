import { prisma } from '../db.js'

beforeEach(async () => {
  // Clean up test data (preserve seeded users id <= 4)
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.target.deleteMany()
  await prisma.stageHistory.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.businessInfo.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany({ where: { id: { gt: 4 } } })
})

afterAll(async () => {
  await prisma.$disconnect()
})
