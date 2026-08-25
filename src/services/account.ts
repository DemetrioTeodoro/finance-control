import { prisma } from "@/lib/prisma";

type CreateAccountInput = {
  userId: string;
  name: string;
  type: string;
  balance: number;
};

type UpdateAccountInput = {
  userId: string;
  accountId: string;
  name: string;
  type: string;
};

type DeleteAccountInput = {
  userId: string;
  accountId: string;
  mode?: "unlink" | "delete-transactions";
};

export async function getAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
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

  return accounts.map((account) => ({
    ...account,
    transactionCount: account._count.transactions,
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

export async function createAccount(input: CreateAccountInput) {
  const name = input.name.trim();
  const type = input.type.trim();

  if (!name || !type) {
    throw new Error("INVALID_ACCOUNT");
  }

  return prisma.account.create({
    data: {
      name,
      type,
      balance: input.balance,
      userId: input.userId,
    },
  });
}

export async function updateAccount(input: UpdateAccountInput) {
  const name = input.name.trim();
  const type = input.type.trim();

  if (!name || !type) {
    throw new Error("INVALID_ACCOUNT");
  }

  const account = await prisma.account.findFirst({
    where: {
      id: input.accountId,
      userId: input.userId,
    },
  });

  if (!account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  return prisma.account.update({
    where: {
      id: account.id,
    },
    data: {
      name,
      type,
    },
  });
}

export async function deleteAccount(input: DeleteAccountInput) {
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

    const transactions = await tx.transaction.findMany({
      where: {
        accountId: account.id,
        userId: input.userId,
      },
    });

    if (transactions.length > 0) {
      if (input.mode === "unlink") {
        await tx.transaction.updateMany({
          where: {
            accountId: account.id,
            userId: input.userId,
          },
          data: {
            accountId: null,
          },
        });
      } else if (input.mode === "delete-transactions") {
        let balance = account.balance;

        for (const transaction of transactions) {
          balance =
            transaction.type === "income"
              ? balance.sub(transaction.amount)
              : balance.add(transaction.amount);
        }

        await tx.account.update({
          where: {
            id: account.id,
          },
          data: {
            balance,
          },
        });

        await tx.transaction.deleteMany({
          where: {
            accountId: account.id,
            userId: input.userId,
          },
        });
      } else {
        throw new Error("ACCOUNT_HAS_TRANSACTIONS");
      }
    }

    await tx.account.delete({
      where: {
        id: account.id,
      },
    });

    return {
      success: true,
    };
  });
}
