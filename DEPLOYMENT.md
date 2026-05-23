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

This project uses Prisma with PostgreSQL. After setting `DATABASE_URL`, initialize or sync the database schema:

```bash
npm run db:push
npm run seed
```

The seed creates/updates the default admin:

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
