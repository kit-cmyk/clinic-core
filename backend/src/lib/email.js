import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Email service factory — wraps nodemailer with SMTP transport.
 *
 * If SMTP_HOST is not configured the service falls back to logging the
 * email to console so that local development and tests work without
 * a real mail server.
 *
 * Injectable for testability: pass { transporter: mockTransporter } in tests.
 */
export function createEmailService({ transporter: injectedTransporter } = {}) {
  let _transporter = injectedTransporter ?? null;

  async function getTransporter() {
    if (_transporter) return _transporter;
    if (!env.SMTP_HOST) return null; // no-op mode
    const { default: nodemailer } = await import('nodemailer');
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    return _transporter;
  }

  /**
   * Send an email.
   * @param {object} options
   * @param {string} options.to      - Recipient address
   * @param {string} options.subject - Email subject
   * @param {string} options.text    - Plain-text body
   * @param {string} [options.html]  - HTML body (optional)
   */
  async function send({ to, subject, text, html }) {
    const transport = await getTransporter();
    if (!transport) {
      logger.warn({ to, subject }, '[email] SMTP not configured — email not sent');
      return;
    }
    await transport.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
    logger.info({ to, subject }, '[email] sent');
  }

  return { send };
}

/** Lazy singleton. */
let _emailService = null;
export function getEmailService() {
  _emailService ??= createEmailService();
  return _emailService;
}
