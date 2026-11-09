"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/profile/fields";
import type { AdminUser } from "@/lib/auth-client";

import { adminUsersKey, banUser } from "./admin-users";
import { Modal, ModalError } from "./modal";

type BanDialogProps = {
  user: AdminUser;
  onClose: () => void;
};

export function BanDialog({ user, onClose }: BanDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [expiry, setExpiry] = useState("");
  const [expiryError, setExpiryError] = useState<string>();

  const ban = useMutation({
    mutationFn: banUser,
    onSuccess: async () => {
      toast.success(expiry ? "Usuario baneado hasta la fecha elegida" : "Usuario baneado");
      await queryClient.invalidateQueries({ queryKey: adminUsersKey });
      onClose();
    },
  });

  function submit() {
    const secondsLeft = expiry ? Math.floor((new Date(expiry).getTime() - Date.now()) / 1000) : undefined;
    // The API reads zero as no expiry, which would turn a past date into a permanent ban.
    if (secondsLeft !== undefined && secondsLeft <= 0) {
      setExpiryError("Elegí una fecha futura");
      return;
    }
    setExpiryError(undefined);
    ban.mutate({ userId: user.id, banReason: reason.trim() || "Baneado por admin", banExpiresIn: secondsLeft });
  }

  return (
    <Modal title={`Banear a ${user.name}`} onClose={onClose}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field
          id="ban-reason"
          label="Razón"
          optional
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <Field
          id="ban-expiry"
          label="Vence"
          optional
          type="datetime-local"
          value={expiry}
          onChange={(event) => setExpiry(event.target.value)}
          hint="Vacío es un baneo permanente"
          error={expiryError}
        />
        <ModalError message={ban.error?.message} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-3 text-sm md:h-9">
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" disabled={ban.isPending} className="h-11 px-3 text-sm md:h-9">
            {ban.isPending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
            Banear
          </Button>
        </div>
      </form>
    </Modal>
  );
}
