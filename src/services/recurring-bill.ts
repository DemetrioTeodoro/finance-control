import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { parseLocalDate } from "@/lib/date";

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

type UnconfirmPaymentInput = {
  userId: string;
  recurringBillId: string;
  year: number;
  month: number;
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

function monthRange(year: number, month: number) {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
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

export type RecurringBillPeriod =
  | "3-months"
  | "6-months"
  | "12-months"
  | "24-months"
  | "custom";

export function resolveRecurringBillPeriod(value?: string): RecurringBillPeriod {
  if (
    value === "3-months" ||
    value === "6-months" ||
    value === "12-months" ||
    value === "24-months" ||
    value === "custom"
  ) {
    return value;
  }

  return "6-months";
}

const CUSTOM_PERIOD_MAX_MONTHS = 60;

/**
 * Resolve a lista de meses (mais antigo → mais recente) a exibir no
 * checklist, a partir do preset escolhido ou de um período personalizado
 * (mesmo padrão de `resolveReportRange` em `src/services/report.ts`). No
 * período personalizado, limita a `CUSTOM_PERIOD_MAX_MONTHS` (5 anos) pra
 * não gerar uma tabela absurdamente larga.
 */
export function resolveRecurringBillMonths(
  period: RecurringBillPeriod,
  startDateParam?: string,
  endDateParam?: string,
): { year: number; month: number }[] {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  if (period === "custom") {
    const startDate = startDateParam
      ? parseLocalDate(startDateParam)
      : new Date(currentYear, currentMonth, 1);

    const endDate = endDateParam
      ? parseLocalDate(endDateParam)
      : new Date(currentYear, currentMonth, 1);

    const startTotal = startDate.getFullYear() * 12 + startDate.getMonth();
    const endTotal = Math.max(
      startTotal,
      endDate.getFullYear() * 12 + endDate.getMonth(),
    );
    const clampedStart = Math.max(startTotal, endTotal - CUSTOM_PERIOD_MAX_MONTHS + 1);

    return Array.from(
      { length: endTotal - clampedStart + 1 },
      (_, index) => {
        const total = clampedStart + index;

        return {
          year: Math.floor(total / 12),
          month: ((total % 12) + 12) % 12,
        };
      },
    );
  }

  const monthsCount =
    period === "24-months" ? 24 : period === "12-months" ? 12 : period === "3-months" ? 3 : 6;

  return Array.from({ length: monthsCount }, (_, index) => {
    const offset = monthsCount - 1 - index;
    const date = new Date(currentYear, currentMonth - offset, 1);

    return { year: date.getFullYear(), month: date.getMonth() };
  });
}

export async function getRecurringBillOptions(userId: string) {
  return prisma.recurringBill.findMany({
    where: {
      userId,
      active: true,
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
 * Lista as contas fixas do usuário com o status de pagamento dos meses
 * informados (mais antigo → mais recente — ver `resolveRecurringBillMonths`),
 * para o usuário conseguir enxergar (e corrigir) meses anteriores num só
 * lugar, em vez de só o mês corrente. "Pago" cobre duas fontes, não
 * mutuamente exclusivas:
 * - uma Transaction com `paidRecurringBillId` apontando pra essa conta,
 *   com data dentro do mês (vínculo explícito, feito ao lançar a despesa);
 * - um RecurringBillPayment (confirmação manual sem transação, ex.: pago
 *   em dinheiro).
 */
export async function getRecurringBillsWithHistory(
  userId: string,
  months: { year: number; month: number }[],
) {
  if (months.length === 0) {
    return { months, bills: [] };
  }

  const periodStart = monthRange(months[0].year, months[0].month).start;
  const periodEnd = monthRange(
    months[months.length - 1].year,
    months[months.length - 1].month,
  ).end;

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
      },
      paidByTransactions: {
        where: {
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
      },
    },
    orderBy: {
      dueDay: "asc",
    },
  });

  const bills = recurringBills.map((recurringBill) => {
    const manualPaymentByKey = new Map(
      recurringBill.payments.map((payment) => [
        `${payment.year}-${payment.month}`,
        payment,
      ]),
    );

    const transactionByKey = new Map(
      recurringBill.paidByTransactions.map((transaction) => [
        `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`,
        transaction,
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
        const key = `${reference.year}-${reference.month}`;
        const transaction = transactionByKey.get(key) ?? null;
        const manualPayment = manualPaymentByKey.get(key) ?? null;

        return {
          year: reference.year,
          month: reference.month,
          paid: transaction !== null || manualPayment !== null,
          transaction: transaction
            ? {
                id: transaction.id,
                description: transaction.description,
                amount: Number(transaction.amount),
                date: transaction.date,
              }
            : null,
        };
      }),
    };
  });

  return { months, bills };
}

/**
 * Transações de despesa dos meses informados, ainda sem vínculo com
 * nenhuma conta fixa, para o usuário escolher qual vincular ao confirmar
 * manualmente o pagamento pelo checklist. Agrupado por "year-month" para
 * consulta rápida no lado do servidor (`page.tsx`), sem precisar de uma
 * query por célula do checklist.
 */
export async function getExpenseTransactionOptionsByMonth(
  userId: string,
  months: { year: number; month: number }[],
) {
  if (months.length === 0) {
    return {};
  }

  const periodStart = monthRange(months[0].year, months[0].month).start;
  const periodEnd = monthRange(
    months[months.length - 1].year,
    months[months.length - 1].month,
  ).end;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      paidRecurringBillId: null,
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

/**
 * Confirma o pagamento de uma conta fixa num mês. Se `transactionId` for
 * informado, o vínculo é feito direto na transação
 * (`Transaction.paidRecurringBillId`, mesmo padrão de `paidCreditCardId`) —
 * sem heurística automática por categoria, que já causou falso positivo
 * (duas despesas na mesma categoria, nenhuma sendo o pagamento real). Sem
 * transação, fica só a confirmação manual (`RecurringBillPayment`), pra
 * casos pagos fora do fluxo rastreado (ex.: em dinheiro).
 */
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

  if (input.transactionId) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: input.transactionId,
        userId: input.userId,
      },
    });

    if (!transaction) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    return prisma.transaction.update({
      where: {
        id: transaction.id,
      },
      data: {
        paidRecurringBillId: recurringBill.id,
      },
    });
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
    },
    update: {},
  });
}

export async function unconfirmRecurringBillPayment(
  input: UnconfirmPaymentInput,
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

  const { start, end } = monthRange(input.year, input.month);

  await prisma.transaction.updateMany({
    where: {
      userId: input.userId,
      paidRecurringBillId: recurringBill.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    data: {
      paidRecurringBillId: null,
    },
  });

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
 * Ponto de entrada chamado pelo cron diário: para cada conta fixa ativa
 * ainda sem confirmação de pagamento no mês, se o vencimento for hoje ou
 * amanhã, envia um e-mail de lembrete. Não faz nenhum casamento automático
 * — a confirmação (com ou sem transação vinculada) é sempre uma ação
 * explícita do usuário.
 */
export async function checkRecurringBillsForReminders() {
  const { year, month } = getCurrentYearMonth();
  const { start, end } = monthRange(year, month);

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
      paidByTransactions: {
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        take: 1,
        select: {
          id: true,
        },
      },
    },
  });

  const remindersSent: string[] = [];

  for (const bill of recurringBills) {
    const isPaid = bill.payments.length > 0 || bill.paidByTransactions.length > 0;

    if (isPaid) {
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
