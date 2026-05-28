const { execFileSync } = require('child_process');
const path = require('path');

const shouldDeployDatabase = process.env.RUN_DB_DEPLOY === '1';

if (!shouldDeployDatabase) {
  console.log('Skipping database deploy during build. Set RUN_DB_DEPLOY=1 to run migrations manually.');
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to deploy the database schema.');
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
  console.warn('Skipping database deploy because DATABASE_URL is not a PostgreSQL connection string.');
  console.warn('Set DATABASE_URL to a value starting with postgresql:// or postgres://.');
  process.exit(0);
}

const serverDir = path.resolve(__dirname, '..');

execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema=prisma/schema.prisma'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

execFileSync('node', ['prisma/seed.js'], {
  cwd: serverDir,
  stdio: 'inherit',
});
