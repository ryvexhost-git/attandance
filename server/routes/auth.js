const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;
    if (role === 'admin') {
      user = await prisma.admin.findUnique({ where: { email } });
    } else {
      user = await prisma.employee.findUnique({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('Login error: JWT_SECRET is not configured');
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: { ...userWithoutPassword, role }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'P2021' || error.code === 'P2022') {
      return res.status(500).json({
        message: 'Database schema is not initialized. Run Prisma migrations and seed the admin user.',
      });
    }
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

module.exports = router;
