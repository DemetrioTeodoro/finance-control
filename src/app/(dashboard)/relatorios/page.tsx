import { auth } from "@/auth";
import {
  getExpensesByAccount,
  getExpensesByCategory,
  getExpensesByCreditCard,
  getReportSummary,
} from "@/services/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensitiveValue } from "@/components/sensitive-value";
import { CategoryExpenseChart } from "@/components/charts/category-expense-chart";
import { ReportFilters } from "./report-filters";

export const dynamic = "force-dynamic";

type Period = "this-month" | "3-months" | "6-months" | "custom";

type RelatoriosPageProps = {
  searchParams: Promise<{
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

function resolvePeriod(value?: string): Period {
  if (
    value === "this-month" ||
    value === "3-months" ||
    value === "6-months" ||
    value === "custom"
  ) {
    return value;
  }

  return "this-month";
}

function resolveRange(period: Period, startDateParam?: string, endDateParam?: string) {
  const now = new Date();

  if (period === "custom") {
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const endDate = endDateParam
      ? new Date(`${endDateParam}T23:59:59.999Z`)
      : now;

    return { startDate, endDate };
  }

  const monthsBack = period === "6-months" ? 5 : period === "3-months" ? 2 : 0;

  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

  return { startDate, endDate: now };
}

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default async function RelatoriosPage({
  searchParams,
}: RelatoriosPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const params = await searchParams;
  const period = resolvePeriod(params.period);
  const range = resolveRange(period, params.startDate, params.endDate);

  const [summary, expensesByCategory, expensesByAccount, expensesByCreditCard] =
    await Promise.all([
      getReportSummary(session.user.id, range),
      getExpensesByCategory(session.user.id, range),
      getExpensesByAccount(session.user.id, range),
      getExpensesByCreditCard(session.user.id, range),
    ]);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>

        <p className="text-muted-foreground">
          Totais e detalhamento por período, categoria, conta e cartão
        </p>
      </div>

      <ReportFilters
        period={period}
        defaultStartDate={params.startDate ?? toIsoDate(range.startDate)}
        defaultEndDate={params.endDate ?? toIsoDate(range.endDate)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              <SensitiveValue>{currency.format(summary.income)}</SensitiveValue>
            </div>

            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              <SensitiveValue>{currency.format(summary.expense)}</SensitiveValue>
            </div>

            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              <SensitiveValue>{currency.format(summary.net)}</SensitiveValue>
            </div>

            <p className="text-xs text-muted-foreground">Receitas - despesas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Gastos por categoria
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CategoryExpenseChart
              data={expensesByCategory}
              emptyMessage="Nenhuma despesa no período selecionado."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Gastos por conta
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CategoryExpenseChart
              data={expensesByAccount.map((item) => ({
                ...item,
                color: null,
              }))}
              emptyMessage="Nenhuma despesa vinculada a uma conta no período."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Gastos por cartão
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CategoryExpenseChart
              data={expensesByCreditCard.map((item) => ({
                ...item,
                color: null,
              }))}
              emptyMessage="Nenhuma despesa vinculada a um cartão no período."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
