"use server";

import { auth } from "@/auth";
import {
  createAccount as createAccountService,
  updateAccount as updateAccountService,
} from "@/services/account";

export async function createAccount(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type")?.toString().trim();
  const balance = formData.get("balance")?.toString().trim();

  if (!name || !type || balance === undefined || balance === "") {
    return {
      error: "Preencha todos os campos.",
    };
  }

  const numericBalance = Number(balance);

  if (!Number.isFinite(numericBalance)) {
    return {
      error: "Informe um saldo válido.",
    };
  }

  try {
    await createAccountService({
      userId: session.user.id,
      name,
      type,
      balance: numericBalance,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_ACCOUNT") {
        return {
          error: "Informe o nome e o tipo da conta.",
        };
      }
    }

    console.error("Erro ao criar conta:", error);

    return {
      error: "Não foi possível criar a conta.",
    };
  }
}

export async function updateAccount(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const accountId = formData.get("accountId")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type")?.toString().trim();

  if (!accountId) {
    return {
      error: "Conta não encontrada.",
    };
  }

  if (!name || !type) {
    return {
      error: "Preencha todos os campos.",
    };
  }

  try {
    await updateAccountService({
      userId: session.user.id,
      accountId,
      name,
      type,
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

      if (error.message === "INVALID_ACCOUNT") {
        return {
          error: "Informe o nome e o tipo da conta.",
        };
      }
    }

    console.error("Erro ao atualizar conta:", error);

    return {
      error: "Não foi possível atualizar a conta.",
    };
  }
}
