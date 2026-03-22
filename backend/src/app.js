import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import * as Sentry from '@sentry/node';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { auditMiddleware } from './lib/auditLog.js';
import { prisma } from './models/prisma.js';

const app = express();

// ── Request logging ───────────────────────────────────────────────────────
// Redact sensitive fields so PHI never appears in logs (HIPAA § 164.312(b)).
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.phone',
      'req.body.dob',
      'req.body.allergies',
      'req.body.bloodType',
      'req.body.refresh_token',
    ],
    censor: '[redacted]',
  },
}));

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

// ── Audit logging helper ──────────────────────────────────────────────────
// Attaches req.audit() to every request (populated with actor after auth).
app.use(auditMiddleware);

// ── Health check ──────────────────────────────────────────────────────────
// Checks DB connectivity so Render and uptime monitors get a real signal.
// Skip the DB ping in test environments (CI uses a placeholder DATABASE_URL).
app.get('/health', async (_req, res) => {
  if (env.isTest()) {
    return res.json({ status: 'ok', db: 'skipped', env: env.NODE_ENV });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up', env: env.NODE_ENV });
  } catch (err) {
    logger.error({ err }, '[health] DB check failed');
    res.status(503).json({ status: 'degraded', db: 'down', env: env.NODE_ENV });
  }
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
import organizationRoutes from './routes/organization.js';
import branchesRoutes from './routes/branches.js';
import resultsRoutes from './routes/results.js';
import reviewQueueRoutes from './routes/reviewQueue.js';
import appointmentsRoutes from './routes/appointments.js';
import prescriptionsRoutes from './routes/prescriptions.js';
import notificationsRoutes from './routes/notifications.js';
import emrRoutes from './routes/emr.js';
import professionalsRoutes from './routes/professionals.js';
import invoicesRoutes from './routes/invoices.js';
import staffRoutes from './routes/staff.js';
import clinicHoursRoutes from './routes/clinicHours.js';
import specialClosuresRoutes from './routes/specialClosures.js';
import servicesRoutes from './routes/services.js';
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
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/branches', branchesRoutes);
app.use('/api/v1/results', resultsRoutes);
app.use('/api/v1/review-queue', reviewQueueRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/prescriptions', prescriptionsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
// EMR routes are nested under patients: /api/v1/patients/:id/emr
app.use('/api/v1/patients/:id/emr', emrRoutes);
app.use('/api/v1/professionals', professionalsRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/clinic-hours', clinicHoursRoutes);
app.use('/api/v1/special-closures', specialClosuresRoutes);
app.use('/api/v1/services', servicesRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Route not found' });
});

// ── Sentry error handler (must be before our error handler) ───────────────
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error({ err }, '[error] unhandled exception');
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.code || 'internal_error',
    message: env.isProd() ? 'An unexpected error occurred' : err.message,
  });
});

export default app;
