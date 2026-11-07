// Preloaded by `bun test`. Integration suites need TEST_DATABASE_URL; without it they are skipped.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (testDatabaseUrl) {
  const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
  if (!databaseName.includes("test")) {
    throw new Error(`Refusing to run: TEST_DATABASE_URL points at "${databaseName}", whose name lacks "test".`);
  }
  process.env.DATABASE_URL = testDatabaseUrl;
}

process.env.DATABASE_URL ??= "postgresql://unused@127.0.0.1:1/unused_test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-0";
process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
process.env.CORS_ORIGIN ??= "http://localhost:3001";
