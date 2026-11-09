import "server-only";

import { auth } from "@dallateas/auth";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/** The current session, read once per request however many components ask for it. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For pages behind sign-in: sends visitors to log in and unverified accounts to verify. */
export async function requireSession() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}` as Route);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}
