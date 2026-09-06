"use server";

import { auth } from "@/auth";
import { setValueVisibility } from "@/services/user-preferences";

export async function updateValueVisibility(visible: boolean) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Usuário não autenticado.",
    };
  }

  try {
    await setValueVisibility(session.user.id, visible);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao atualizar preferência de visibilidade:", error);

    return {
      error: "Não foi possível salvar a preferência.",
    };
  }
}
