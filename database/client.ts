import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const isDatabaseConfigured = (): boolean => Boolean(process.env.DATABASE_URL?.trim());

export async function connectDatabase(): Promise<void> {
  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production.');
    }
    console.warn('[Database] DATABASE_URL is not configured; local development will use non-persistent state.');
    return;
  }
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (isDatabaseConfigured()) {
    await prisma.$disconnect();
  }
}
