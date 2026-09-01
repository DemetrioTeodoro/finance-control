import { prisma } from "@/lib/prisma";
import { parseLocalDate } from "@/lib/date";

type ReportRange = {
  startDate: Date;
  endDate: Date;
};

export type ReportPeriod = "this-month" | "3-months" | "6-months" | "custom";

export function resolveReportPeriod(value?: string): ReportPeriod {
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

export function resolveReportRange(
  period: ReportPeriod,
  startDateParam?: string,
  endDateParam?: string,
): ReportRange {
  const now = new Date();

  if (period === "custom") {
    const startDate = startDateParam
      ? parseLocalDate(startDateParam)
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

export async function getReportSummary(userId: string, range: ReportRange) {
  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        date: {
          gte: range.startDate,
          lte: range.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        date: {
          gte: range.startDate,
          lte: range.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const incomeTotal = Number(income._sum.amount ?? 0);
  const expenseTotal = Number(expense._sum.amount ?? 0);

  return {
    income: incomeTotal,
    expense: expenseTotal,
    net: incomeTotal - expenseTotal,
  };
}

export async function getExpensesByCategory(userId: string, range: ReportRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: range.startDate,
        lte: range.endDate,
      },
    },
    select: {
      amount: true,
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  const totals = new Map<
    string,
    { name: string; color: string | null; amount: number }
  >();

  for (const transaction of transactions) {
    const key = transaction.category?.id ?? "none";
    const existing = totals.get(key);
    const amount = Number(transaction.amount);

    if (existing) {
      existing.amount += amount;
    } else {
      totals.set(key, {
        name: transaction.category?.name ?? "Sem categoria",
        color: transaction.category?.color ?? null,
        amount,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

export async function getExpensesByAccount(userId: string, range: ReportRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      accountId: {
        not: null,
      },
      date: {
        gte: range.startDate,
        lte: range.endDate,
      },
    },
    select: {
      amount: true,
      account: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totals = new Map<string, { name: string; amount: number }>();

  for (const transaction of transactions) {
    if (!transaction.account) {
      continue;
    }

    const existing = totals.get(transaction.account.id);
    const amount = Number(transaction.amount);

    if (existing) {
      existing.amount += amount;
    } else {
      totals.set(transaction.account.id, {
        name: transaction.account.name,
        amount,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

export async function getExpensesByCreditCard(userId: string, range: ReportRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      creditCardId: {
        not: null,
      },
      date: {
        gte: range.startDate,
        lte: range.endDate,
      },
    },
    select: {
      amount: true,
      creditCard: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totals = new Map<string, { name: string; amount: number }>();

  for (const transaction of transactions) {
    if (!transaction.creditCard) {
      continue;
    }

    const existing = totals.get(transaction.creditCard.id);
    const amount = Number(transaction.amount);

    if (existing) {
      existing.amount += amount;
    } else {
      totals.set(transaction.creditCard.id, {
        name: transaction.creditCard.name,
        amount,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}
