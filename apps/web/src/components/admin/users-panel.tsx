"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
import { CONTROL } from "@/components/profile/fields";
import type { AdminUser } from "@/lib/auth-client";

import {
  adminUsersKey,
  impersonateUser,
  removeUser,
  revokeUserSessions,
  setUserRole,
  unbanUser,
  type UsersView,
} from "./admin-users";
import { BanDialog } from "./ban-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import type { DialogAction, QuickAction, UserAction } from "./user-actions";
import { UserSessionsDialog } from "./user-sessions-dialog";
import { UsersTable } from "./users-table";

type OpenDialog = { kind: DialogAction; user: AdminUser };

const QUICK_ACTIONS: Record<QuickAction, { run: (user: AdminUser) => Promise<unknown>; done?: string }> = {
  "toggle-role": {
    run: (user) => setUserRole({ userId: user.id, role: user.role === "admin" ? "user" : "admin" }),
    done: "Rol actualizado",
  },
  "revoke-sessions": { run: (user) => revokeUserSessions(user.id), done: "Sesiones revocadas" },
  unban: { run: (user) => unbanUser(user.id), done: "Usuario desbaneado" },
  impersonate: { run: (user) => impersonateUser(user.id) },
};

type UsersPanelProps = {
  users: AdminUser[] | undefined;
  total: number;
  view: UsersView;
  onViewChange: (view: UsersView) => void;
};

export function UsersPanel({ users, total, view, onViewChange }: UsersPanelProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(view.search);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: adminUsersKey });

  const quickAction = useMutation({
    mutationFn: ({ action, user }: { action: QuickAction; user: AdminUser }) => QUICK_ACTIONS[action].run(user),
    onSuccess: async (_result, { action }) => {
      const { done } = QUICK_ACTIONS[action];
      if (done) toast.success(done);
      await refreshUsers();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: removeUser,
    onSuccess: async () => {
      toast.success("Usuario eliminado");
      setDialog(null);
      await refreshUsers();
    },
    onError: (error) => toast.error(error.message),
  });

  function handleAction(user: AdminUser, action: UserAction) {
    if (action === "edit" || action === "sessions" || action === "ban" || action === "delete") {
      setDialog({ kind: action, user });
    } else {
      quickAction.mutate({ action, user });
    }
  }

  const closeDialog = () => setDialog(null);

  return (
    <>
      <form
        role="search"
        className="mb-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onViewChange({ ...view, page: 1, search: draft.trim() });
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar usuarios por email"
            placeholder="Buscar por email"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={`${CONTROL} pl-9`}
          />
        </div>
        <Button type="submit" variant="outline" className="h-11 px-4 text-sm md:h-9">
          Buscar
        </Button>
      </form>

      <UsersTable
        users={users}
        busyUserId={quickAction.isPending ? quickAction.variables.user.id : null}
        onAction={handleAction}
      />

      <div className="mt-4">
        <Pagination
          page={view.page}
          totalPages={Math.ceil(total / view.pageSize)}
          totalItems={total}
          pageSize={view.pageSize}
          onPageChange={(page) => onViewChange({ ...view, page })}
          onPageSizeChange={(pageSize) => onViewChange({ ...view, page: 1, pageSize })}
        />
      </div>

      {dialog?.kind === "ban" && <BanDialog user={dialog.user} onClose={closeDialog} />}
      {dialog?.kind === "edit" && <EditUserDialog user={dialog.user} onClose={closeDialog} />}
      {dialog?.kind === "sessions" && <UserSessionsDialog user={dialog.user} onClose={closeDialog} />}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          title={`Eliminar a ${dialog.user.name}`}
          description="No se puede deshacer. Se borran todos sus datos"
          confirmLabel="Eliminar"
          isLoading={remove.isPending}
          onConfirm={() => remove.mutate(dialog.user.id)}
          onCancel={closeDialog}
        />
      )}
    </>
  );
}
