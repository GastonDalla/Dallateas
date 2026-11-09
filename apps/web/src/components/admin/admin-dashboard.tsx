"use client";

import { cn } from "@dallateas/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/shell/page-header";

import { adminUsersQuery, type UsersView } from "./admin-users";
import { BateasPanel } from "./bateas-panel";
import { UsersPanel } from "./users-panel";

type Tab = "users" | "bateas";

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [view, setView] = useState<UsersView>({ page: 1, pageSize: 10, search: "" });
  const users = useQuery(adminUsersQuery(view));
  const total = users.data?.total;

  const tabs: { value: Tab; label: string }[] = [
    { value: "users", label: total === undefined ? "Usuarios" : `Usuarios (${total})` },
    { value: "bateas", label: "Bateas" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Admin" className="mb-6" />

      <div role="group" aria-label="Sección" className="mb-6 flex gap-6 border-b border-border">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px h-11 border-b-2 text-sm tabular transition-colors md:h-9",
              tab === value
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <UsersPanel users={users.data?.users} total={total ?? 0} view={view} onViewChange={setView} />
      ) : (
        <BateasPanel />
      )}
    </div>
  );
}
