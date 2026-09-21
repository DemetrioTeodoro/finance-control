"use server";

import { auth } from "@/auth";
import {
  createRecurringBill as createRecurringBillService,
  updateRecurringBill as updateRecurringBillService,
  deleteRecurringBill as deleteRecurringBillService,
  confirmRecurringBillPayment as confirmRecurringBillPaymentService,
  unconfirmRecurringBillPayment as unconfirmRecurringBillPaymentService,
} from "@/services/recurring-bill";

function parseDay(value: FormDataEntryValue | null) {
  const parsed = Number(value?.toString().trim());

  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function createRecurringBill(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  const name = formData.get("name")?.toString().trim();
  const expectedAmountValue = formData.get("expectedAmount")?.toString().trim();
  const dueDay = parseDay(formData.get("dueDay"));
  const categoryId = formData.get("categoryId")?.toString().trim() || null;

  if (!name) {
    return { error: "Informe o nome da conta fixa." };
  }

  const expectedAmount = expectedAmountValue ? Number(expectedAmountValue) : null;

  if (expectedAmountValue && !Number.isFinite(expectedAmount)) {
    return { error: "Informe um valor esperado válido." };
  }

  try {
    await createRecurringBillService({
      userId: session.user.id,
      name,
      expectedAmount,
      dueDay,
      categoryId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_NAME") {
        return { error: "Informe o nome da conta fixa." };
      }

      if (error.message === "INVALID_DUE_DAY") {
        return { error: "Informe um dia de vencimento válido (1 a 31)." };
      }

      if (error.message === "CATEGORY_NOT_FOUND") {
        return { error: "Categoria não encontrada." };
      }
    }

    console.error("Erro ao criar conta fixa:", error);

    return { error: "Não foi possível criar a conta fixa." };
  }
}

export async function updateRecurringBill(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  const recurringBillId = formData.get("recurringBillId")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const expectedAmountValue = formData.get("expectedAmount")?.toString().trim();
  const dueDay = parseDay(formData.get("dueDay"));
  const categoryId = formData.get("categoryId")?.toString().trim() || null;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!recurringBillId) {
    return { error: "Conta fixa não encontrada." };
  }

  if (!name) {
    return { error: "Informe o nome da conta fixa." };
  }

  const expectedAmount = expectedAmountValue ? Number(expectedAmountValue) : null;

  if (expectedAmountValue && !Number.isFinite(expectedAmount)) {
    return { error: "Informe um valor esperado válido." };
  }

  try {
    await updateRecurringBillService({
      userId: session.user.id,
      recurringBillId,
      name,
      expectedAmount,
      dueDay,
      categoryId,
      active,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RECURRING_BILL_NOT_FOUND") {
        return { error: "Conta fixa não encontrada." };
      }

      if (error.message === "INVALID_NAME") {
        return { error: "Informe o nome da conta fixa." };
      }

      if (error.message === "INVALID_DUE_DAY") {
        return { error: "Informe um dia de vencimento válido (1 a 31)." };
      }

      if (error.message === "CATEGORY_NOT_FOUND") {
        return { error: "Categoria não encontrada." };
      }
    }

    console.error("Erro ao atualizar conta fixa:", error);

    return { error: "Não foi possível atualizar a conta fixa." };
  }
}

export async function deleteRecurringBill(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  const recurringBillId = formData.get("recurringBillId")?.toString().trim();

  if (!recurringBillId) {
    return { error: "Conta fixa não encontrada." };
  }

  try {
    await deleteRecurringBillService({
      userId: session.user.id,
      recurringBillId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "RECURRING_BILL_NOT_FOUND") {
      return { error: "Conta fixa não encontrada." };
    }

    console.error("Erro ao excluir conta fixa:", error);

    return { error: "Não foi possível excluir a conta fixa." };
  }
}

export async function confirmRecurringBillPayment(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  const recurringBillId = formData.get("recurringBillId")?.toString().trim();
  const year = parseDay(formData.get("year"));
  const month = parseDay(formData.get("month"));

  if (!recurringBillId || !Number.isFinite(year) || !Number.isFinite(month)) {
    return { error: "Conta fixa não encontrada." };
  }

  const transactionId = formData.get("transactionId")?.toString().trim() || null;

  try {
    await confirmRecurringBillPaymentService({
      userId: session.user.id,
      recurringBillId,
      year,
      month,
      transactionId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RECURRING_BILL_NOT_FOUND") {
        return { error: "Conta fixa não encontrada." };
      }

      if (error.message === "TRANSACTION_NOT_FOUND") {
        return { error: "Transação não encontrada." };
      }
    }

    console.error("Erro ao confirmar pagamento da conta fixa:", error);

    return { error: "Não foi possível confirmar o pagamento." };
  }
}

export async function unconfirmRecurringBillPayment(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  const recurringBillId = formData.get("recurringBillId")?.toString().trim();
  const year = parseDay(formData.get("year"));
  const month = parseDay(formData.get("month"));

  if (!recurringBillId || !Number.isFinite(year) || !Number.isFinite(month)) {
    return { error: "Conta fixa não encontrada." };
  }

  try {
    await unconfirmRecurringBillPaymentService({
      userId: session.user.id,
      recurringBillId,
      year,
      month,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "RECURRING_BILL_NOT_FOUND") {
      return { error: "Conta fixa não encontrada." };
    }

    console.error("Erro ao desfazer confirmação da conta fixa:", error);

    return { error: "Não foi possível desfazer a confirmação." };
  }
}
