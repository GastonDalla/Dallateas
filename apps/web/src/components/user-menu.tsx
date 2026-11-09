"use client";

import { Button } from "@dallateas/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@dallateas/ui/components/dropdown-menu";
import { User } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient, signOut } from "@/lib/auth-client";

const ITEM = "min-h-11 text-sm md:min-h-0";

const LINKS: { href: Route; label: string }[] = [
  { href: "/profile", label: "Perfil DJ" },
  { href: "/settings", label: "Configuración" },
  { href: "/dashboard", label: "Mi colección" },
  { href: "/stats", label: "Estadísticas" },
  { href: "/import", label: "Importar vinilos" },
];

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div aria-hidden="true" className="h-11 min-w-0 flex-1 md:h-9" />;

  if (!session) {
    return (
      <Button variant="outline" render={<Link href="/login" />} nativeButton={false} className="h-11 px-3 text-sm md:h-9">
        Ingresar
      </Button>
    );
  }

  const isAdmin = session.user.role === "admin";
  const isImpersonating = Boolean(session.session.impersonatedBy);

  async function stopImpersonating() {
    await authClient.admin.stopImpersonating();
    // A full load, so nothing cached from the impersonated account stays in memory.
    window.location.assign(new URL("/admin", window.location.origin));
  }

  async function leave() {
    await signOut();
    router.push("/");
    // The shell lives in the root layout, which a client navigation does not render again.
    router.refresh();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      {isImpersonating && (
        <button
          type="button"
          onClick={() => void stopImpersonating()}
          className="min-h-11 rounded-md bg-accent px-2.5 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/80 md:min-h-9"
        >
          Dejar de impersonar
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className="h-11 max-w-28 min-w-0 shrink justify-start gap-1.5 px-2.5 text-sm md:h-9 md:w-full md:max-w-none"
            />
          }
        >
          <User aria-hidden="true" className="size-4" />
          <span className="truncate">{session.user.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate text-[13px]">{session.user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LINKS.map(({ href, label }) => (
              <DropdownMenuItem key={href} render={<Link href={href} />} className={ITEM}>
                {label}
              </DropdownMenuItem>
            ))}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/admin" />} className={ITEM}>
                  Admin
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void leave()} className={ITEM}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
