"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CreditCardOption = {
  id: string;
  name: string;
};

type CreditCardInvoiceImportDialogProps = {
  open: boolean;
  creditCardOptions: CreditCardOption[];
  defaultCreditCardId?: string;
  onOpenChange: (open: boolean) => void;
};

type ProcessarFaturaSuccess = {
  total_transacoes: number;
  enviadas_com_sucesso: number;
  mensagem: string;
};

type ProcessarFaturaError = {
  detail?: string;
};

export function CreditCardInvoiceImportDialog({
  open,
  creditCardOptions,
  defaultCreditCardId,
  onOpenChange,
}: CreditCardInvoiceImportDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const creditCardSelectRef = useRef<HTMLSelectElement>(null);

  const [importing, setImporting] = useState(false);

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    const creditCardId = creditCardSelectRef.current?.value ?? "";

    if (!creditCardId) {
      toast.error("Selecione o cartão para vincular a fatura.");
      return;
    }

    if (!file) {
      toast.error("Selecione um arquivo .ofx.");
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();

      formData.set("file", file);
      formData.set("creditCardId", creditCardId);

      const response = await fetch("/python-backend/processar-fatura", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => null)) as ProcessarFaturaError | null;

        toast.error(
          errorBody?.detail ?? "Não foi possível importar a fatura.",
        );
        return;
      }

      const result = (await response.json()) as ProcessarFaturaSuccess;

      toast.success(result.mensagem);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao importar fatura:", error);

      toast.error("Não foi possível importar a fatura.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!importing) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar fatura</DialogTitle>

          <DialogDescription>
            Envie o arquivo OFX da fatura para importar as transações
            automaticamente e vinculá-las ao cartão escolhido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <select
            ref={creditCardSelectRef}
            defaultValue={defaultCreditCardId ?? ""}
            disabled={importing}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecione o cartão
            </option>

            {creditCardOptions.map((creditCard) => (
              <option key={creditCard.id} value={creditCard.id}>
                {creditCard.name}
              </option>
            ))}
          </select>

          <Input
            ref={fileInputRef}
            type="file"
            accept=".ofx"
            disabled={importing}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>

          <Button onClick={handleImport} disabled={importing}>
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
