"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { CustomSelect } from "@/components/custom-select";
import { trpc } from "@/utils/trpc";

const ROLES = [
  { value: "VIEWER", label: "Solo ver" },
  { value: "CONTRIBUTOR", label: "Agregar" },
  { value: "EDITOR", label: "Agregar + Eliminar" },
  { value: "ADMIN", label: "Todo" },
] as const;

type Role = (typeof ROLES)[number]["value"];

function toRole(value: string) {
  return ROLES.find((role) => role.value === value)?.value;
}

export function CollaboratorsPanel({ folderId }: { folderId: string }) {
  const queryClient = useQueryClient();
  const collaboratorsQuery = useQuery(trpc.folderCollaborators.queryOptions({ folderId }));
  const collaborators = collaboratorsQuery.data ?? [];

  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("VIEWER");

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: trpc.folderCollaborators.queryKey({ folderId }) });
  }

  const invite = useMutation(
    trpc.folderInvite.mutationOptions({
      onSuccess: () => {
        void refresh();
        setEmail("");
        setInviting(false);
        toast.success("Si esa cuenta existe, ya tiene acceso a la carpeta");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const removeCollaborator = useMutation(
    trpc.folderRemoveCollaborator.mutationOptions({
      onSuccess: () => {
        void refresh();
        toast.success("Colaborador eliminado");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateRole = useMutation(
    trpc.folderUpdateCollaboratorRole.mutationOptions({
      onSuccess: () => void refresh(),
      onError: (error) => toast.error(error.message),
    }),
  );

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (address) invite.mutate({ folderId, email: address, role: inviteRole });
  }

  return (
    <section aria-labelledby="folder-collaborators" className="border-t border-border pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="folder-collaborators" className="font-heading text-xl font-bold">
          Colaboradores
        </h2>
        <Button
          variant="ghost"
          className="h-11 px-3 text-sm text-link md:h-9"
          aria-expanded={inviting}
          onClick={() => setInviting(!inviting)}
        >
          <UserPlus aria-hidden="true" />
          Invitar
        </Button>
      </div>

      {inviting && (
        <form className="mb-3 flex flex-wrap gap-2" onSubmit={handleInvite}>
          <Input
            type="email"
            aria-label="Email del colaborador"
            placeholder="Email del colaborador"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 min-w-48 flex-1 text-sm md:h-9 md:text-sm"
          />
          <CustomSelect
            value={inviteRole}
            onChange={(value) => setInviteRole(toRole(value) ?? "VIEWER")}
            options={[...ROLES]}
            label="Rol del colaborador"
            className="w-44"
          />
          <Button type="submit" className="h-11 px-4 text-sm md:h-9" disabled={!email.trim() || invite.isPending}>
            Invitar
          </Button>
        </form>
      )}

      {collaborators.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin colaboradores. Invitá a alguien para compartir esta carpeta</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {collaborators.map(({ id, role, user }) => (
            <li key={id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-sm font-medium">{user.name}</span>
              <span className="flex shrink-0 items-center gap-1">
                <CustomSelect
                  value={role}
                  onChange={(value) => {
                    const next = toRole(value);
                    if (next) updateRole.mutate({ folderId, userId: user.id, role: next });
                  }}
                  options={[...ROLES]}
                  label={`Rol de ${user.name}`}
                  className="w-44"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:size-8"
                  aria-label={`Quitar a ${user.name}`}
                  onClick={() => removeCollaborator.mutate({ folderId, userId: user.id })}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
