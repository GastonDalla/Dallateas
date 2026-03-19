"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import {
  Ban,
  CheckCircle,
  Disc3,
  Eye,
  Folder,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CustomSelect } from "@/components/custom-select";
import { Pagination } from "@/components/pagination";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

const DEFAULT_pageSize = 10;

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string | null;
  emailVerified: boolean;
  createdAt: string;
  image?: string | null;
};

type Tab = "users" | "bateas";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_pageSize);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [sessionsUserId, setSessionsUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("");

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [bateasSearch, setBateasSearch] = useState("");

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setIsLoading(true);
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: (p - 1) * pageSize,
          ...(q ? { searchValue: q, searchField: "email", searchOperator: "contains" } : {}),
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      if (res.data) {
        setUsers(res.data.users as any as User[]);
        setTotal(res.data.total);
      }
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, "");
  }, [fetchUsers]);

  function handleSearch() {
    setPage(1);
    fetchUsers(1, search);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchUsers(newPage, search);
  }

  async function handleBan(userId: string) {
    setActionLoading(userId);
    try {
      await authClient.admin.banUser({
        userId,
        banReason: banReason || "Baneado por admin",
        ...(banExpiry ? { banExpiresIn: Math.max(0, Math.floor((new Date(banExpiry).getTime() - Date.now()) / 1000)) } : {}),
      });
      toast.success(banExpiry ? "Usuario baneado temporalmente" : "Usuario baneado");
      setBanUserId(null);
      setBanReason("");
      setBanExpiry("");
      fetchUsers(page, search);
    } catch {
      toast.error("Error al banear");
    } finally {
      setActionLoading(null);
    }
  }

  const updateUserMutation = useMutation({
    ...trpc.adminUpdateUser.mutationOptions(),
    onSuccess: () => {
      toast.success("Usuario actualizado");
      setEditUser(null);
      setEditName("");
      setEditEmail("");
      setEditPassword("");
      fetchUsers(page, search);
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar"),
    onSettled: () => setActionLoading(null),
  });

  function handleEditUser() {
    if (!editUser) return;
    setActionLoading(editUser.id);
    updateUserMutation.mutate({
      userId: editUser.id,
      ...(editName && editName !== editUser.name ? { name: editName } : {}),
      ...(editEmail && editEmail !== editUser.email ? { email: editEmail } : {}),
      ...(editPassword ? { password: editPassword } : {}),
    });
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId);
    try {
      await authClient.admin.unbanUser({ userId });
      toast.success("Usuario desbaneado");
      fetchUsers(page, search);
    } catch {
      toast.error("Error al desbanear");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId);
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" });
      toast.success(`Rol cambiado a ${role}`);
      fetchUsers(page, search);
    } catch {
      toast.error("Error al cambiar rol");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevokeSessions(userId: string) {
    setActionLoading(userId);
    try {
      await authClient.admin.revokeUserSessions({ userId });
      toast.success("Sesiones revocadas");
    } catch {
      toast.error("Error al revocar sesiones");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveUser(userId: string) {
    setActionLoading(userId);
    try {
      await authClient.admin.removeUser({ userId });
      toast.success("Usuario eliminado");
      setDeleteUserId(null);
      fetchUsers(page, search);
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleImpersonate(userId: string) {
    try {
      await authClient.admin.impersonateUser({ userId });
      toast.success("Impersonando usuario");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Error al impersonar");
    }
  }

  async function viewSessions(userId: string) {
    setSessionsUserId(userId);
    setSessionsLoading(true);
    try {
      const res = await authClient.admin.listUserSessions({ userId });
      const sessionsData = res.data;
      setSessions(Array.isArray(sessionsData) ? sessionsData : (sessionsData as any)?.sessions ?? []);
    } catch {
      toast.error("Error al cargar sesiones");
    } finally {
      setSessionsLoading(false);
    }
  }

  const bateasQuery = useQuery(
    trpc.adminFolders.queryOptions({
      limit: 50,
      search: bateasSearch || undefined,
    }),
  );

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-2xl font-bold">Admin</h1>
      </div>

      {}
      <div className="mb-6 flex gap-1 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${tab === "users" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Usuarios ({total})
        </button>
        <button
          type="button"
          onClick={() => setTab("bateas")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${tab === "bateas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          <Folder className="h-3 w-3" /> Bateas
        </button>
      </div>

      {}
      {tab === "users" && (
        <>
          <div className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                className="pl-10"
              />
            </div>
            <Button type="button" onClick={handleSearch}>Buscar</Button>
          </div>

          {isLoading && users.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60 bg-card shadow-sm">
              <table className="w-full text-xs" aria-label="Lista de usuarios">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link href={`/admin/user/${user.id}` as any} className="font-medium text-primary hover:underline">{user.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <CustomSelect
                          value={user.role}
                          onChange={(v) => handleSetRole(user.id, v)}
                          disabled={actionLoading === user.id}
                          label={`Rol de ${user.name}`}
                          options={[
                            { value: "user", label: "User" },
                            { value: "admin", label: "Admin" },
                          ]}
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.banned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                              <Ban className="h-3 w-3" /> Baneado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] text-green-600">
                              <CheckCircle className="h-3 w-3" /> Activo
                            </span>
                          )}
                          {user.emailVerified && (
                            <span className="text-[10px] text-muted-foreground">Verificado</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {user.banned ? (
                            <button type="button" onClick={() => handleUnban(user.id)} disabled={actionLoading === user.id} className="rounded-md p-1.5 text-green-600 transition-colors hover:bg-green-500/10" title="Desbanear">
                              <ShieldOff className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button type="button" onClick={() => setBanUserId(user.id)} disabled={actionLoading === user.id} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Banear">
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => { setEditUser(user); setEditName(user.name); setEditEmail(user.email); setEditPassword(""); }} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Editar usuario">
                            <UserCog className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => viewSessions(user.id)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Ver sesiones">
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => handleRevokeSessions(user.id)} disabled={actionLoading === user.id} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Revocar sesiones">
                            <LogOut className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => handleImpersonate(user.id)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" title="Impersonar">
                            <UserCog className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setDeleteUserId(user.id)} disabled={actionLoading === user.id} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); fetchUsers(1, search); }}
            />
          </div>
        </>
      )}

      {}
      {tab === "bateas" && (
        <>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={bateasSearch}
                onChange={(e) => setBateasSearch(e.target.value)}
                placeholder="Buscar bateas por nombre..."
                className="w-full rounded-md border border-border/60 bg-card py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          {bateasQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60 bg-card shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Batea</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dueno</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vinilos</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vistas</th>
                  </tr>
                </thead>
                <tbody>
                  {bateasQuery.data?.items.map((folder: any) => (
                    <tr key={folder.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {folder.color && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: folder.color }} />}
                          <span className="font-medium">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {folder.owner?.name}
                        <span className="ml-1 text-[10px]">({folder.owner?.email})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                          {folder.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {folder.visibility === "PUBLIC" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] text-green-600">
                              <Eye className="h-3 w-3" /> Publica
                            </span>
                          ) : folder.visibility === "ACCOUNT" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600">
                              Con cuenta
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Privada</span>
                          )}
                          {folder.hasPassword && (
                            <Lock className="h-3 w-3 text-muted-foreground" title="Con contrasena" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{folder.vinylCount}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{folder.viewCount}</td>
                    </tr>
                  ))}
                  {(!bateasQuery.data?.items || bateasQuery.data.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron bateas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {}
      {banUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBanUserId(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="ban-dialog-title" className="relative w-full max-w-sm space-y-4 rounded-lg border border-border/60 bg-background p-6 shadow-xl">
            <h3 id="ban-dialog-title" className="font-heading text-lg font-semibold">Banear usuario</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Razon (opcional)</label>
              <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Razon del baneo..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Expira (opcional — dejar vacio para ban permanente)</label>
              <Input type="datetime-local" value={banExpiry} onChange={(e) => setBanExpiry(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBanUserId(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={actionLoading === banUserId}
                onClick={() => handleBan(banUserId)}
              >
                {actionLoading === banUserId ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Banear
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {sessionsUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSessionsUserId(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="sessions-dialog-title" className="relative w-full max-w-md space-y-4 rounded-lg border border-border/60 bg-background p-6 shadow-xl">
            <h3 id="sessions-dialog-title" className="font-heading text-lg font-semibold">Sesiones activas</h3>
            {sessionsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay sesiones activas.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {sessions.map((s: any) => (
                  <div key={s.id} className="rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs">
                    <p className="font-medium">{s.userAgent?.slice(0, 60) ?? "Desconocido"}</p>
                    <p className="text-muted-foreground">IP: {s.ipAddress ?? "N/A"}</p>
                    <p className="text-muted-foreground">Expira: {new Date(s.expiresAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setSessionsUserId(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      <ConfirmDialog
        open={!!deleteUserId}
        title="Eliminar usuario"
        description="Seguro? Esta accion es irreversible. Se eliminaran todos los datos del usuario."
        confirmLabel="Eliminar"
        isLoading={actionLoading === deleteUserId}
        onConfirm={() => deleteUserId && handleRemoveUser(deleteUserId)}
        onCancel={() => setDeleteUserId(null)}
      />

      {}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditUser(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-sm space-y-4 rounded-lg border border-border/60 bg-background p-6 shadow-xl">
            <h3 className="font-heading text-lg font-semibold">Editar usuario</h3>
            <p className="text-xs text-muted-foreground">ID: {editUser.id}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nombre</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email</label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nueva contrasena (dejar vacio para no cambiar)</label>
                <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nueva contrasena..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button type="button" size="sm" disabled={actionLoading === editUser.id} onClick={handleEditUser}>
                {actionLoading === editUser.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
