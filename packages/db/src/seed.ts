import { PrismaClient } from '../generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const password = process.env.SEED_PASSWORD ?? 'password123'

const users = [
  { email: 'admin@orbyatravel.com',    name: 'Admin User',    role: 'ADMIN'    as const },
  { email: 'employee@orbyatravel.com', name: 'Employee User', role: 'EMPLOYEE' as const },
  { email: 'provider@orbyatravel.com', name: 'Provider User', role: 'PROVIDER' as const },
  { email: 'customer@orbyatravel.com', name: 'Customer User', role: 'CUSTOMER' as const },
]

async function main() {
  const hash = await bcrypt.hash(password, 12)

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password_hash: hash, role: u.role },
      create: { email: u.email, name: u.name, password_hash: hash, role: u.role },
    })
    console.log(`${u.role.padEnd(8)} ready: ${user.email}`)
  }

  console.log(`\nAll users → password: ${password}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
