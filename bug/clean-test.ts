import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function clean() {
  const deleted = await prisma.customer.deleteMany({
    where: { name: '【隔离验证】此记录只在DEV数据库' }
  })
  console.log('Deleted test customers: ' + deleted.count)
  const count = await prisma.customer.count()
  console.log('DEV DB total customers: ' + count)
}
clean().finally(() => prisma.$disconnect())
