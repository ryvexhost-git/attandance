# Vercel Deployment

This repository is configured to deploy from the `apps` directory as a single Vercel project:

- React/Vite frontend builds to `dist/web`.
- Express/Prisma API runs through `api/index.js`.
- Vercel rewrites `/api/*` to the API and all other paths to the SPA.

## Required Environment Variables

Set these in Vercel Project Settings:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
JWT_SECRET=replace-with-a-long-random-secret
```

Optional:

```text
CORS_ORIGIN=https://your-vercel-domain.vercel.app
VITE_API_URL=/api
ADMIN_EMAIL=admin@attendance.com
ADMIN_PASSWORD=replace-before-production
```

`VITE_API_URL` can be omitted for the Vercel same-origin deployment because the app defaults to `/api`.

## Build Settings

Use these Vercel settings:

```text
Root Directory: apps
Build Command: npm run build
Output Directory: dist/web
Install Command: npm install
```

## Database Setup

This project uses Prisma with PostgreSQL. Vercel runs `prisma migrate deploy` during the build when `VERCEL=1`, then creates the first admin user if it does not exist.

To initialize or sync the database manually from your machine:

```bash
set RUN_DB_DEPLOY=1
npm run build --prefix server
```

The seed creates the default admin if no admin exists with that email:

```text
Email: admin@attendance.com
Password: password123456
```

For production, change the admin password after first login.

## Local Development

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies `/api` to `http://localhost:5000`.
