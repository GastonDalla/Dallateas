import { beforeEach, describe, expect, test } from "bun:test";

import { auth } from "@dallateas/auth";
import prisma from "@dallateas/db";

import { callerFor, createUser, hasDatabase, resetDatabase } from "./helpers";

const VERIFICATION_WINDOW_MS = 10 * 60 * 1000;

let requests = 0;

/** Goes through the real HTTP handler, so hooks, cookies and validation all run. */
async function post(path: string, body: Record<string, unknown>, cookie?: string) {
  requests += 1;
  return auth.handler(
    new Request(`http://localhost:3001/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3001",
        "x-forwarded-for": `10.1.${Math.floor(requests / 250)}.${requests % 250}`,
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function cookiesOf(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function pendingCode(email: string) {
  const row = await prisma.verification.findFirstOrThrow({
    where: { identifier: { contains: email } },
    orderBy: { createdAt: "desc" },
  });
  return row.value.split(":")[0]!;
}

async function canSignIn(email: string, password: string) {
  try {
    const result = await auth.api.signInEmail({ body: { email, password } });
    return Boolean(result.user);
  } catch {
    return false;
  }
}

describe.skipIf(!hasDatabase)("accounts", () => {
  beforeEach(resetDatabase);

  test("after an admin resets a password the user can sign in with it", async () => {
    await auth.api.signUpEmail({ body: { name: "Member", email: "member@example.com", password: "first-Passw0rd!x" } });
    const member = await prisma.user.update({
      where: { email: "member@example.com" },
      data: { emailVerified: true },
    });
    const admin = await createUser({ role: "admin" });

    await callerFor({ id: admin.id, role: "admin" }).adminUpdateUser({
      userId: member.id,
      password: "second-Passw0rd!y",
    });

    expect(await canSignIn("member@example.com", "second-Passw0rd!y")).toBe(true);
    expect(await canSignIn("member@example.com", "first-Passw0rd!x")).toBe(false);
  });

  test("signing up and verifying in the same browser keeps the password", async () => {
    const email = "dj@example.com";
    const signUp = await post("/sign-up/email", { name: "DJ", email, password: "my-Passw0rd!x" });

    const verified = await post("/email-otp/verify-email", { email, otp: await pendingCode(email) }, cookiesOf(signUp));

    expect(verified.status).toBe(200);
    expect(await canSignIn(email, "my-Passw0rd!x")).toBe(true);
  });

  test("a password set by someone else does not survive the owner verifying the email", async () => {
    const email = "victim@example.com";
    await post("/sign-up/email", { name: "Attacker", email, password: "attacker-Passw0rd!" });

    const verified = await post("/email-otp/verify-email", { email, otp: await pendingCode(email) });

    expect(verified.status).toBe(200);
    expect(await canSignIn(email, "attacker-Passw0rd!")).toBe(false);
  });

  test("a second sign-up neither replaces the first nor lets its password through", async () => {
    const email = "pending@example.com";
    await post("/sign-up/email", { name: "Attacker", email, password: "attacker-Passw0rd!" });

    const second = await post("/sign-up/email", { name: "Victim", email, password: "victim-Passw0rd!z" });
    const verified = await post("/email-otp/verify-email", { email, otp: await pendingCode(email) }, cookiesOf(second));

    expect(verified.status).toBe(200);
    expect(await canSignIn(email, "attacker-Passw0rd!")).toBe(false);
    expect(await canSignIn(email, "victim-Passw0rd!z")).toBe(false);
  });

  test("a wrong code leaves a pending sign-up untouched", async () => {
    const email = "pending@example.com";
    const signUp = await post("/sign-up/email", { name: "DJ", email, password: "my-Passw0rd!x" });
    const code = await pendingCode(email);

    const wrong = await post("/email-otp/verify-email", { email, otp: code === "000000" ? "111111" : "000000" });
    const right = await post("/email-otp/verify-email", { email, otp: code }, cookiesOf(signUp));

    expect(wrong.status).toBe(400);
    expect(right.status).toBe(200);
    expect(await canSignIn(email, "my-Passw0rd!x")).toBe(true);
  });

  test("a sign-up without a password deletes nothing", async () => {
    const email = "pending@example.com";
    await post("/sign-up/email", { name: "DJ", email, password: "my-Passw0rd!x" });
    await prisma.user.update({
      where: { email },
      data: { createdAt: new Date(Date.now() - VERIFICATION_WINDOW_MS - 1000) },
    });

    const invalid = await post("/sign-up/email", { email });

    expect(invalid.status).toBe(400);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  test("a verified account is never replaced by a new sign-up", async () => {
    const email = "owner@example.com";
    await auth.api.signUpEmail({ body: { name: "Owner", email, password: "owner-Passw0rd!x" } });
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true, createdAt: new Date(Date.now() - VERIFICATION_WINDOW_MS - 1000) },
    });

    await auth.api.signUpEmail({ body: { name: "Other", email, password: "other-Passw0rd!y" } }).catch(() => undefined);

    expect(await canSignIn(email, "owner-Passw0rd!x")).toBe(true);
    expect(await canSignIn(email, "other-Passw0rd!y")).toBe(false);
  });
});
