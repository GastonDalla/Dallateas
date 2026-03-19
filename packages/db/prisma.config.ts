import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: "../../apps/web/.env",
});

const provider = (process.env.DB_PROVIDER as "sqlite" | "postgresql") ?? "sqlite";
const url = process.env.DATABASE_URL!;

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url,
    provider,
  },
});
