"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@dallateas/ui/components/sonner";
import { lazy, Suspense } from "react";

import { queryClient } from "@/utils/trpc";

import { AddVinylProvider } from "./add-vinyl-context";
import { ThemeProvider } from "./theme-provider";
import { VinylDrawer } from "./vinyl-drawer";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools,
  })),
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AddVinylProvider>
          {children}
          <VinylDrawer />
        </AddVinylProvider>
        {process.env.NODE_ENV === "development" && (
          <Suspense>
            <ReactQueryDevtools />
          </Suspense>
        )}
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
