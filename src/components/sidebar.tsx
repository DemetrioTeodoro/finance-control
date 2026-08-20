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
    <aside className="w-64 border-r p-4">
      <h1 className="mb-8 text-xl font-bold">Finance Control</h1>

      <nav className="space-y-2">
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
              className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
