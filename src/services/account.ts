import { prisma } from "@/lib/prisma";

type CreateAccountInput = {
  userId: string;
  name: string;
  type: string;
  balance: number;
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
    throw new Error("Nome e tipo da conta são obrigatórios.");
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
