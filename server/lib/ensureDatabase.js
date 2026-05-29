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
      "login_password" TEXT,
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
  await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "login_password" TEXT;');
  await backfillEmployeeCodes(prisma);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Employee_employee_code_key" ON "Employee"("employee_code");');
  await backfillEmployeeLoginPasswords(prisma);
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
    const employeeCode = await generateEmployeeCode(prisma, employee.id);
    const loginPassword = getEmployeeCodePassword(employeeCode);
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        employeeCode,
        loginPassword,
        password: await bcrypt.hash(loginPassword, await bcrypt.genSalt(10)),
      },
    });
  }
}

async function backfillEmployeeLoginPasswords(prisma) {
  const employees = await prisma.employee.findMany({
    where: {
      loginPassword: null,
      employeeCode: {
        startsWith: 'TCB-',
      },
    },
    select: { id: true, employeeCode: true },
  });

  for (const employee of employees) {
    const employeeNumber = parseTcbEmployeeNumber(employee.employeeCode);

    if (!Number.isInteger(employeeNumber)) {
      continue;
    }

    const loginPassword = getEmployeeCodePassword(employee.employeeCode);
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        loginPassword,
        password: await bcrypt.hash(loginPassword, await bcrypt.genSalt(10)),
      },
    });
  }
}

async function generateEmployeeCode(prisma, ignoredEmployeeId) {
  const prefix = 'TCB-';
  const where = {
    employeeCode: {
      startsWith: prefix,
    },
  };

  if (ignoredEmployeeId) {
    where.id = { not: ignoredEmployeeId };
  }

  const employees = await prisma.employee.findMany({
    where,
    select: { employeeCode: true },
  });

  const usedNumbers = employees
    .map((employee) => parseTcbEmployeeNumber(employee.employeeCode))
    .filter(Number.isInteger);

  const nextNumber = Math.max(2025, ...usedNumbers) + 1;

  return formatEmployeeCode(nextNumber);
}

function parseTcbEmployeeNumber(employeeCode) {
  const match = /^TCB-(\d{4})$/.exec(employeeCode || '');
  return match ? Number(match[1]) : NaN;
}

function formatEmployeeCode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 4) {
    throw new Error('TCB-ID must include a 4 digit number.');
  }

  if (Number(digits) < 2026) {
    throw new Error('TCB-ID number must start from 2026.');
  }

  return `TCB-${digits}`;
}

function getEmployeeCodePassword(employeeCode) {
  const employeeNumber = parseTcbEmployeeNumber(employeeCode);

  if (!Number.isInteger(employeeNumber)) {
    throw new Error('TCB-ID must use the format TCB-2026.');
  }

  return String(employeeNumber);
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

module.exports = { ensureDatabase, formatEmployeeCode, generateEmployeeCode, getEmployeeCodePassword };
