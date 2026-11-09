import { Globe, Lock, Users, type LucideIcon } from "lucide-react";

type Visibility = "PUBLIC" | "ACCOUNT" | "PRIVATE";

export const FOLDER_TYPE_LABELS = {
  GENRE: "Género",
  SET: "Set",
  OTHER: "Otro",
} as const;

export const COLLABORATOR_ROLE_LABELS: Record<string, string> = {
  VIEWER: "Solo ver",
  CONTRIBUTOR: "Agregar",
  EDITOR: "Editar",
  ADMIN: "Admin",
};

const VISIBILITY: Record<Visibility, { label: string; icon: LucideIcon }> = {
  PUBLIC: { label: "Pública", icon: Globe },
  ACCOUNT: { label: "Con cuenta", icon: Users },
  PRIVATE: { label: "Privada", icon: Lock },
};

export function VisibilityLabel({ visibility }: { visibility: Visibility }) {
  const { label, icon: Icon } = VISIBILITY[visibility];

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

/** The colour a DJ gave a folder. Square, like everything else made of paper. */
export function FolderSwatch({ color }: { color: string | null }) {
  if (!color) return null;
  return <span aria-hidden="true" className="size-3 shrink-0" style={{ backgroundColor: color }} />;
}
