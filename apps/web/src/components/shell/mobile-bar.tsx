import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

import { Wordmark } from "./wordmark";

/** The compact top bar for signed-in DJs on a phone. */
export function MobileBar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 md:hidden">
      <Wordmark />
      <div className="flex items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
