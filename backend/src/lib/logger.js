import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Structured logger (pino).
 * - Development: pretty-printed, human-readable output
 * - Production:  JSON lines (ingested by log aggregators)
 */
export const logger = pino(
  env.isDev()
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {
        level: 'info',
      }
);
