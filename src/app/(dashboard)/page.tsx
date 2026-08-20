import { auth } from "@/auth";
import { getDashboardData } from "@/services/dashboard";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="p-6">
        <p>Usuário não encontrado na sessão.</p>
      </div>
    );
  }

  const { balance, income, expenses } = await getDashboardData(session.user.id);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="text-muted-foreground">Visão geral das suas finanças</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>

            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{currency.format(balance)}</div>

            <p className="text-xs text-muted-foreground">Saldo disponível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>

            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{currency.format(income)}</div>

            <p className="text-xs text-muted-foreground">Entradas deste mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>

            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {currency.format(expenses)}
            </div>

            <p className="text-xs text-muted-foreground">Gastos deste mês</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
