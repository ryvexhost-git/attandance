const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { auth, adminOnly } = require('../middleware/auth');
const { ensureDatabase } = require('../lib/ensureDatabase');

const router = express.Router();
const prisma = new PrismaClient();

const employeePunchSelect = {
  id: true,
  employeeCode: true,
  password: true,
  name: true,
  status: true,
  profilePhoto: true,
  hourlyRate: true
};

const getOpenAttendanceSession = (employeeId) => prisma.attendance.findFirst({
  where: {
    employeeId,
    punchOutTime: null
  },
  orderBy: { punchInTime: 'desc' }
});

const normalizeEmployeeCode = (employeeCode = '') => employeeCode.trim().toUpperCase();

const getPeriodStarts = () => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return { todayStart, weekStart, monthStart };
};

const recordHours = (record) => record.workHours || 0;
const recordWage = (record) => record.dailyWageEarned || 0;

const findVerifiedPunchEmployee = async (rawEmployeeCode, rawPassword) => {
  const employeeCode = normalizeEmployeeCode(rawEmployeeCode);
  const password = String(rawPassword || '');

  if (!employeeCode || !password) {
    return null;
  }

  const employee = await prisma.employee.findUnique({
    where: { employeeCode },
    select: employeePunchSelect
  });

  if (!employee || !await bcrypt.compare(password, employee.password)) {
    return null;
  }

  return employee;
};

// Public punch lookup by employee ID and password. Returns only safe kiosk data.
router.post('/punch-lookup', async (req, res) => {
  const { employeeCode: rawEmployeeCode, password } = req.body;

  try {
    await ensureDatabase(prisma);

    const employee = await findVerifiedPunchEmployee(rawEmployeeCode, password);

    if (!employee || employee.status !== 'active') {
      return res.status(401).json({ message: 'Invalid employee ID or password' });
    }

    if (!employee.profilePhoto) {
      return res.status(400).json({ message: 'Profile photo is required before punching. Please contact admin.' });
    }

    const activeSession = await getOpenAttendanceSession(employee.id);

    res.json({
      employee: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        profilePhoto: employee.profilePhoto
      },
      action: activeSession ? 'punch-out' : 'punch-in',
      activeSession: activeSession
        ? {
          id: activeSession.id,
          punchInTime: activeSession.punchInTime
        }
        : null
    });
  } catch (error) {
    console.error('Punch lookup error:', error);
    res.status(500).json({ message: 'Unable to load employee punch details' });
  }
});

// Public kiosk punch submit by employee ID after client-side photo verification.
router.post('/punch-kiosk', async (req, res) => {
  const { employeeCode: rawEmployeeCode, password, photo, verificationScore } = req.body;

  try {
    await ensureDatabase(prisma);

    const employee = await findVerifiedPunchEmployee(rawEmployeeCode, password);

    if (!employee || employee.status !== 'active') {
      return res.status(401).json({ message: 'Invalid employee ID or password' });
    }

    if (!employee.profilePhoto) {
      return res.status(400).json({ message: 'Profile photo is required before punching. Please contact admin.' });
    }

    if (!photo) {
      return res.status(400).json({ message: 'Selfie photo is required' });
    }

    if (typeof verificationScore !== 'number' || verificationScore < 50) {
      return res.status(400).json({ message: 'Selfie verification must be at least 50% before submitting.' });
    }

    const activeSession = await getOpenAttendanceSession(employee.id);

    if (!activeSession) {
      const record = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          punchInTime: new Date(),
          punchInPhoto: photo
        }
      });

      return res.status(201).json({
        action: 'punch-in',
        employee: {
          employeeCode: employee.employeeCode,
          name: employee.name
        },
        record
      });
    }

    const punchOutTime = new Date();
    const workHours = (punchOutTime - activeSession.punchInTime) / (1000 * 60 * 60);
    const dailyWageEarned = workHours * employee.hourlyRate;

    const record = await prisma.attendance.update({
      where: { id: activeSession.id },
      data: {
        punchOutTime,
        punchOutPhoto: photo,
        workHours,
        dailyWageEarned
      }
    });

    return res.json({
      action: 'punch-out',
      employee: {
        employeeCode: employee.employeeCode,
        name: employee.name
      },
      record
    });
  } catch (error) {
    console.error('Kiosk punch error:', error);
    res.status(500).json({ message: 'Unable to submit attendance punch' });
  }
});

// Admin payroll, attendance, and kiosk health summary
router.get('/admin-summary', auth, adminOnly, async (req, res) => {
  try {
    await ensureDatabase(prisma);

    const { todayStart, weekStart, monthStart } = getPeriodStarts();

    const [employees, records] = await Promise.all([
      prisma.employee.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          profilePhoto: true,
          dailyWage: true,
          hourlyRate: true
        }
      }),
      prisma.attendance.findMany({
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              name: true,
              email: true,
              status: true,
              profilePhoto: true,
              dailyWage: true,
              hourlyRate: true
            }
          }
        },
        orderBy: { punchInTime: 'desc' },
        take: 500
      })
    ]);

    const activeEmployees = employees.filter((employee) => employee.status === 'active');
    const todayRecords = records.filter((record) => record.punchInTime >= todayStart);
    const weekRecords = records.filter((record) => record.punchInTime >= weekStart);
    const monthRecords = records.filter((record) => record.punchInTime >= monthStart);
    const activeSessions = records.filter((record) => !record.punchOutTime);
    const todayEmployeeIds = new Set(todayRecords.map((record) => record.employeeId));
    const absentToday = activeEmployees.filter((employee) => !todayEmployeeIds.has(employee.id));
    const missingPhotos = activeEmployees.filter((employee) => !employee.profilePhoto);

    const employeePayroll = employees.map((employee) => {
      const employeeRecords = records.filter((record) => record.employeeId === employee.id);
      const employeeTodayRecords = employeeRecords.filter((record) => record.punchInTime >= todayStart);
      const employeeWeekRecords = employeeRecords.filter((record) => record.punchInTime >= weekStart);
      const employeeMonthRecords = employeeRecords.filter((record) => record.punchInTime >= monthStart);
      const activeSession = employeeRecords.find((record) => !record.punchOutTime);

      return {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        status: employee.status,
        dailyWage: employee.dailyWage,
        hourlyRate: employee.hourlyRate,
        todayHours: employeeTodayRecords.reduce((sum, record) => sum + recordHours(record), 0),
        weekHours: employeeWeekRecords.reduce((sum, record) => sum + recordHours(record), 0),
        monthHours: employeeMonthRecords.reduce((sum, record) => sum + recordHours(record), 0),
        todayPayroll: employeeTodayRecords.reduce((sum, record) => sum + recordWage(record), 0),
        weekPayroll: employeeWeekRecords.reduce((sum, record) => sum + recordWage(record), 0),
        monthPayroll: employeeMonthRecords.reduce((sum, record) => sum + recordWage(record), 0),
        activeSession: activeSession
          ? {
            id: activeSession.id,
            punchInTime: activeSession.punchInTime
          }
          : null,
        lastPunchInTime: employeeRecords[0]?.punchInTime || null
      };
    });

    res.json({
      stats: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        activeSessions: activeSessions.length,
        absentToday: absentToday.length,
        missingPhotos: missingPhotos.length,
        todayHours: todayRecords.reduce((sum, record) => sum + recordHours(record), 0),
        weekHours: weekRecords.reduce((sum, record) => sum + recordHours(record), 0),
        monthHours: monthRecords.reduce((sum, record) => sum + recordHours(record), 0),
        todayPayroll: todayRecords.reduce((sum, record) => sum + recordWage(record), 0),
        weekPayroll: weekRecords.reduce((sum, record) => sum + recordWage(record), 0),
        monthPayroll: monthRecords.reduce((sum, record) => sum + recordWage(record), 0)
      },
      employeePayroll,
      activeSessions,
      absentToday,
      missingPhotos,
      recentAttendance: records.slice(0, 75)
    });
  } catch (error) {
    console.error('Admin attendance summary error:', error);
    res.status(500).json({ message: 'Unable to load admin attendance summary' });
  }
});

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
