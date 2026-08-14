import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-xl font-semibold">Finance Control</h1>

      <ModeToggle />
    </header>
  );
}
