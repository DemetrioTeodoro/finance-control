"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Tags,
  BarChart3,
  Landmark,
  CircleDollarSign,
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Contas",
    href: "/contas",
    icon: Landmark,
  },
  {
    name: "Transações",
    href: "/transacoes",
    icon: Wallet,
  },
  {
    name: "Cartões",
    href: "/cartoes",
    icon: CreditCard,
  },
  {
    name: "Categorias",
    href: "/categorias",
    icon: Tags,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
      <div className="mb-6 flex items-center gap-2.5 px-1 py-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <CircleDollarSign size={18} />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Finance Control
        </span>
      </div>

      <nav className="space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
