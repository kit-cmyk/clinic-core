import rateLimit from 'express-rate-limit';

/**
 * Standard auth limiter — login, signup, refresh, register-org.
 * 10 attempts per IP per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Too many attempts. Please try again in 15 minutes.' },
});

/**
 * Stricter limiter for the super-admin login endpoint.
 * 5 attempts per IP per 15 minutes.
 */
export const superAdminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Too many attempts. Please try again in 15 minutes.' },
});

/**
 * Limiter for patient SMS invite — prevents phone number enumeration / SMS spam.
 * 20 invites per IP per hour.
 */
export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Too many invite requests. Please try again later.' },
});
