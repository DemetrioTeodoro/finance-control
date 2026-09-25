import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type CreateTransactionInput = {
  userId: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  accountId?: string | null;
  categoryId?: string | null;
  creditCardId?: string | null;
  paidCreditCardId?: string | null;
  paidRecurringBillId?: string | null;
};

type UpdateTransactionInput = {
  userId: string;
  transactionId: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  accountId?: string | null;
  categoryId?: string | null;
  creditCardId?: string | null;
  paidCreditCardId?: string | null;
  paidRecurringBillId?: string | null;
};

type BulkCreditCardTransactionItem = {
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  externalId?: string | null;
};

type BulkCreateCreditCardTransactionsInput = {
  userId: string;
  creditCardId: string;
  items: BulkCreditCardTransactionItem[];
};

type BulkAccountTransactionItem = {
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  externalId?: string | null;
};

type BulkCreateAccountTransactionsInput = {
  userId: string;
  accountId: string;
  items: BulkAccountTransactionItem[];
};

type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  creditCardId?: string;
  type?: "income" | "expense";
  startDate?: Date;
  endDate?: Date;
};

export async function getTransactions(
  userId: string,
  filters?: TransactionFilters,
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.categoryId && {
        categoryId: filters.categoryId === "none" ? null : filters.categoryId,
      }),
      ...(filters?.creditCardId && { creditCardId: filters.creditCardId }),
      ...(filters?.type && { type: filters.type }),
      ...((filters?.startDate || filters?.endDate) && {
        date: {
          ...(filters?.startDate && { gte: filters.startDate }),
          ...(filters?.endDate && { lte: filters.endDate }),
        },
      }),
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      creditCard: {
        select: {
          id: true,
          name: true,
        },
      },
      paidCreditCard: {
        select: {
          id: true,
          name: true,
        },
      },
      paidRecurringBill: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
    type: transaction.type as "income" | "expense",
  }));
}

export async function getAccountOptions(userId: string) {
  return prisma.account.findMany({
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

export async function getCategoryOptions(userId: string) {
  return prisma.category.findMany({
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

export async function createTransaction(input: CreateTransactionInput) {
  const description = input.description.trim();

  if (!description) {
    throw new Error("INVALID_DESCRIPTION");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const amount = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    let account = null;

    if (input.accountId) {
      account = await tx.account.findFirst({
        where: {
          id: input.accountId,
          userId: input.userId,
        },
      });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }
    }

    if (input.categoryId) {
      const category = await tx.category.findFirst({
        where: {
          id: input.categoryId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
      }
    }

    if (input.creditCardId) {
      const creditCard = await tx.creditCard.findFirst({
        where: {
          id: input.creditCardId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!creditCard) {
        throw new Error("CREDIT_CARD_NOT_FOUND");
      }
    }

    if (input.paidCreditCardId) {
      if (input.type !== "expense") {
        throw new Error("INVALID_PAID_CREDIT_CARD_TYPE");
      }

      const paidCreditCard = await tx.creditCard.findFirst({
        where: {
          id: input.paidCreditCardId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!paidCreditCard) {
        throw new Error("CREDIT_CARD_NOT_FOUND");
      }
    }

    if (input.paidRecurringBillId) {
      if (input.type !== "expense") {
        throw new Error("INVALID_PAID_RECURRING_BILL_TYPE");
      }

      const paidRecurringBill = await tx.recurringBill.findFirst({
        where: {
          id: input.paidRecurringBillId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!paidRecurringBill) {
        throw new Error("RECURRING_BILL_NOT_FOUND");
      }
    }

    if (account) {
      const newBalance =
        input.type === "income"
          ? account.balance.add(amount)
          : account.balance.sub(amount);

      await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          balance: newBalance,
        },
      });
    }

    return tx.transaction.create({
      data: {
        description,
        amount,
        type: input.type,
        date: input.date,
        userId: input.userId,
        accountId: input.accountId ?? null,
        categoryId: input.categoryId ?? null,
        creditCardId: input.creditCardId ?? null,
        paidCreditCardId: input.paidCreditCardId ?? null,
        paidRecurringBillId: input.paidRecurringBillId ?? null,
      },
    });
  });
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const description = input.description.trim();

  if (!description) {
    throw new Error("INVALID_DESCRIPTION");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const amount = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    const existingTransaction = await tx.transaction.findFirst({
      where: {
        id: input.transactionId,
        userId: input.userId,
      },
    });

    if (!existingTransaction) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    /*
     * 1. Reverte o impacto da transação antiga
     */
    if (existingTransaction.accountId) {
      const oldAccount = await tx.account.findFirst({
        where: {
          id: existingTransaction.accountId,
          userId: input.userId,
        },
      });

      if (!oldAccount) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      const oldAmount = existingTransaction.amount;

      const restoredBalance =
        existingTransaction.type === "income"
          ? oldAccount.balance.sub(oldAmount)
          : oldAccount.balance.add(oldAmount);

      await tx.account.update({
        where: {
          id: oldAccount.id,
        },
        data: {
          balance: restoredBalance,
        },
      });
    }

    /*
     * 2. Valida a nova conta
     */
    let newAccount = null;

    if (input.accountId) {
      newAccount = await tx.account.findFirst({
        where: {
          id: input.accountId,
          userId: input.userId,
        },
      });

      if (!newAccount) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }
    }

    /*
     * 3. Valida a nova categoria
     */
    if (input.categoryId) {
      const category = await tx.category.findFirst({
        where: {
          id: input.categoryId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
      }
    }

    /*
     * 3.5. Valida o novo cartão
     */
    if (input.creditCardId) {
      const creditCard = await tx.creditCard.findFirst({
        where: {
          id: input.creditCardId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!creditCard) {
        throw new Error("CREDIT_CARD_NOT_FOUND");
      }
    }

    /*
     * 3.6. Valida o cartão cuja fatura está sendo paga
     */
    if (input.paidCreditCardId) {
      if (input.type !== "expense") {
        throw new Error("INVALID_PAID_CREDIT_CARD_TYPE");
      }

      const paidCreditCard = await tx.creditCard.findFirst({
        where: {
          id: input.paidCreditCardId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!paidCreditCard) {
        throw new Error("CREDIT_CARD_NOT_FOUND");
      }
    }

    /*
     * 3.7. Valida a conta fixa cujo pagamento está sendo vinculado
     */
    if (input.paidRecurringBillId) {
      if (input.type !== "expense") {
        throw new Error("INVALID_PAID_RECURRING_BILL_TYPE");
      }

      const paidRecurringBill = await tx.recurringBill.findFirst({
        where: {
          id: input.paidRecurringBillId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

      if (!paidRecurringBill) {
        throw new Error("RECURRING_BILL_NOT_FOUND");
      }
    }

    /*
     * 4. Aplica o impacto da nova transação
     */
    if (newAccount) {
      const newBalance =
        input.type === "income"
          ? newAccount.balance.add(amount)
          : newAccount.balance.sub(amount);

      await tx.account.update({
        where: {
          id: newAccount.id,
        },
        data: {
          balance: newBalance,
        },
      });
    }

    /*
     * 5. Atualiza a transação
     */
    return tx.transaction.update({
      where: {
        id: existingTransaction.id,
      },
      data: {
        description,
        amount,
        type: input.type,
        date: input.date,
        accountId: input.accountId ?? null,
        categoryId: input.categoryId ?? null,
        creditCardId: input.creditCardId ?? null,
        paidCreditCardId: input.paidCreditCardId ?? null,
        paidRecurringBillId: input.paidRecurringBillId ?? null,
      },
    });
  });
}

function collectExternalIds(items: { externalId: string | null }[]) {
  return items.flatMap((item) => (item.externalId ? [item.externalId] : []));
}

/**
 * Remove do lote as transações cujo `externalId` (FITID do OFX) já existe
 * no recurso de destino, ou que aparecem repetidas no próprio lote.
 * Transações sem `externalId` são sempre mantidas, pois não há como saber
 * se já foram importadas.
 */
function skipAlreadyImported<T extends { externalId: string | null }>(
  items: T[],
  existing: { externalId: string | null }[],
) {
  const seen = new Set(existing.map((item) => item.externalId));

  return items.filter((item) => {
    if (!item.externalId) {
      return true;
    }

    if (seen.has(item.externalId)) {
      return false;
    }

    seen.add(item.externalId);
    return true;
  });
}

export async function bulkCreateCreditCardTransactions(
  input: BulkCreateCreditCardTransactionsInput,
) {
  if (input.items.length === 0) {
    throw new Error("EMPTY_TRANSACTION_LIST");
  }

  const data = input.items.map((item) => {
    const description = item.description.trim();

    if (!description) {
      throw new Error("INVALID_DESCRIPTION");
    }

    if (!Number.isFinite(item.amount) || item.amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    if (item.type !== "income" && item.type !== "expense") {
      throw new Error("INVALID_TYPE");
    }

    if (Number.isNaN(item.date.getTime())) {
      throw new Error("INVALID_DATE");
    }

    return {
      description,
      amount: new Prisma.Decimal(item.amount),
      type: item.type,
      date: item.date,
      userId: input.userId,
      creditCardId: input.creditCardId,
      externalId: item.externalId?.trim() || null,
    };
  });

  return prisma.$transaction(async (tx) => {
    const creditCard = await tx.creditCard.findFirst({
      where: {
        id: input.creditCardId,
        userId: input.userId,
      },
      select: {
        id: true,
      },
    });

    if (!creditCard) {
      throw new Error("CREDIT_CARD_NOT_FOUND");
    }

    const existing = await tx.transaction.findMany({
      where: {
        creditCardId: creditCard.id,
        externalId: { in: collectExternalIds(data) },
      },
      select: { externalId: true },
    });

    const newData = skipAlreadyImported(data, existing);

    const { count } = await tx.transaction.createMany({
      data: newData,
    });

    return { count, skipped: data.length - newData.length };
  });
}

export async function bulkCreateAccountTransactions(
  input: BulkCreateAccountTransactionsInput,
) {
  if (input.items.length === 0) {
    throw new Error("EMPTY_TRANSACTION_LIST");
  }

  const data = input.items.map((item) => {
    const description = item.description.trim();

    if (!description) {
      throw new Error("INVALID_DESCRIPTION");
    }

    if (!Number.isFinite(item.amount) || item.amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    if (item.type !== "income" && item.type !== "expense") {
      throw new Error("INVALID_TYPE");
    }

    if (Number.isNaN(item.date.getTime())) {
      throw new Error("INVALID_DATE");
    }

    return {
      description,
      amount: new Prisma.Decimal(item.amount),
      type: item.type,
      date: item.date,
      userId: input.userId,
      accountId: input.accountId,
      externalId: item.externalId?.trim() || null,
    };
  });

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: {
        id: input.accountId,
        userId: input.userId,
      },
    });

    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    const existing = await tx.transaction.findMany({
      where: {
        accountId: account.id,
        externalId: { in: collectExternalIds(data) },
      },
      select: { externalId: true },
    });

    const newData = skipAlreadyImported(data, existing);

    // O saldo só recebe o impacto das transações realmente criadas —
    // as já importadas antes já foram aplicadas ao saldo naquela vez.
    const balanceDelta = newData.reduce(
      (delta, item) =>
        item.type === "income"
          ? delta.add(item.amount)
          : delta.sub(item.amount),
      new Prisma.Decimal(0),
    );

    await tx.account.update({
      where: { id: account.id },
      data: { balance: account.balance.add(balanceDelta) },
    });

    const { count } = await tx.transaction.createMany({
      data: newData,
    });

    return { count, skipped: data.length - newData.length };
  });
}

export async function deleteTransaction(userId: string, transactionId: string) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    if (transaction.accountId) {
      const account = await tx.account.findFirst({
        where: {
          id: transaction.accountId,
          userId,
        },
      });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      const newBalance =
        transaction.type === "income"
          ? account.balance.sub(transaction.amount)
          : account.balance.add(transaction.amount);

      await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          balance: newBalance,
        },
      });
    }

    await tx.transaction.delete({
      where: {
        id: transaction.id,
      },
    });

    return {
      success: true,
    };
  });
}
