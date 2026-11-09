"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

import Loader from "@/components/loader";
import { unwrap } from "@/components/profile/form-errors";
import { describeDevice } from "@/components/profile/session-device";
import { EmptyState } from "@/components/shell/empty-state";
import { authClient, type AccountSession } from "@/lib/auth-client";

const SESSIONS_KEY = ["account", "sessions"];

type SessionRowProps = {
  session: AccountSession;
  isCurrent: boolean;
  isRevoking: boolean;
  onRevoke: () => void;
};

function SessionRow({ session, isCurrent, isRevoking, onRevoke }: SessionRowProps) {
  const { label, mobile } = describeDevice(session.userAgent);
  const DeviceIcon = mobile ? Smartphone : Monitor;
  const opened = new Date(session.createdAt).toLocaleDateString("es-AR");

  return (
    <li className="flex items-center gap-3 py-3">
      <DeviceIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {isCurrent && "Este dispositivo · "}
          {session.ipAddress ? `IP ${session.ipAddress}` : "IP desconocida"} · <span className="tabular">{opened}</span>
        </p>
      </div>
      {!isCurrent && (
        <Button
          type="button"
          variant="outline"
          disabled={isRevoking}
          aria-label={`Revocar la sesión de ${label}`}
          onClick={onRevoke}
          className="h-11 shrink-0 px-3 text-sm md:h-8"
        >
          {isRevoking && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          Revocar
        </Button>
      )}
    </li>
  );
}

export function SessionsList({ currentSessionId }: { currentSessionId: string }) {
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async () => unwrap(await authClient.listSessions(), "No pudimos cargar tus sesiones"),
  });

  const revoke = useMutation({
    mutationFn: async (token: string) => unwrap(await authClient.revokeSession({ token }), "No pudimos revocar la sesión"),
    onSuccess: async () => {
      toast.success("Sesión revocada");
      await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: (error) => toast.error(error.message),
  });

  if (sessions.isPending) return <Loader />;

  if (sessions.isError) {
    return (
      <EmptyState
        title="No pudimos cargar tus sesiones"
        action={
          <Button type="button" variant="outline" onClick={() => void sessions.refetch()} className="h-11 px-3 text-sm md:h-9">
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {sessions.data.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          isCurrent={session.id === currentSessionId}
          isRevoking={revoke.isPending && revoke.variables === session.token}
          onRevoke={() => revoke.mutate(session.token)}
        />
      ))}
    </ul>
  );
}
