const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { auth, adminOnly } = require('../middleware/auth');
const { ensureDatabase, formatEmployeeCode, generateEmployeeCode, getEmployeeCodePassword } = require('../lib/ensureDatabase');

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
  const { name, email, phone, dailyWage, joiningDate, status, profilePhoto } = req.body;

  try {
    await ensureDatabase(prisma);

    const employeeCode = req.body.employeeCode
      ? formatEmployeeCode(req.body.employeeCode)
      : await generateEmployeeCode(prisma);
    const loginPassword = getEmployeeCodePassword(employeeCode);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(loginPassword, salt);
    const hourlyRate = dailyWage / 8;
    const parsedJoiningDate = new Date(joiningDate);

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        name,
        email,
        password: hashedPassword,
        loginPassword,
        phone,
        dailyWage,
        hourlyRate,
        joiningDate: parsedJoiningDate,
        status,
        profilePhoto
      }
    });

    const { password: _, ...employeeWithoutPassword } = employee;
    res.status(201).json(employeeWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('employee_code') ? 'TCB-ID' : 'Email';
      return res.status(400).json({ message: `${field} already exists` });
    }
    if (/^TCB-ID/.test(error.message || '')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee (Admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, email, phone, dailyWage, joiningDate, status, password, profilePhoto } = req.body;

  try {
    await ensureDatabase(prisma);

    const existingEmployee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    const parsedJoiningDate = new Date(joiningDate);
    const updateData = {
      name,
      email,
      phone,
      dailyWage,
      hourlyRate: dailyWage / 8,
      joiningDate: parsedJoiningDate,
      status,
      profilePhoto
    };

    if (req.body.employeeCode) {
      updateData.employeeCode = formatEmployeeCode(req.body.employeeCode);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
      updateData.loginPassword = password;
    } else if (updateData.employeeCode && updateData.employeeCode !== existingEmployee?.employeeCode) {
      const loginPassword = getEmployeeCodePassword(updateData.employeeCode);
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(loginPassword, salt);
      updateData.loginPassword = loginPassword;
    }

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: updateData
    });

    const { password: _, ...employeeWithoutPassword } = employee;
    res.json(employeeWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('employee_code') ? 'TCB-ID' : 'Email';
      return res.status(400).json({ message: `${field} already exists` });
    }
    if (/^TCB-ID/.test(error.message || '')) {
      return res.status(400).json({ message: error.message });
    }
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
