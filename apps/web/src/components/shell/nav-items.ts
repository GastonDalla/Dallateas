import { BarChart3, Compass, Disc3, FolderOpen, Gauge, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavItem = { href: Route; label: string; icon: LucideIcon };

export const APP_NAV: NavItem[] = [
  { href: "/dashboard", label: "Colección", icon: Disc3 },
  { href: "/folders", label: "Carpetas", icon: FolderOpen },
  { href: "/herramientas", label: "Herramientas", icon: Gauge },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
  { href: "/bateas", label: "Explorar", icon: Compass },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
