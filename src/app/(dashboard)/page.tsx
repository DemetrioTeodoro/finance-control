import { auth } from "@/auth";
import {
  getDashboardData,
  getExpensesByCategory,
  getMonthlyEvolution,
} from "@/services/dashboard";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensitiveValue } from "@/components/sensitive-value";
import { BalanceEvolutionChart } from "@/components/charts/balance-evolution-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryExpenseChart } from "@/components/charts/category-expense-chart";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function formatMonth(date: Date) {
  return monthFormatter.format(date).replace(".", "");
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="p-6">
        <p>Usuário não encontrado na sessão.</p>
      </div>
    );
  }

  const [{ balance, income, expenses }, monthlyEvolution, expensesByCategory] =
    await Promise.all([
      getDashboardData(session.user.id),
      getMonthlyEvolution(session.user.id),
      getExpensesByCategory(session.user.id),
    ]);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="space-y-4">
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
            <div className="text-2xl font-bold">
              <SensitiveValue>{currency.format(balance)}</SensitiveValue>
            </div>

            <p className="text-xs text-muted-foreground">Saldo disponível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>

            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              <SensitiveValue>{currency.format(income)}</SensitiveValue>
            </div>

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
              <SensitiveValue>{currency.format(expenses)}</SensitiveValue>
            </div>

            <p className="text-xs text-muted-foreground">Gastos deste mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Evolução do saldo
            </CardTitle>

            <p className="text-xs text-muted-foreground">
              Saldo das contas ao final de cada mês
            </p>
          </CardHeader>

          <CardContent>
            <BalanceEvolutionChart
              data={monthlyEvolution.map((point) => ({
                label: formatMonth(point.month),
                balance: point.balance,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Receitas x despesas
            </CardTitle>

            <p className="text-xs text-muted-foreground">
              Totais mensais, independente de conta
            </p>
          </CardHeader>

          <CardContent>
            <IncomeExpenseChart
              data={monthlyEvolution.map((point) => ({
                label: formatMonth(point.month),
                income: point.income,
                expense: point.expense,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Gastos por categoria
            </CardTitle>

            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardHeader>

          <CardContent>
            <CategoryExpenseChart data={expensesByCategory} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
