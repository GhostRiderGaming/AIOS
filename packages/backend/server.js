/**
 * @fileoverview AIOS Backend — Express server entry point.
 */

import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { initDb, closeDb } from './config/database.js';
import { runMigrations } from './database/migrations.js';
import { seedDemoData } from './database/seeds.js';
import { errorHandler } from './middleware/errorHandler.js';
import { API_PREFIX } from '@aios/shared/constants';

// Routes
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { systemRouter, securityRouter } from './routes/system.routes.js';

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(cors({
  origin: config.isProd
    ? (process.env.ALLOWED_ORIGINS || 'https://aios-platform.onrender.com').split(',')
    : true,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.text({ limit: '5mb' }));
app.use(cookieParser());

// ─── Rate limiting is applied per-route AFTER auth — see middleware/rateLimit.js

// ─── API Routes ─────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/system`, systemRouter);
app.use(`${API_PREFIX}/security`, securityRouter);
app.use(`${API_PREFIX}/upload`, uploadRoutes);

// ─── Production Static Serving ──────────────────────────────
if (config.isProd) {
  const { dirname, join } = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const frontendDist = join(__dirname, '../frontend/dist');

  app.use(express.static(frontendDist));

  // SPA fallback — serve index.html for all non-API routes
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith(API_PREFIX)) return next();
    res.sendFile(join(frontendDist, 'index.html'));
  });
}

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', status: 404 },
  });
});

// ─── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
async function start() {
  // Initialize database (async for sql.js)
  await initDb();
  runMigrations();
  console.log('[DB] Migrations complete');

  // Seed demo data (always — it's idempotent)
  try {
    seedDemoData();
    console.log('[DB] Demo data seeded');
  } catch (err) {
    console.log('[DB] Demo data already present');
  }

  app.listen(config.port, () => {
    console.log(`\n🚀 AIOS Backend running on http://localhost:${config.port}`);
    console.log(`📡 API: http://localhost:${config.port}${API_PREFIX}`);
    console.log(`${config.demo.enabled ? '🎭 Demo Mode: ENABLED' : '🧠 AI Mode: LIVE'}`);
    console.log('');
  });
}

// ─── Graceful Shutdown ──────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

start();

export default app;
