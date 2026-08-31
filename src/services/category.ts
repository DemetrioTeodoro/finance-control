import { prisma } from "@/lib/prisma";

type CreateCategoryInput = {
  userId: string;
  name: string;
  color?: string | null;
};

type UpdateCategoryInput = {
  userId: string;
  categoryId: string;
  name: string;
  color?: string | null;
};

type DeleteCategoryInput = {
  userId: string;
  categoryId: string;
};

export async function getCategories(userId: string) {
  const categories = await prisma.category.findMany({
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
      name: "asc",
    },
  });

  return categories.map((category) => ({
    ...category,
    transactionCount: category._count.transactions,
  }));
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

export async function createCategory(input: CreateCategoryInput) {
  const name = input.name.trim();

  if (!name) {
    return {
      created: false,
      reason: "INVALID_NAME" as const,
    };
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      userId: input.userId,
      name,
    },
    select: {
      id: true,
    },
  });

  if (existingCategory) {
    return {
      created: false,
      reason: "CATEGORY_EXISTS" as const,
    };
  }

  await prisma.category.create({
    data: {
      name,
      color: input.color ?? null,
      userId: input.userId,
    },
  });

  return {
    created: true,
  };
}

export async function updateCategory(input: UpdateCategoryInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      userId: input.userId,
    },
  });

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      userId: input.userId,
      name,
      id: {
        not: category.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingCategory) {
    throw new Error("CATEGORY_EXISTS");
  }

  return prisma.category.update({
    where: {
      id: category.id,
    },
    data: {
      name,
      color: input.color ?? null,
    },
  });
}

export async function deleteCategory(input: DeleteCategoryInput) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.findFirst({
      where: {
        id: input.categoryId,
        userId: input.userId,
      },
    });

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    await tx.transaction.updateMany({
      where: {
        categoryId: category.id,
        userId: input.userId,
      },
      data: {
        categoryId: null,
      },
    });

    await tx.category.delete({
      where: {
        id: category.id,
      },
    });

    return {
      success: true,
    };
  });
}
