"use client";

import { Button } from "@dallateas/ui/components/button";
import { useQuery } from "@tanstack/react-query";

import Loader from "@/components/loader";
import { describeDevice } from "@/components/profile/session-device";
import type { AdminUser } from "@/lib/auth-client";

import { adminUserSessionsQuery } from "./admin-users";
import { Modal, ModalError } from "./modal";

type UserSessionsDialogProps = {
  user: AdminUser;
  onClose: () => void;
};

export function UserSessionsDialog({ user, onClose }: UserSessionsDialogProps) {
  const sessions = useQuery(adminUserSessionsQuery(user.id));

  return (
    <Modal title={`Sesiones de ${user.name}`} onClose={onClose}>
      {sessions.isPending && <Loader />}
      <ModalError message={sessions.error?.message} />
      {sessions.data?.length === 0 && <p className="text-sm text-muted-foreground">No hay sesiones activas</p>}
      {sessions.data && sessions.data.length > 0 && (
        <ul className="max-h-60 divide-y divide-border overflow-y-auto overscroll-contain">
          {sessions.data.map((session) => (
            <li key={session.id} className="py-2">
              <p className="truncate text-sm font-medium">{describeDevice(session.userAgent).label}</p>
              <p className="text-[13px] text-muted-foreground">
                {session.ipAddress ? `IP ${session.ipAddress}` : "IP desconocida"} · Vence{" "}
                <span className="tabular">{new Date(session.expiresAt).toLocaleString("es-AR")}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onClose} className="h-11 px-3 text-sm md:h-9">
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
