import type { Metadata } from "next";
import { redirect } from "next/navigation";

import SignUpForm from "@/components/sign-up-form";
import { getSession } from "@/server/session";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return <SignUpForm />;
}
