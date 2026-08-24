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

export async function getAccounts(userId: string) {
  return prisma.account.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
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
