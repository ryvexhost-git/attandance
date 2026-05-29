const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { ensureDatabase } = require('../lib/ensureDatabase');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    await ensureDatabase(prisma);

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin && await bcrypt.compare(password, admin.password)) {
      return sendLoginResponse(res, admin, 'admin');
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (employee && await bcrypt.compare(password, employee.password)) {
      return sendLoginResponse(res, employee, 'employee');
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    const operationalError = getLoginOperationalError(error);
    if (operationalError) {
      return res.status(500).json(operationalError);
    }
    res.status(500).json({ message: 'Unable to sign in right now. Please try again later.' });
  }
});

const getLoginOperationalError = (error) => {
  if (error.code === 'P2021' || error.code === 'P2022') {
    return {
      message: 'Database schema is not initialized. Run Prisma migrations and seed the admin user.',
    };
  }

  if (error.code === 'P1001' || /Can't reach database server/i.test(error.message || '')) {
    return {
      message: 'Database is not reachable. Check DATABASE_URL or start the PostgreSQL server, then try again.',
    };
  }

  if (/DATABASE_URL is not configured/i.test(error.message || '')) {
    return {
      message: 'DATABASE_URL is not configured on the server.',
    };
  }

  if (/DATABASE_URL must start/i.test(error.message || '')) {
    return {
      message: 'DATABASE_URL must be a PostgreSQL connection string.',
    };
  }

  return null;
};

const sendLoginResponse = (res, user, role) => {
  if (!process.env.JWT_SECRET) {
    console.error('Login error: JWT_SECRET is not configured');
    return res.status(500).json({ message: 'JWT_SECRET is not configured' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, loginPassword: __, ...userWithoutPassword } = user;
  return res.json({
    token,
    user: { ...userWithoutPassword, role }
  });
};

module.exports = router;
