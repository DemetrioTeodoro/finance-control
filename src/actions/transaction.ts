"use server";

import { auth } from "@/auth";
import {
  createTransaction as createTransactionService,
  updateTransaction as updateTransactionService,
} from "@/services/transaction";

export async function createTransaction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const description = formData.get("description")?.toString().trim();
  const amount = formData.get("amount")?.toString().trim();
  const type = formData.get("type")?.toString();
  const date = formData.get("date")?.toString();

  const accountId = formData.get("accountId")?.toString() || null;
  const categoryId = formData.get("categoryId")?.toString() || null;

  if (!description || !amount || !type || !date) {
    return {
      error: "Preencha todos os campos obrigatórios.",
    };
  }

  if (type !== "income" && type !== "expense") {
    return {
      error: "Tipo de transação inválido.",
    };
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return {
      error: "Informe um valor válido.",
    };
  }

  const transactionDate = new Date(date);

  if (Number.isNaN(transactionDate.getTime())) {
    return {
      error: "Data inválida.",
    };
  }

  try {
    await createTransactionService({
      userId: session.user.id,
      description,
      amount: numericAmount,
      type,
      date: transactionDate,
      accountId,
      categoryId,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_NOT_FOUND") {
        return {
          error: "Conta não encontrada.",
        };
      }

      if (error.message === "CATEGORY_NOT_FOUND") {
        return {
          error: "Categoria não encontrada.",
        };
      }

      if (error.message === "INVALID_AMOUNT") {
        return {
          error: "Informe um valor válido.",
        };
      }

      if (error.message === "INVALID_DESCRIPTION") {
        return {
          error: "Informe uma descrição válida.",
        };
      }
    }

    console.error("Erro ao criar transação:", error);

    return {
      error: "Não foi possível criar a transação.",
    };
  }
}

export async function updateTransaction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const transactionId = formData.get("transactionId")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const amount = formData.get("amount")?.toString().trim();
  const type = formData.get("type")?.toString();
  const date = formData.get("date")?.toString();

  const accountId = formData.get("accountId")?.toString() || null;
  const categoryId = formData.get("categoryId")?.toString() || null;

  if (!transactionId) {
    return {
      error: "Transação não encontrada.",
    };
  }

  if (!description || !amount || !type || !date) {
    return {
      error: "Preencha todos os campos obrigatórios.",
    };
  }

  if (type !== "income" && type !== "expense") {
    return {
      error: "Tipo de transação inválido.",
    };
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return {
      error: "Informe um valor válido.",
    };
  }

  const transactionDate = new Date(date);

  if (Number.isNaN(transactionDate.getTime())) {
    return {
      error: "Data inválida.",
    };
  }

  try {
    await updateTransactionService({
      userId: session.user.id,
      transactionId,
      description,
      amount: numericAmount,
      type,
      date: transactionDate,
      accountId,
      categoryId,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TRANSACTION_NOT_FOUND") {
        return {
          error: "Transação não encontrada.",
        };
      }

      if (error.message === "ACCOUNT_NOT_FOUND") {
        return {
          error: "Conta não encontrada.",
        };
      }

      if (error.message === "CATEGORY_NOT_FOUND") {
        return {
          error: "Categoria não encontrada.",
        };
      }

      if (error.message === "INVALID_AMOUNT") {
        return {
          error: "Informe um valor válido.",
        };
      }

      if (error.message === "INVALID_DESCRIPTION") {
        return {
          error: "Informe uma descrição válida.",
        };
      }
    }

    console.error("Erro ao atualizar transação:", error);

    return {
      error: "Não foi possível atualizar a transação.",
    };
  }
}
