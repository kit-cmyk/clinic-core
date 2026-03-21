import 'dotenv/config';

// Validate required environment variables at startup.
// Add to REQUIRED as new vars become mandatory.
const REQUIRED = ['NODE_ENV', 'PORT'];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(`[env] Missing env vars: ${missing.join(', ')} — using defaults`);
}

export const env = {
  NODE_ENV:   process.env.NODE_ENV   || 'development',
  PORT:       parseInt(process.env.PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Supabase
  SUPABASE_URL:              process.env.SUPABASE_URL              || '',
  SUPABASE_ANON_KEY:         process.env.SUPABASE_ANON_KEY         || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  JWT_SECRET:                process.env.JWT_SECRET                || '',

  // Supabase Storage (file uploads — replaces AWS S3)
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'cliniccore-files',

  // SMS
  TWILIO_ACCOUNT_SID:  process.env.TWILIO_ACCOUNT_SID  || '',
  TWILIO_AUTH_TOKEN:   process.env.TWILIO_AUTH_TOKEN    || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER  || '',

  // Malware scanning (CC-47)
  MALWARE_SCAN_API_URL: process.env.MALWARE_SCAN_API_URL || '',

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || '',

  // Email (SMTP — any provider: SendGrid, Mailgun, AWS SES, etc.)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@clinically.app',

  isDev:  () => env.NODE_ENV === 'development',
  isProd: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',
};
