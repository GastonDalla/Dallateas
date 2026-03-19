"use client";

import { Button } from "@dallateas/ui/components/button";
import { ArrowLeft, Disc3, Loader2, LogOut, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type Session = {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function parseUserAgent(ua?: string | null) {
  if (!ua) return { device: "Desconocido", icon: Monitor };
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] ?? "Browser";
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS|iPhone)/i)?.[1] ?? "";
  return {
    device: `${browser}${os ? ` en ${os}` : ""}`,
    icon: isMobile ? Smartphone : Monitor,
  };
}

export default function SessionsPage({ currentSessionToken }: { currentSessionToken: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function fetchSessions() {
    setIsLoading(true);
    try {
      const res = await authClient.listSessions();
      setSessions((res.data as any as Session[]) ?? []);
    } catch {
      toast.error("Error al cargar sesiones");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchSessions(); }, []);

  async function handleRevoke(token: string) {
    setRevokingId(token);
    try {
      await authClient.revokeSession({ token });
      toast.success("Sesion revocada");
      fetchSessions();
    } catch {
      toast.error("Error al revocar sesion");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <Link href="/settings" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Configuracion
      </Link>

      <h1 className="font-heading mb-6 text-2xl font-bold">Mis sesiones</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay sesiones activas.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const { device, icon: DeviceIcon } = parseUserAgent(session.userAgent);
            const isCurrent = session.token === currentSessionToken;

            return (
              <div
                key={session.id}
                className={`flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm ${
                  isCurrent ? "border-primary/30" : "border-border/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <DeviceIcon className={`h-5 w-5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {device}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Actual
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: {session.ipAddress ?? "N/A"} · {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {!isCurrent && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={revokingId === session.token}
                    onClick={() => handleRevoke(session.token)}
                    title="Revocar sesion"
                  >
                    {revokingId === session.token ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
