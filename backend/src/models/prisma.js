import { PrismaClient } from '@prisma/client';

// Singleton pattern — prevents multiple PrismaClient instances during
// Node.js hot-reload in development (nodemon restarts reuse the same instance).
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
