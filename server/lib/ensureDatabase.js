const bcrypt = require('bcryptjs');

let initializationPromise;

async function ensureDatabase(prisma) {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase(prisma).catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

async function initializeDatabase(prisma) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://.');
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Admin" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "permissions" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Employee" (
      "id" TEXT NOT NULL,
      "employee_code" TEXT,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT,
      "daily_wage" DOUBLE PRECISION NOT NULL,
      "hourly_rate" DOUBLE PRECISION NOT NULL,
      "joining_date" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "profile_photo" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Attendance" (
      "id" TEXT NOT NULL,
      "employee_id" TEXT NOT NULL,
      "punch_in_time" TIMESTAMP(3) NOT NULL,
      "punch_out_time" TIMESTAMP(3),
      "punch_in_photo" TEXT,
      "punch_out_photo" TEXT,
      "work_hours" DOUBLE PRECISION,
      "daily_wage_earned" DOUBLE PRECISION,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");');
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email");');
  await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "employee_code" TEXT;');
  await backfillEmployeeCodes(prisma);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Employee_employee_code_key" ON "Employee"("employee_code");');
  await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "profile_photo" TEXT;');

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_employee_id_fkey'
      ) THEN
        ALTER TABLE "Attendance"
        ADD CONSTRAINT "Attendance_employee_id_fkey"
        FOREIGN KEY ("employee_id") REFERENCES "Employee"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  await ensureAdmin(prisma);
}

async function backfillEmployeeCodes(prisma) {
  const employees = await prisma.employee.findMany({
    where: { employeeCode: null },
    orderBy: [{ joiningDate: 'asc' }, { createdAt: 'asc' }],
  });

  for (const employee of employees) {
    const employeeCode = await generateEmployeeCode(prisma, employee.joiningDate);
    await prisma.employee.update({
      where: { id: employee.id },
      data: { employeeCode },
    });
  }
}

function formatJoiningDateCode(joiningDate) {
  const date = new Date(joiningDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `${day}${month}${year}`;
}

async function generateEmployeeCode(prisma, joiningDate) {
  const prefix = `TCB${formatJoiningDateCode(joiningDate)}`;
  const employeesForDate = await prisma.employee.findMany({
    where: {
      employeeCode: {
        startsWith: prefix,
      },
    },
    select: { employeeCode: true },
  });
  const usedNumbers = employeesForDate
    .map((employee) => Number(employee.employeeCode?.slice(prefix.length)))
    .filter(Number.isInteger);

  const nextNumber = Math.max(2, ...usedNumbers) + 1;

  return `${prefix}${String(nextNumber).padStart(2, '0')}`;
}

async function ensureAdmin(prisma) {
  const email = process.env.ADMIN_EMAIL || 'admin@attendance.com';
  const password = process.env.ADMIN_PASSWORD || 'password123456';
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

  await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

module.exports = { ensureDatabase, generateEmployeeCode };
