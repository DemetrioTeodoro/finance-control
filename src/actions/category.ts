"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
} from "@/services/category";

export async function createCategory(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const name = formData.get("name")?.toString().trim();
  const color = formData.get("color")?.toString().trim() || null;

  if (!name) {
    return {
      error: "Informe o nome da categoria.",
    };
  }

  try {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId: session.user.id,
      },
    });

    if (existingCategory) {
      return {
        error: "Você já possui uma categoria com esse nome.",
      };
    }

    await prisma.category.create({
      data: {
        name,
        color,
        userId: session.user.id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao criar categoria:", error);

    return {
      error: "Não foi possível criar a categoria.",
    };
  }
}

export async function updateCategory(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const categoryId = formData.get("categoryId")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const color = formData.get("color")?.toString().trim() || null;

  if (!categoryId) {
    return {
      error: "Categoria não encontrada.",
    };
  }

  if (!name) {
    return {
      error: "Informe o nome da categoria.",
    };
  }

  try {
    await updateCategoryService({
      userId: session.user.id,
      categoryId,
      name,
      color,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return {
          error: "Categoria não encontrada.",
        };
      }

      if (error.message === "CATEGORY_EXISTS") {
        return {
          error: "Você já possui uma categoria com esse nome.",
        };
      }

      if (error.message === "INVALID_NAME") {
        return {
          error: "Informe o nome da categoria.",
        };
      }
    }

    console.error("Erro ao atualizar categoria:", error);

    return {
      error: "Não foi possível atualizar a categoria.",
    };
  }
}

export async function deleteCategory(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const categoryId = formData.get("categoryId")?.toString().trim();

  if (!categoryId) {
    return {
      error: "Categoria não encontrada.",
    };
  }

  try {
    await deleteCategoryService({
      userId: session.user.id,
      categoryId,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return {
          error: "Categoria não encontrada.",
        };
      }
    }

    console.error("Erro ao excluir categoria:", error);

    return {
      error: "Não foi possível excluir a categoria.",
    };
  }
}
