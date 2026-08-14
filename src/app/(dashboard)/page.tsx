import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
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
            <div className="text-2xl font-bold">R$ 0,00</div>

            <p className="text-xs text-muted-foreground">Saldo disponível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>

            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>

            <p className="text-xs text-muted-foreground">Entradas deste mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>

            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>

            <p className="text-xs text-muted-foreground">Gastos deste mês</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
