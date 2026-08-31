import { auth } from "@/auth";
import { LogoutButton } from "./logout-button";
import { ModeToggle } from "./mode-toggle";
import { SidebarToggleButton } from "./sidebar-toggle-button";
import { ValueVisibilityToggle } from "./value-visibility-toggle";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b px-4 md:justify-end md:px-6">
      <SidebarToggleButton />

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">
            {session?.user?.name || "Usuário"}
          </p>

          <p className="text-xs text-muted-foreground">
            {session?.user?.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ValueVisibilityToggle />

          <ModeToggle />
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
