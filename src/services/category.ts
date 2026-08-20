import { prisma } from "@/lib/prisma";

type CreateCategoryInput = {
  userId: string;
  name: string;
  color?: string | null;
};

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: {
      userId,
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
