import { prisma } from "@/lib/prisma";

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
