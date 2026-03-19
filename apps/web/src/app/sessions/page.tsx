import { auth } from "@dallateas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SessionsPage from "./sessions-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sesiones",
  robots: { index: false, follow: false },
};

export default async function Sessions() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  return <SessionsPage currentSessionToken={session.session.token} />;
}
