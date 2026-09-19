import { NextRequest, NextResponse } from "next/server";

import { checkRecurringBillsForReminders } from "@/services/recurring-bill";

/**
 * Chamado 1x/dia pelo Vercel Cron (ver `crons` em vercel.json). A Vercel
 * envia automaticamente `Authorization: Bearer ${CRON_SECRET}` quando essa
 * env var está configurada no projeto — validamos aqui para que a rota não
 * possa ser disparada por qualquer requisição externa.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const result = await checkRecurringBillsForReminders();

  return NextResponse.json(result);
}
