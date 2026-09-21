import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type CreateRecurringBillInput = {
  userId: string;
  name: string;
  expectedAmount?: number | null;
  dueDay: number;
  categoryId?: string | null;
};

type UpdateRecurringBillInput = {
  userId: string;
  recurringBillId: string;
  name: string;
  expectedAmount?: number | null;
  dueDay: number;
  categoryId?: string | null;
  active: boolean;
};

type DeleteRecurringBillInput = {
  userId: string;
  recurringBillId: string;
};

type ConfirmPaymentInput = {
  userId: string;
  recurringBillId: string;
  year: number;
  month: number;
  transactionId?: string | null;
};

function isValidDay(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

async function assertCategoryOwnership(
  userId: string,
  categoryId: string | null | undefined,
) {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
  });

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }
}

export function getCurrentYearMonth() {
  const now = new Date();

  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * Data de vencimento do mês, com o dia limitado ao último dia do mês
 * (mesma ideia de clamping usada no ciclo de fatura do cartão), para não
 * quebrar em meses mais curtos (ex.: dueDay 31 em fevereiro).
 */
export function resolveDueDate(dueDay: number, year: number, month: number) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  return new Date(year, month, Math.min(dueDay, lastDayOfMonth));
}

export async function createRecurringBill(input: CreateRecurringBillInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  if (!isValidDay(input.dueDay)) {
    throw new Error("INVALID_DUE_DAY");
  }

  await assertCategoryOwnership(input.userId, input.categoryId);

  return prisma.recurringBill.create({
    data: {
      name,
      expectedAmount: input.expectedAmount ?? null,
      dueDay: input.dueDay,
      categoryId: input.categoryId ?? null,
      userId: input.userId,
    },
  });
}

export async function updateRecurringBill(input: UpdateRecurringBillInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  if (!isValidDay(input.dueDay)) {
    throw new Error("INVALID_DUE_DAY");
  }

  const recurringBill = await prisma.recurringBill.findFirst({
    where: {
      id: input.recurringBillId,
      userId: input.userId,
    },
  });

  if (!recurringBill) {
    throw new Error("RECURRING_BILL_NOT_FOUND");
  }

  await assertCategoryOwnership(input.userId, input.categoryId);

  return prisma.recurringBill.update({
    where: {
      id: recurringBill.id,
    },
    data: {
      name,
      expectedAmount: input.expectedAmount ?? null,
      dueDay: input.dueDay,
      categoryId: input.categoryId ?? null,
      active: input.active,
    },
  });
}

export async function deleteRecurringBill(input: DeleteRecurringBillInput) {
  const recurringBill = await prisma.recurringBill.findFirst({
    where: {
      id: input.recurringBillId,
      userId: input.userId,
    },
  });

  if (!recurringBill) {
    throw new Error("RECURRING_BILL_NOT_FOUND");
  }

  await prisma.recurringBill.delete({
    where: {
      id: recurringBill.id,
    },
  });

  return { success: true };
}

/**
 * Lista as contas fixas do usuário com o status de pagamento do mês
 * informado (padrão: os últimos `monthsCount` meses, mês atual incluso).
 * "Pago" cobre tanto a confirmação manual quanto o casamento automático
 * feito por `checkRecurringBillsForReminders`. O histórico existe para o
 * usuário conseguir enxergar (e corrigir) meses anteriores num só lugar,
 * em vez de só o mês corrente.
 */
export async function getRecurringBillsWithHistory(
  userId: string,
  monthsCount = 6,
) {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  const months = Array.from({ length: monthsCount }, (_, index) => {
    const offset = monthsCount - 1 - index;
    const date = new Date(currentYear, currentMonth - offset, 1);

    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const recurringBills = await prisma.recurringBill.findMany({
    where: {
      userId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      payments: {
        where: {
          OR: months.map((reference) => ({
            year: reference.year,
            month: reference.month,
          })),
        },
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              amount: true,
              date: true,
            },
          },
        },
      },
    },
    orderBy: {
      dueDay: "asc",
    },
  });

  const bills = recurringBills.map((recurringBill) => {
    const paymentByKey = new Map(
      recurringBill.payments.map((payment) => [
        `${payment.year}-${payment.month}`,
        payment,
      ]),
    );

    return {
      id: recurringBill.id,
      name: recurringBill.name,
      expectedAmount:
        recurringBill.expectedAmount !== null
          ? Number(recurringBill.expectedAmount)
          : null,
      dueDay: recurringBill.dueDay,
      active: recurringBill.active,
      category: recurringBill.category,
      history: months.map((reference) => {
        const payment =
          paymentByKey.get(`${reference.year}-${reference.month}`) ?? null;

        return {
          year: reference.year,
          month: reference.month,
          paid: payment !== null,
          confirmedAutomatically: payment?.transactionId != null,
          transaction: payment?.transaction
            ? {
                id: payment.transaction.id,
                description: payment.transaction.description,
                amount: Number(payment.transaction.amount),
                date: payment.transaction.date,
              }
            : null,
        };
      }),
    };
  });

  return { months, bills };
}

/**
 * Transações de despesa dos meses informados, para o usuário escolher qual
 * vincular ao confirmar manualmente o pagamento de uma conta fixa. Agrupado
 * por "year-month" para consulta rápida no lado do servidor (`page.tsx`),
 * sem precisar de uma query por célula do checklist.
 */
export async function getExpenseTransactionOptionsByMonth(
  userId: string,
  months: { year: number; month: number }[],
) {
  if (months.length === 0) {
    return {};
  }

  const periodStart = new Date(months[0].year, months[0].month, 1);
  const lastMonth = months[months.length - 1];
  const periodEnd = new Date(
    lastMonth.year,
    lastMonth.month + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const byMonth: Record<
    string,
    { id: string; description: string; amount: number; date: Date }[]
  > = {};

  for (const transaction of transactions) {
    const key = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;

    if (!byMonth[key]) {
      byMonth[key] = [];
    }

    byMonth[key].push({
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.date,
    });
  }

  return byMonth;
}

async function findMatchingTransaction(
  userId: string,
  categoryId: string,
  year: number,
  month: number,
) {
  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return prisma.transaction.findFirst({
    where: {
      userId,
      categoryId,
      type: "expense",
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function confirmRecurringBillPayment(input: ConfirmPaymentInput) {
  const recurringBill = await prisma.recurringBill.findFirst({
    where: {
      id: input.recurringBillId,
      userId: input.userId,
    },
  });

  if (!recurringBill) {
    throw new Error("RECURRING_BILL_NOT_FOUND");
  }

  const transactionId = input.transactionId ?? null;

  if (transactionId) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: input.userId,
      },
    });

    if (!transaction) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
  }

  return prisma.recurringBillPayment.upsert({
    where: {
      recurringBillId_year_month: {
        recurringBillId: recurringBill.id,
        year: input.year,
        month: input.month,
      },
    },
    create: {
      recurringBillId: recurringBill.id,
      year: input.year,
      month: input.month,
      transactionId,
    },
    update: {
      transactionId,
    },
  });
}

export async function unconfirmRecurringBillPayment(
  input: ConfirmPaymentInput,
) {
  const recurringBill = await prisma.recurringBill.findFirst({
    where: {
      id: input.recurringBillId,
      userId: input.userId,
    },
  });

  if (!recurringBill) {
    throw new Error("RECURRING_BILL_NOT_FOUND");
  }

  await prisma.recurringBillPayment.deleteMany({
    where: {
      recurringBillId: recurringBill.id,
      year: input.year,
      month: input.month,
    },
  });

  return { success: true };
}

function buildReminderEmail(
  userName: string | null,
  bill: { name: string; dueDate: Date; expectedAmount: number | null },
  isDueToday: boolean,
) {
  const dueDateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(bill.dueDate);

  const amountLabel =
    bill.expectedAmount !== null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(bill.expectedAmount)
      : null;

  const subject = isDueToday
    ? `Vence hoje: ${bill.name}`
    : `Vence amanhã: ${bill.name}`;

  const greeting = userName ? `Olá, ${userName}.` : "Olá.";

  const whenLabel = isDueToday ? "vence hoje" : "vence amanhã";

  const html = `
    <p>${greeting}</p>
    <p>A conta fixa <strong>${bill.name}</strong> ${whenLabel} (dia ${dueDateLabel})${
      amountLabel ? ` e o valor esperado é <strong>${amountLabel}</strong>` : ""
    } e ainda não foi identificada como paga.</p>
    <p>Se já pagou, confirme no Finance Control para não receber esse aviso de novo.</p>
  `.trim();

  return { subject, html };
}

/**
 * Ponto de entrada chamado pelo cron diário: para cada conta fixa ativa,
 * tenta casar automaticamente com uma transação existente no mês (mesma
 * categoria); se não achar e o vencimento for hoje ou amanhã, envia um
 * e-mail de lembrete.
 */
export async function checkRecurringBillsForReminders() {
  const { year, month } = getCurrentYearMonth();

  const today = new Date();
  const todayDay = today.getDate();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const recurringBills = await prisma.recurringBill.findMany({
    where: {
      active: true,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      payments: {
        where: {
          year,
          month,
        },
        take: 1,
      },
    },
  });

  const remindersSent: string[] = [];

  for (const bill of recurringBills) {
    let payment = bill.payments[0] ?? null;

    if (!payment && bill.categoryId) {
      const matchingTransaction = await findMatchingTransaction(
        bill.userId,
        bill.categoryId,
        year,
        month,
      );

      if (matchingTransaction) {
        payment = await prisma.recurringBillPayment.create({
          data: {
            recurringBillId: bill.id,
            year,
            month,
            transactionId: matchingTransaction.id,
          },
        });
      }
    }

    if (payment) {
      continue;
    }

    const dueDate = resolveDueDate(bill.dueDay, year, month);
    const isDueToday = dueDate.getDate() === todayDay;
    const isDueTomorrow =
      dueDate.getDate() === tomorrow.getDate() &&
      dueDate.getMonth() === tomorrow.getMonth();

    if (!isDueToday && !isDueTomorrow) {
      continue;
    }

    const { subject, html } = buildReminderEmail(
      bill.user.name,
      {
        name: bill.name,
        dueDate,
        expectedAmount:
          bill.expectedAmount !== null ? Number(bill.expectedAmount) : null,
      },
      isDueToday,
    );

    await sendEmail({
      to: bill.user.email,
      subject,
      html,
    });

    remindersSent.push(bill.id);
  }

  return { checked: recurringBills.length, remindersSent: remindersSent.length };
}
