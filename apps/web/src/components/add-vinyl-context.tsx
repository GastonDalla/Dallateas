"use client";

import { createContext, use, useState, type ReactNode } from "react";

type AddVinylContextType = {
  open: boolean;
  editId: string | undefined;
  openDrawer: (editId?: string) => void;
  closeDrawer: () => void;
};

const AddVinylContext = createContext<AddVinylContextType | null>(null);

export function AddVinylProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<{ open: boolean; editId?: string }>({ open: false });

  return (
    <AddVinylContext
      value={{
        open: drawer.open,
        editId: drawer.editId,
        openDrawer: (editId) => setDrawer({ open: true, editId }),
        closeDrawer: () => setDrawer({ open: false }),
      }}
    >
      {children}
    </AddVinylContext>
  );
}

export function useAddVinyl() {
  const context = use(AddVinylContext);
  if (!context) throw new Error("useAddVinyl needs an AddVinylProvider above it");
  return context;
}
