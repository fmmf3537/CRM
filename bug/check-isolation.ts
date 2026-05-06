import { PrismaClient } from '@prisma/client'

// 连接开发数据库
const prismaDev = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5434/crm_dev?schema=public' }
  }
})

// 连接生产数据库（通过 Docker exec 无法直接用 Prisma，用 psql 代替）
async function main() {
  const devCustomers = await prismaDev.customer.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' }
  })
  console.log('=== DEV DB (5434/crm_dev) customers ===')
  devCustomers.forEach(c => console.log('  ' + c.id + ': ' + c.name))

  const devUsers = await prismaDev.user.count()
  const devOpps = await prismaDev.opportunity.count()
  console.log(`DEV totals: users=${devUsers}, customers=${devCustomers.length}, opps=${devOpps}`)

  await prismaDev.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
