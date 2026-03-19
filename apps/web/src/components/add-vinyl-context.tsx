"use client";

import { createContext, useContext, useState } from "react";

type AddVinylContextType = {
  open: boolean;
  editId: string | undefined;
  openDrawer: (editId?: string) => void;
  closeDrawer: () => void;
};

const AddVinylContext = createContext<AddVinylContextType>({
  open: false,
  editId: undefined,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function AddVinylProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();

  function openDrawer(id?: string) {
    setEditId(id);
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setEditId(undefined);
  }

  return (
    <AddVinylContext.Provider value={{ open, editId, openDrawer, closeDrawer }}>
      {children}
    </AddVinylContext.Provider>
  );
}

export function useAddVinyl() {
  return useContext(AddVinylContext);
}
