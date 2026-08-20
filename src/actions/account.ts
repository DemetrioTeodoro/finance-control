"use server";

import { auth } from "@/auth";
import { createAccount as createAccountService } from "@/services/account";

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
    console.error("Erro ao criar conta:", error);

    return {
      error: "Não foi possível criar a conta.",
    };
  }
}
