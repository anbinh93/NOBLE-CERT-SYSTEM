import { PrismaClient } from "@prisma/client";
import { env } from "./env.config";

export const prisma = new PrismaClient({
  datasourceUrl: env.MONGODB_URI,
});
