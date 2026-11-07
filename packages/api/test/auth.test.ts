import { beforeEach, describe, expect, test } from "bun:test";

import { auth } from "@dallateas/auth";
import prisma from "@dallateas/db";

import { callerFor, createUser, hasDatabase, resetDatabase } from "./helpers";

const VERIFICATION_WINDOW_MS = 10 * 60 * 1000;

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

  test("an abandoned unverified sign-up cannot keep the attacker's password on the victim's account", async () => {
    const email = "victim@example.com";
    await auth.api.signUpEmail({ body: { name: "Attacker", email, password: "attacker-Passw0rd!" } });
    await prisma.user.update({
      where: { email },
      data: { createdAt: new Date(Date.now() - VERIFICATION_WINDOW_MS - 1000) },
    });

    await auth.api.signUpEmail({ body: { name: "Victim", email, password: "victim-Passw0rd!z" } });
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });

    expect(await canSignIn(email, "attacker-Passw0rd!")).toBe(false);
    expect(await canSignIn(email, "victim-Passw0rd!z")).toBe(true);
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
