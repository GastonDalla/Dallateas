"use client";

import { Button } from "@dallateas/ui/components/button";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function leave() {
    await signOut();
    router.push("/");
    // The shell lives in the root layout, which a client navigation does not render again.
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" onClick={() => void leave()} className="h-11 px-3 text-sm md:h-9">
      Cerrar sesión
    </Button>
  );
}
