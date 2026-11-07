import { env } from "@dallateas/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
}

// Reuse one client across hot reloads so development does not exhaust connections.
const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
