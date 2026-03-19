"use client";
import { Disc3 } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="flex flex-row items-center justify-between px-[max(0.75rem,env(safe-area-inset-left))] py-2 pr-[max(0.75rem,env(safe-area-inset-right))]">
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Disc3 className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg font-bold tracking-tight">
              Dallateas
            </span>
          </Link>
          <Link
            href="/bateas"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Explorar
          </Link>
          {session && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Coleccion
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
