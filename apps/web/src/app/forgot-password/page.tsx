import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/server/session";

import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return <ForgotPasswordForm />;
}
