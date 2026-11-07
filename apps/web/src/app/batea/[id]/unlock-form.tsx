"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { trpc } from "@/utils/trpc";

/** The cookie it earns is read on the server, so the page renders again to show the records. */
export function UnlockForm({ crateId }: { crateId: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const unlock = useMutation({
    ...trpc.folderUnlock.mutationOptions(),
    onSuccess: () => {
      setPassword("");
      router.refresh();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = password.trim();
    if (value) unlock.mutate({ id: crateId, password: value });
  };

  return (
    <form onSubmit={submit} className="max-w-md bg-card p-6">
      <h2 className="font-heading text-[28px] leading-none font-bold">Esta batea tiene contraseña</h2>
      <p className="mt-2 text-sm text-muted-foreground">Pedísela a quien te pasó el link.</p>
      <label htmlFor="crate-password" className="mt-5 block text-sm font-medium">
        Contraseña
      </label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="crate-password"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={unlock.isError}
          aria-describedby={unlock.isError ? "crate-password-error" : undefined}
          className="h-11 text-base md:text-sm"
        />
        <Button type="submit" disabled={!password.trim() || unlock.isPending} className="h-11 px-5 text-sm">
          Entrar
        </Button>
      </div>
      {unlock.error && (
        <p id="crate-password-error" role="alert" className="mt-2 text-sm text-destructive">
          {unlock.error.message}
        </p>
      )}
    </form>
  );
}
