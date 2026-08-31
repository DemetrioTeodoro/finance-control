import { prisma } from "@/lib/prisma";
import { getExpensesByCategory as getExpensesByCategoryInRange } from "@/services/report";

export async function getDashboardData(userId: string) {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [accounts, income, expenses] = await Promise.all([
    prisma.account.findMany({
      where: {
        userId,
      },
      select: {
        balance: true,
      },
    }),

    prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        date: {
          gte: startOfMonth,
          lt: startOfNextMonth,
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
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const balance = accounts.reduce(
    (total, account) => total + Number(account.balance),
    0,
  );

  return {
    balance,
    income: Number(income._sum.amount ?? 0),
    expenses: Number(expenses._sum.amount ?? 0),
  };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export async function getMonthlyEvolution(userId: string, months = 6) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({
      where: {
        userId,
      },
      select: {
        balance: true,
      },
    }),

    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      select: {
        date: true,
        type: true,
        amount: true,
        accountId: true,
      },
    }),
  ]);

  const currentBalance = accounts.reduce(
    (total, account) => total + Number(account.balance),
    0,
  );

  const monthsDesc = Array.from({ length: months }, (_, i) => {
    return new Date(now.getFullYear(), now.getMonth() - i, 1);
  });

  const totals = new Map(
    monthsDesc.map((month) => [
      monthKey(month),
      { income: 0, expense: 0, accountNet: 0 },
    ]),
  );

  for (const transaction of transactions) {
    const bucket = totals.get(monthKey(transaction.date));

    if (!bucket) {
      continue;
    }

    const amount = Number(transaction.amount);

    if (transaction.type === "income") {
      bucket.income += amount;

      if (transaction.accountId) {
        bucket.accountNet += amount;
      }
    } else {
      bucket.expense += amount;

      if (transaction.accountId) {
        bucket.accountNet -= amount;
      }
    }
  }

  let runningBalance = currentBalance;

  const monthsWithBalance = monthsDesc.map((month) => {
    const bucket = totals.get(monthKey(month))!;
    const balance = runningBalance;

    runningBalance -= bucket.accountNet;

    return {
      month,
      income: bucket.income,
      expense: bucket.expense,
      balance,
    };
  });

  return monthsWithBalance.reverse();
}

export async function getExpensesByCategory(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return getExpensesByCategoryInRange(userId, {
    startDate: startOfMonth,
    endDate: now,
  });
}
