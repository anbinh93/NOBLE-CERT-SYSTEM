import { PrismaClient } from '@prisma/client';
import { env } from './env.config';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.MONGODB_URI,
    },
  },
});

