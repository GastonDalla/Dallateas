import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/server/session";

import VerifyEmailForm from "./verify-email-form";

export const metadata: Metadata = {
  title: "Verificar email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const [session, { email }] = await Promise.all([getSession(), searchParams]);
  // Only a verified account leaves: requireSession sends unverified ones here, so anything wider would loop.
  if (session?.user.emailVerified) redirect("/dashboard");

  const address = typeof email === "string" ? email : session?.user.email;
  if (!address) redirect("/login");

  return <VerifyEmailForm email={address} />;
}
