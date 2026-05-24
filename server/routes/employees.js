const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { auth, adminOnly } = require('../middleware/auth');
const { ensureDatabase } = require('../lib/ensureDatabase');

const router = express.Router();
const prisma = new PrismaClient();

// Get all employees (Admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    await ensureDatabase(prisma);

    const employees = await prisma.employee.findMany({
      orderBy: { joiningDate: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create employee (Admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, email, password, phone, dailyWage, joiningDate, status, profilePhoto } = req.body;

  try {
    await ensureDatabase(prisma);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hourlyRate = dailyWage / 8;

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        dailyWage,
        hourlyRate,
        joiningDate: new Date(joiningDate),
        status,
        profilePhoto
      }
    });

    const { password: _, ...employeeWithoutPassword } = employee;
    res.status(201).json(employeeWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee (Admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, email, phone, dailyWage, joiningDate, status, password, profilePhoto } = req.body;

  try {
    await ensureDatabase(prisma);

    const updateData = {
      name,
      email,
      phone,
      dailyWage,
      hourlyRate: dailyWage / 8,
      joiningDate: new Date(joiningDate),
      status,
      profilePhoto
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: updateData
    });

    const { password: _, ...employeeWithoutPassword } = employee;
    res.json(employeeWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await ensureDatabase(prisma);

    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
