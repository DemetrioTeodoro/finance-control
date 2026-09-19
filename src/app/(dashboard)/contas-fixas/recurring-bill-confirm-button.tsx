"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  confirmRecurringBillPayment,
  unconfirmRecurringBillPayment,
} from "@/actions/recurring-bill";
import { Button } from "@/components/ui/button";

type RecurringBillConfirmButtonProps = {
  recurringBillId: string;
  year: number;
  month: number;
  paid: boolean;
};

export function RecurringBillConfirmButton({
  recurringBillId,
  year,
  month,
  paid,
}: RecurringBillConfirmButtonProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);

    try {
      const formData = new FormData();

      formData.set("recurringBillId", recurringBillId);
      formData.set("year", String(year));
      formData.set("month", String(month));

      const result = paid
        ? await unconfirmRecurringBillPayment(formData)
        : await confirmRecurringBillPayment(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        paid ? "Confirmação desfeita." : "Pagamento confirmado.",
      );

      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar confirmação de pagamento:", error);

      toast.error("Não foi possível atualizar a confirmação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      variant={paid ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={saving}
    >
      {saving
        ? "Salvando..."
        : paid
          ? "Desfazer confirmação"
          : "Confirmar pagamento"}
    </Button>
  );
}
