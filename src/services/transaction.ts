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
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
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
      },
    });
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
