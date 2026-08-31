import { prisma } from "@/lib/prisma";

type CreateCreditCardInput = {
  userId: string;
  name: string;
  limit?: number | null;
  closingDay: number;
  dueDay: number;
};

type UpdateCreditCardInput = {
  userId: string;
  creditCardId: string;
  name: string;
  limit?: number | null;
  closingDay: number;
  dueDay: number;
};

type DeleteCreditCardInput = {
  userId: string;
  creditCardId: string;
};

function isValidDay(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

export async function getCreditCards(userId: string) {
  const creditCards = await prisma.creditCard.findMany({
    where: {
      userId,
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return creditCards.map((creditCard) => ({
    ...creditCard,
    transactionCount: creditCard._count.transactions,
  }));
}

export async function getCreditCardOptions(userId: string) {
  return prisma.creditCard.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createCreditCard(input: CreateCreditCardInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  if (!isValidDay(input.closingDay)) {
    throw new Error("INVALID_CLOSING_DAY");
  }

  if (!isValidDay(input.dueDay)) {
    throw new Error("INVALID_DUE_DAY");
  }

  return prisma.creditCard.create({
    data: {
      name,
      limit: input.limit ?? null,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      userId: input.userId,
    },
  });
}

export async function updateCreditCard(input: UpdateCreditCardInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  if (!isValidDay(input.closingDay)) {
    throw new Error("INVALID_CLOSING_DAY");
  }

  if (!isValidDay(input.dueDay)) {
    throw new Error("INVALID_DUE_DAY");
  }

  const creditCard = await prisma.creditCard.findFirst({
    where: {
      id: input.creditCardId,
      userId: input.userId,
    },
  });

  if (!creditCard) {
    throw new Error("CREDIT_CARD_NOT_FOUND");
  }

  return prisma.creditCard.update({
    where: {
      id: creditCard.id,
    },
    data: {
      name,
      limit: input.limit ?? null,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
    },
  });
}

export type InvoiceCycleKey = {
  year: number;
  month: number; // 0-indexed, igual ao Date nativo
};

/**
 * Determina a qual ciclo de fatura uma data pertence: se o dia ainda não
 * passou do fechamento, o ciclo fecha neste mês; senão, fecha no mês
 * seguinte. A mesma regra serve tanto para "em qual fatura essa transação
 * cai" quanto para "qual é a fatura atual em aberto" (usando a data de hoje).
 */
export function resolveInvoiceCycleKey(
  closingDay: number,
  date: Date,
): InvoiceCycleKey {
  if (date.getDate() <= closingDay) {
    return { year: date.getFullYear(), month: date.getMonth() };
  }

  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { year: nextMonth.getFullYear(), month: nextMonth.getMonth() };
}

export function shiftInvoiceCycle(
  cycle: InvoiceCycleKey,
  delta: number,
): InvoiceCycleKey {
  const date = new Date(cycle.year, cycle.month + delta, 1);

  return { year: date.getFullYear(), month: date.getMonth() };
}

export function getInvoiceCycleRange(
  closingDay: number,
  dueDay: number,
  cycle: InvoiceCycleKey,
) {
  const periodEnd = new Date(
    cycle.year,
    cycle.month,
    closingDay,
    23,
    59,
    59,
    999,
  );

  const previousClosing = new Date(cycle.year, cycle.month - 1, closingDay);
  const periodStart = new Date(
    previousClosing.getFullYear(),
    previousClosing.getMonth(),
    previousClosing.getDate() + 1,
  );

  const dueDate =
    dueDay >= closingDay
      ? new Date(cycle.year, cycle.month, dueDay)
      : new Date(cycle.year, cycle.month + 1, dueDay);

  return { periodStart, periodEnd, dueDate };
}

type GetInvoiceInput = {
  userId: string;
  creditCardId: string;
  cycle?: InvoiceCycleKey;
};

export async function getCreditCardInvoice(input: GetInvoiceInput) {
  const creditCard = await prisma.creditCard.findFirst({
    where: {
      id: input.creditCardId,
      userId: input.userId,
    },
  });

  if (!creditCard) {
    throw new Error("CREDIT_CARD_NOT_FOUND");
  }

  const currentCycle = resolveInvoiceCycleKey(creditCard.closingDay, new Date());
  const cycle = input.cycle ?? currentCycle;

  const { periodStart, periodEnd, dueDate } = getInvoiceCycleRange(
    creditCard.closingDay,
    creditCard.dueDay,
    cycle,
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: input.userId,
      creditCardId: creditCard.id,
      type: "expense",
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const total = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0,
  );

  return {
    creditCard: {
      id: creditCard.id,
      name: creditCard.name,
      limit: creditCard.limit !== null ? Number(creditCard.limit) : null,
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
    },
    cycle,
    isCurrent: cycle.year === currentCycle.year && cycle.month === currentCycle.month,
    periodStart,
    periodEnd,
    dueDate,
    total,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.date,
      category: transaction.category,
    })),
  };
}

export async function deleteCreditCard(input: DeleteCreditCardInput) {
  return prisma.$transaction(async (tx) => {
    const creditCard = await tx.creditCard.findFirst({
      where: {
        id: input.creditCardId,
        userId: input.userId,
      },
    });

    if (!creditCard) {
      throw new Error("CREDIT_CARD_NOT_FOUND");
    }

    await tx.transaction.updateMany({
      where: {
        creditCardId: creditCard.id,
        userId: input.userId,
      },
      data: {
        creditCardId: null,
      },
    });

    await tx.creditCard.delete({
      where: {
        id: creditCard.id,
      },
    });

    return {
      success: true,
    };
  });
}
