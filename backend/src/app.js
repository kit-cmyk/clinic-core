import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
// In development accept any localhost origin (Vite picks a free port).
// In production restrict to FRONTEND_URL.
const corsOrigin = env.isDev()
  ? (origin, cb) => cb(null, !origin || /^http:\/\/localhost(:\d+)?$/.test(origin))
  : env.FRONTEND_URL;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import invitationsRoutes from './routes/invitations.js';
import masterRoutes from './routes/master.js';
import tenantRequestsRoutes from './routes/tenantRequests.js';
import platformRoutes from './routes/platform.js';
import metricsRoutes from './routes/metrics.js';
import provisioningRoutes from './routes/provisioning.js';
import plansRoutes from './routes/plans.js';
import patientsRoutes from './routes/patients.js';
import tenantsRoutes from './routes/tenants.js';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/invitations', invitationsRoutes);
app.use('/api/v1/master', masterRoutes);
app.use('/api/v1/tenant-requests', tenantRequestsRoutes);
app.use('/api/v1/platform', platformRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/provisioning', provisioningRoutes);
app.use('/api/v1/plans', plansRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/tenants', tenantsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.code || 'internal_error',
    message: env.isProd() ? 'An unexpected error occurred' : err.message,
  });
});

export default app;
