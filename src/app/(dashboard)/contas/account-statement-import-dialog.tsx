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

type AccountOption = {
  id: string;
  name: string;
};

type AccountStatementImportDialogProps = {
  open: boolean;
  accountOptions: AccountOption[];
  defaultAccountId?: string;
  onOpenChange: (open: boolean) => void;
};

type ProcessarExtratoSuccess = {
  total_transacoes: number;
  enviadas_com_sucesso: number;
  mensagem: string;
};

type ProcessarExtratoError = {
  detail?: string;
};

export function AccountStatementImportDialog({
  open,
  accountOptions,
  defaultAccountId,
  onOpenChange,
}: AccountStatementImportDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accountSelectRef = useRef<HTMLSelectElement>(null);

  const [importing, setImporting] = useState(false);

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    const accountId = accountSelectRef.current?.value ?? "";

    if (!accountId) {
      toast.error("Selecione a conta para vincular o extrato.");
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
      formData.set("accountId", accountId);

      const response = await fetch("/python-backend/processar-extrato", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => null)) as ProcessarExtratoError | null;

        toast.error(
          errorBody?.detail ?? "Não foi possível importar o extrato.",
        );
        return;
      }

      const result = (await response.json()) as ProcessarExtratoSuccess;

      toast.success(result.mensagem);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao importar extrato:", error);

      toast.error("Não foi possível importar o extrato.");
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
          <DialogTitle>Importar extrato</DialogTitle>

          <DialogDescription>
            Envie o arquivo OFX do extrato bancário para importar as
            transações automaticamente e vinculá-las à conta escolhida. O
            saldo da conta será atualizado de acordo com as transações
            importadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <select
            ref={accountSelectRef}
            defaultValue={defaultAccountId ?? ""}
            disabled={importing}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecione a conta
            </option>

            {accountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
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
