type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envia e-mail via API HTTP do Resend (sem SDK, para não adicionar
 * dependência nova só por isso). Requer RESEND_API_KEY e, opcionalmente,
 * RESEND_FROM_EMAIL (padrão: sandbox do Resend, que só funciona em dev/teste).
 */
export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY não configurada; e-mail não enviado.");
    return { success: false };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Falha ao enviar e-mail via Resend:", errorBody);
    return { success: false };
  }

  return { success: true };
}
