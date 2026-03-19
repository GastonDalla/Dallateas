import { env } from "@dallateas/env/server";

import { PrismaClient } from "../prisma/generated/client";

function createPrismaClient() {
  if (env.DB_PROVIDER === "postgresql") {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    return new PrismaClient({ adapter });
  }

  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const adapter = new PrismaLibSql({ url: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

export default prisma;
