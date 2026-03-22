/**
 * Sentry initialisation — must be imported before any other module in server.js.
 * Only active when SENTRY_DSN is set; no-op otherwise.
 */
import * as Sentry from '@sentry/node';
import { env } from './config/env.js';

/** PHI field names to scrub from Sentry error payloads (HIPAA § 164.312(b)). */
const PHI_FIELDS = ['password', 'phone', 'dob', 'allergies', 'bloodType', 'refresh_token', 'access_token'];

function scrubPhi(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(out)) {
    if (PHI_FIELDS.includes(key)) {
      out[key] = '[redacted]';
    } else if (typeof out[key] === 'object') {
      out[key] = scrubPhi(out[key]);
    }
  }
  return out;
}

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.isProd() ? 0.2 : 1.0,
    beforeSend(event) {
      if (event.request?.data)    event.request.data    = scrubPhi(event.request.data);
      if (event.extra)            event.extra           = scrubPhi(event.extra);
      return event;
    },
  });
}

export { Sentry };
