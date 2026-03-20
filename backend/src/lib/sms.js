import { env } from '../config/env.js';

/**
 * SMS service wrapper around Twilio.
 * Use createSmsService() to get an injectable instance for testability.
 *
 * In tests, pass a mock: createSmsService({ messages: { create: jest.fn() } })
 */
export function createSmsService(twilioClient) {
  /**
   * Send an SMS message.
   * @param {string} to   - E.164 phone number (e.g. +14155550123)
   * @param {string} body - Message text
   */
  async function send(to, body) {
    const client = twilioClient ?? (await loadTwilio());
    return client.messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
  }

  return { send };
}

async function loadTwilio() {
  const { default: twilio } = await import('twilio');
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}
