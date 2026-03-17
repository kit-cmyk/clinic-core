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

  // AWS
  AWS_ACCESS_KEY_ID:     process.env.AWS_ACCESS_KEY_ID     || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION:            process.env.AWS_REGION            || 'ap-southeast-1',
  AWS_S3_BUCKET:         process.env.AWS_S3_BUCKET         || '',

  // SMS
  TWILIO_ACCOUNT_SID:  process.env.TWILIO_ACCOUNT_SID  || '',
  TWILIO_AUTH_TOKEN:   process.env.TWILIO_AUTH_TOKEN    || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER  || '',

  isDev:  () => env.NODE_ENV === 'development',
  isProd: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',
};
