import { auth } from "@/auth";
import { LogoutButton } from "./logout-button";
import { ModeToggle } from "./mode-toggle";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-xl font-semibold">Finance Control</h1>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">
            {session?.user?.name || "Usuário"}
          </p>

          <p className="text-xs text-muted-foreground">
            {session?.user?.email}
          </p>
        </div>

        <ModeToggle />

        <LogoutButton />
      </div>
    </header>
  );
}
