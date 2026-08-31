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
