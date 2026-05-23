const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@attendance.com';
  const password = process.env.ADMIN_PASSWORD || 'password123456';

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
    }
  });

  console.log(`Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
