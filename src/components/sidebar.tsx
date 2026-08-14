import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Tags,
  BarChart3,
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transações",
    icon: Wallet,
  },
  {
    name: "Cartões",
    icon: CreditCard,
  },
  {
    name: "Categorias",
    icon: Tags,
  },
  {
    name: "Relatórios",
    icon: BarChart3,
  },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r p-4">
      <h1 className="mb-8 text-xl font-bold">Finance Control</h1>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted"
            >
              <Icon size={20} />
              {item.name}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
