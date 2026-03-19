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
import { Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  if (!session) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          Ingresar
        </Button>
      </Link>
    );
  }

  const isAdmin = session.user.role === "admin";
  const isImpersonating = !!(session.session as any)?.impersonatedBy;

  return (
    <div className="flex items-center gap-2">
      {isImpersonating && (
        <button
          type="button"
          onClick={async () => {
            await authClient.admin.stopImpersonating();
            window.location.href = "/admin";
          }}
          className="rounded-md bg-yellow-500/10 px-2.5 py-1 text-[11px] font-medium text-yellow-700 transition-colors hover:bg-yellow-500/20 dark:text-yellow-400"
        >
          Dejar de impersonar
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <User className="mr-1.5 h-3.5 w-3.5" />
          {session.user.name}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              Perfil DJ
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              Mi coleccion
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/stats")}>
              Estadisticas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/import")}>
              Importar vinilos
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <Shield className="mr-1.5 h-3.5 w-3.5" /> Admin
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: { onSuccess: () => router.push("/") },
                });
              }}
            >
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
