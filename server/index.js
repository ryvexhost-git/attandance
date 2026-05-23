const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Attendance System API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const adminCount = await prisma.admin.count();
    res.json({
      ok: true,
      database: true,
      adminCount,
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: false,
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      message: error.message,
      code: error.code,
    });
  }
});

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
