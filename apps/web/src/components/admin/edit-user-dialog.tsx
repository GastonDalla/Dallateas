"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/profile/fields";
import { PasswordField } from "@/components/profile/password-field";
import type { AdminUser } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { adminUsersKey } from "./admin-users";
import { Modal, ModalError } from "./modal";

type EditUserDialogProps = {
  user: AdminUser;
  onClose: () => void;
};

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");

  const edit = useMutation({
    ...trpc.adminUpdateUser.mutationOptions(),
    onSuccess: async () => {
      toast.success("Usuario actualizado");
      await queryClient.invalidateQueries({ queryKey: adminUsersKey });
      onClose();
    },
  });

  const nextName = name.trim();
  const nextEmail = email.trim();
  const passwordError = password && password.length < 8 ? "Mínimo 8 caracteres" : undefined;
  const changes = {
    ...(nextName && nextName !== user.name ? { name: nextName } : {}),
    ...(nextEmail && nextEmail !== user.email ? { email: nextEmail } : {}),
    ...(password ? { password } : {}),
  };
  const hasChanges = Object.keys(changes).length > 0;

  return (
    <Modal title="Editar usuario" onClose={onClose}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (hasChanges && !passwordError) edit.mutate({ userId: user.id, ...changes });
        }}
      >
        <Field id="edit-name" label="Nombre" value={name} onChange={(event) => setName(event.target.value)} />
        <Field id="edit-email" label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <PasswordField
          id="edit-password"
          label="Nueva contraseña"
          optional
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="Vacía deja la actual. Si la cambiás, se cierran sus sesiones"
          error={passwordError}
        />
        <ModalError message={edit.error?.message} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-3 text-sm md:h-9">
            Cancelar
          </Button>
          <Button type="submit" disabled={!hasChanges || edit.isPending} className="h-11 px-3 text-sm md:h-9">
            {edit.isPending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
