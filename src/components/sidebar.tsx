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
  X,
} from "lucide-react";

import { useSidebar } from "@/components/sidebar-context";

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
  const { isOpen, close } = useSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CircleDollarSign size={18} />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Finance Control
            </span>
          </div>

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={close}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden"
          >
            <X size={20} />
          </button>
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
                onClick={close}
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
    </>
  );
}
