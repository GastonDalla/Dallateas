import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { unwrap } from "@/components/profile/form-errors";
import { authClient } from "@/lib/auth-client";

export type UsersView = {
  page: number;
  pageSize: number;
  search: string;
};

export const adminUsersKey = ["admin", "users"];

export function adminUsersQuery({ page, pageSize, search }: UsersView) {
  return queryOptions({
    queryKey: [...adminUsersKey, { page, pageSize, search }],
    queryFn: async () =>
      unwrap(
        await authClient.admin.listUsers({
          query: {
            limit: pageSize,
            offset: (page - 1) * pageSize,
            sortBy: "createdAt",
            sortDirection: "desc",
            ...(search ? { searchValue: search, searchField: "email", searchOperator: "contains" } : {}),
          },
        }),
        "No pudimos cargar los usuarios",
      ),
    placeholderData: keepPreviousData,
  });
}

export function adminUserSessionsQuery(userId: string) {
  return queryOptions({
    queryKey: ["admin", "user-sessions", userId],
    queryFn: async () => {
      const { sessions } = unwrap(
        await authClient.admin.listUserSessions({ userId }),
        "No pudimos cargar las sesiones",
      );
      return sessions;
    },
    staleTime: 0,
  });
}

export async function banUser(input: { userId: string; banReason: string; banExpiresIn?: number }) {
  return unwrap(await authClient.admin.banUser(input), "No pudimos banear al usuario");
}

export async function unbanUser(userId: string) {
  return unwrap(await authClient.admin.unbanUser({ userId }), "No pudimos desbanear al usuario");
}

export async function setUserRole(input: { userId: string; role: "user" | "admin" }) {
  return unwrap(await authClient.admin.setRole(input), "No pudimos cambiar el rol");
}

export async function revokeUserSessions(userId: string) {
  return unwrap(await authClient.admin.revokeUserSessions({ userId }), "No pudimos revocar las sesiones");
}

export async function removeUser(userId: string) {
  return unwrap(await authClient.admin.removeUser({ userId }), "No pudimos eliminar al usuario");
}

export async function impersonateUser(userId: string) {
  unwrap(await authClient.admin.impersonateUser({ userId }), "No pudimos impersonar al usuario");
  // A full load, so nothing cached from the admin's own session stays in memory.
  window.location.assign(new URL("/dashboard", window.location.origin));
}
