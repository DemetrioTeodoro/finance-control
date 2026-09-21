"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import {
  confirmRecurringBillPayment,
  unconfirmRecurringBillPayment,
} from "@/actions/recurring-bill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TransactionOption = {
  id: string;
  description: string;
  amount: number;
  date: Date;
};

type RecurringBillMonthCellProps = {
  recurringBillId: string;
  billName: string;
  year: number;
  month: number;
  monthLabel: string;
  paid: boolean;
  linkedTransaction: TransactionOption | null;
  transactionOptions: TransactionOption[];
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

export function RecurringBillMonthCell({
  recurringBillId,
  billName,
  year,
  month,
  monthLabel,
  paid,
  linkedTransaction,
  transactionOptions,
}: RecurringBillMonthCellProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleConfirm(formData: FormData) {
    setSaving(true);

    try {
      const result = await confirmRecurringBillPayment(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Pagamento confirmado.");

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao confirmar pagamento da conta fixa:", error);

      toast.error("Não foi possível confirmar o pagamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnconfirm() {
    setSaving(true);

    try {
      const formData = new FormData();

      formData.set("recurringBillId", recurringBillId);
      formData.set("year", String(year));
      formData.set("month", String(month));

      const result = await unconfirmRecurringBillPayment(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Confirmação desfeita.");

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao desfazer confirmação da conta fixa:", error);

      toast.error("Não foi possível desfazer a confirmação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${billName} · ${monthLabel}`}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          paid
            ? "bg-emerald-600/15 text-emerald-600 hover:bg-emerald-600/25"
            : "bg-muted text-muted-foreground hover:bg-muted/70"
        }`}
      >
        {paid ? <Check size={16} /> : <X size={16} />}
      </button>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) {
            setOpen(value);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {billName} · {monthLabel}
            </DialogTitle>

            <DialogDescription>
              {paid
                ? "Esta conta já está marcada como paga neste mês."
                : "Confirme o pagamento e, se quiser, vincule a transação correspondente."}
            </DialogDescription>
          </DialogHeader>

          {paid ? (
            <div className="space-y-4">
              {linkedTransaction ? (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium">
                    {linkedTransaction.description}
                  </p>

                  <p className="text-muted-foreground">
                    {shortDate.format(linkedTransaction.date)} ·{" "}
                    {currency.format(linkedTransaction.amount)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Confirmado manualmente, sem transação vinculada.
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Fechar
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleUnconfirm}
                  disabled={saving}
                >
                  {saving ? "Desfazendo..." : "Desfazer confirmação"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form action={handleConfirm} className="space-y-4">
              <input
                type="hidden"
                name="recurringBillId"
                value={recurringBillId}
              />
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />

              <select
                name="transactionId"
                disabled={saving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Confirmar sem vincular transação</option>

                {transactionOptions.map((transaction) => (
                  <option key={transaction.id} value={transaction.id}>
                    {shortDate.format(transaction.date)} ·{" "}
                    {transaction.description} ·{" "}
                    {currency.format(transaction.amount)}
                  </option>
                ))}
              </select>

              {transactionOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma despesa encontrada nesse mês para vincular.
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Confirmando..." : "Confirmar pagamento"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
