// Sentry must be initialised before any other import for full instrumentation.
import './instrument.js';

import app from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './models/prisma.js';

// ── Database health check ─────────────────────────────────────────────────
// Verify the DB is reachable before accepting traffic. Fail fast in production;
// skip in test mode (CI uses placeholder DATABASE_URL with no real DB).
if (!env.isTest()) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection verified');
  } catch (err) {
    logger.fatal({ err }, 'Cannot connect to database — shutting down');
    process.exit(1);
  }
}

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'ClinicAlly API started');
});
