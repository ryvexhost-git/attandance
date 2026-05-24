const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, adminOnly } = require('../middleware/auth');
const { ensureDatabase } = require('../lib/ensureDatabase');

const router = express.Router();
const prisma = new PrismaClient();

// Get all attendance records for verification (Admin only)
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    await ensureDatabase(prisma);

    const records = await prisma.attendance.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            email: true,
            profilePhoto: true
          }
        }
      },
      orderBy: { punchInTime: 'desc' },
      take: 50
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get personal attendance records
router.get('/my', auth, async (req, res) => {
  try {
    await ensureDatabase(prisma);

    const records = await prisma.attendance.findMany({
      where: { employeeId: req.user.id },
      orderBy: { punchInTime: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Punch In
router.post('/punch-in', auth, async (req, res) => {
  const { photo } = req.body;
  try {
    await ensureDatabase(prisma);

    const employee = await prisma.employee.findUnique({ where: { id: req.user.id } });

    if (!employee?.profilePhoto) {
      return res.status(400).json({ message: 'Profile photo is required before punching in. Please contact admin.' });
    }

    if (!photo) {
      return res.status(400).json({ message: 'Selfie photo is required for punch in' });
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId: req.user.id,
        punchInTime: new Date(),
        punchInPhoto: photo
      }
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Punch Out
router.post('/punch-out/:id', auth, async (req, res) => {
  const { photo } = req.body;
  try {
    await ensureDatabase(prisma);

    if (!photo) {
      return res.status(400).json({ message: 'Selfie photo is required for punch out' });
    }

    const punchInRecord = await prisma.attendance.findUnique({
      where: { id: req.params.id },
      include: { employee: true }
    });

    if (!punchInRecord) {
      return res.status(404).json({ message: 'Punch-in record not found' });
    }

    const punchOutTime = new Date();
    const workHours = (punchOutTime - punchInRecord.punchInTime) / (1000 * 60 * 60);
    const dailyWageEarned = workHours * punchInRecord.employee.hourlyRate;

    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        punchOutTime,
        punchOutPhoto: photo,
        workHours,
        dailyWageEarned
      }
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
