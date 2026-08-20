"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
