import { PrismaClient } from '@prisma/client'

const prismaDev = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5434/crm_dev?schema=public' }
  }
})

async function main() {
  // 在开发数据库创建一个唯一的测试客户
  const testCustomer = await prismaDev.customer.create({
    data: {
      name: '【隔离验证】此记录只在DEV数据库',
      industry: 'SECURITY',
      scale: 'MEDIUM',
      region: '测试区',
      grade: 'C',
      status: 'POTENTIAL',
      ownerId: 2
    }
  })
  console.log('DEV DB: Created test customer ID=' + testCustomer.id)

  const devCount = await prismaDev.customer.count()
  console.log('DEV DB total customers: ' + devCount)

  await prismaDev.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
