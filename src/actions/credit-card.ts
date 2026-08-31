"use server";

import { auth } from "@/auth";
import {
  createCreditCard as createCreditCardService,
  updateCreditCard as updateCreditCardService,
  deleteCreditCard as deleteCreditCardService,
} from "@/services/credit-card";

function parseDay(value: FormDataEntryValue | null) {
  const parsed = Number(value?.toString().trim());

  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function createCreditCard(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const name = formData.get("name")?.toString().trim();
  const limitValue = formData.get("limit")?.toString().trim();
  const closingDay = parseDay(formData.get("closingDay"));
  const dueDay = parseDay(formData.get("dueDay"));

  if (!name) {
    return {
      error: "Informe o nome do cartão.",
    };
  }

  const limit = limitValue ? Number(limitValue) : null;

  if (limitValue && !Number.isFinite(limit)) {
    return {
      error: "Informe um limite válido.",
    };
  }

  try {
    await createCreditCardService({
      userId: session.user.id,
      name,
      limit,
      closingDay,
      dueDay,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_NAME") {
        return {
          error: "Informe o nome do cartão.",
        };
      }

      if (error.message === "INVALID_CLOSING_DAY") {
        return {
          error: "Informe um dia de fechamento válido (1 a 31).",
        };
      }

      if (error.message === "INVALID_DUE_DAY") {
        return {
          error: "Informe um dia de vencimento válido (1 a 31).",
        };
      }
    }

    console.error("Erro ao criar cartão:", error);

    return {
      error: "Não foi possível criar o cartão.",
    };
  }
}

export async function updateCreditCard(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const creditCardId = formData.get("creditCardId")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const limitValue = formData.get("limit")?.toString().trim();
  const closingDay = parseDay(formData.get("closingDay"));
  const dueDay = parseDay(formData.get("dueDay"));

  if (!creditCardId) {
    return {
      error: "Cartão não encontrado.",
    };
  }

  if (!name) {
    return {
      error: "Informe o nome do cartão.",
    };
  }

  const limit = limitValue ? Number(limitValue) : null;

  if (limitValue && !Number.isFinite(limit)) {
    return {
      error: "Informe um limite válido.",
    };
  }

  try {
    await updateCreditCardService({
      userId: session.user.id,
      creditCardId,
      name,
      limit,
      closingDay,
      dueDay,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CREDIT_CARD_NOT_FOUND") {
        return {
          error: "Cartão não encontrado.",
        };
      }

      if (error.message === "INVALID_NAME") {
        return {
          error: "Informe o nome do cartão.",
        };
      }

      if (error.message === "INVALID_CLOSING_DAY") {
        return {
          error: "Informe um dia de fechamento válido (1 a 31).",
        };
      }

      if (error.message === "INVALID_DUE_DAY") {
        return {
          error: "Informe um dia de vencimento válido (1 a 31).",
        };
      }
    }

    console.error("Erro ao atualizar cartão:", error);

    return {
      error: "Não foi possível atualizar o cartão.",
    };
  }
}

export async function deleteCreditCard(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  const creditCardId = formData.get("creditCardId")?.toString().trim();

  if (!creditCardId) {
    return {
      error: "Cartão não encontrado.",
    };
  }

  try {
    await deleteCreditCardService({
      userId: session.user.id,
      creditCardId,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CREDIT_CARD_NOT_FOUND") {
        return {
          error: "Cartão não encontrado.",
        };
      }
    }

    console.error("Erro ao excluir cartão:", error);

    return {
      error: "Não foi possível excluir o cartão.",
    };
  }
}
