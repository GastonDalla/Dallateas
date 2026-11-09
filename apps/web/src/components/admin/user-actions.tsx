"use client";

import { Button } from "@dallateas/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@dallateas/ui/components/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

import type { AdminUser } from "@/lib/auth-client";

/** Actions that run at once, without a dialog in between. */
export type QuickAction = "toggle-role" | "revoke-sessions" | "impersonate" | "unban";
export type DialogAction = "edit" | "sessions" | "ban" | "delete";
export type UserAction = QuickAction | DialogAction;

const ITEM = "min-h-11 text-sm md:min-h-0";

type UserActionsProps = {
  user: AdminUser;
  disabled: boolean;
  onAction: (action: UserAction) => void;
};

export function UserActions({ user, disabled, onAction }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            variant="ghost"
            aria-label={`Acciones para ${user.name}`}
            className="size-11 text-muted-foreground md:size-8"
          />
        }
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-card">
        <DropdownMenuItem className={ITEM} onClick={() => onAction("edit")}>
          Editar usuario
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={() => onAction("toggle-role")}>
          {user.role === "admin" ? "Pasar a usuario" : "Hacer admin"}
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={() => onAction("sessions")}>
          Ver sesiones
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={() => onAction("revoke-sessions")}>
          Revocar sesiones
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={() => onAction("impersonate")}>
          Impersonar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.banned ? (
          <DropdownMenuItem className={ITEM} onClick={() => onAction("unban")}>
            Desbanear
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" className={ITEM} onClick={() => onAction("ban")}>
            Banear
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" className={ITEM} onClick={() => onAction("delete")}>
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
