import type { Route } from "next";
import Link from "next/link";

import type { AdminUser } from "@/lib/auth-client";

import { TableSkeletonRows } from "./table-skeleton";
import { UserActions, type UserAction } from "./user-actions";

const HEADER = "py-2 pr-4 text-left text-[13px] font-normal text-muted-foreground";

function roleLabel(user: AdminUser) {
  return user.role === "admin" ? "Admin" : "Usuario";
}

function UserState({ user }: { user: AdminUser }) {
  return (
    <>
      {user.banned ? <span className="text-destructive">Baneado</span> : "Activo"}
      {" · "}
      {user.emailVerified ? "Verificado" : "Sin verificar"}
    </>
  );
}

type UsersTableProps = {
  users: AdminUser[] | undefined;
  busyUserId: string | null;
  onAction: (user: AdminUser, action: UserAction) => void;
};

export function UsersTable({ users, busyUserId, onAction }: UsersTableProps) {
  return (
    <table className="w-full table-fixed border-b border-border text-sm" aria-label="Lista de usuarios">
      <thead>
        <tr>
          <th scope="col" className={HEADER}>
            Usuario
          </th>
          <th scope="col" className={`${HEADER} hidden w-24 sm:table-cell`}>
            Rol
          </th>
          <th scope="col" className={`${HEADER} hidden w-48 sm:table-cell`}>
            Estado
          </th>
          <th scope="col" className="w-12">
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {!users && <TableSkeletonRows columns={4} />}
        {users?.map((user) => (
          <tr key={user.id} className="border-t border-border transition-colors hover:bg-muted/40">
            <td className="py-2 pr-4">
              <Link href={`/admin/user/${user.id}` as Route} className="block truncate font-medium text-link hover:underline">
                {user.name}
              </Link>
              <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
              <p className="truncate text-[13px] text-muted-foreground sm:hidden">
                {roleLabel(user)} · <UserState user={user} />
              </p>
            </td>
            <td className="hidden py-2 pr-4 align-middle sm:table-cell">{roleLabel(user)}</td>
            <td className="hidden py-2 pr-4 align-middle text-muted-foreground sm:table-cell">
              <UserState user={user} />
            </td>
            <td className="py-2 text-right align-middle">
              <UserActions user={user} disabled={busyUserId === user.id} onAction={(action) => onAction(user, action)} />
            </td>
          </tr>
        ))}
        {users?.length === 0 && (
          <tr className="border-t border-border">
            <td colSpan={4} className="py-8 text-muted-foreground">
              No se encontraron usuarios
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
