const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get personal attendance records
router.get('/my', auth, async (req, res) => {
  try {
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
