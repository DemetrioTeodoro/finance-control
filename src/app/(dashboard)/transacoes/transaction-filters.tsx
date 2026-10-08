"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { saveFilters } from "@/lib/saved-filters";

type Period = "this-month" | "last-month" | "3-months" | "custom";

const PRESETS: { value: Period; label: string }[] = [
  { value: "this-month", label: "Este mês" },
  { value: "last-month", label: "Mês passado" },
  { value: "3-months", label: "Últimos 3 meses" },
];

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type CreditCard = {
  id: string;
  name: string;
};

type TransactionFiltersProps = {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  defaultValues: {
    accountId: string;
    categoryId: string;
    creditCardId: string;
    type: string;
    startDate: string;
    endDate: string;
  };
  period: Period | null;
  hasActiveFilters: boolean;
};

export function TransactionFilters({
  accounts,
  categories,
  creditCards,
  defaultValues,
  period,
  hasActiveFilters,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  function navigate(params: URLSearchParams) {
    const query = params.toString();

    saveFilters("transacoes", query);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function buildBaseParams(formData: FormData) {
    const params = new URLSearchParams();

    for (const name of ["accountId", "categoryId", "creditCardId", "type"]) {
      const value = formData.get(name)?.toString();

      if (value) params.set(name, value);
    }

    return params;
  }

  function handleSubmit(formData: FormData) {
    const params = buildBaseParams(formData);

    const startDate = formData.get("startDate")?.toString() ?? "";
    const endDate = formData.get("endDate")?.toString() ?? "";

    const datesChanged =
      startDate !== defaultValues.startDate ||
      endDate !== defaultValues.endDate;

    // Atalho ativo e datas intocadas: mantém o atalho (relativo a hoje) em
    // vez de congelar as datas que ele mostrou nos campos.
    if (period && period !== "custom" && !datesChanged) {
      params.set("period", period);
    } else if (startDate || endDate) {
      params.set("period", "custom");
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }

    navigate(params);
  }

  function handlePreset(value: Period) {
    if (!formRef.current) {
      return;
    }

    const params = buildBaseParams(new FormData(formRef.current));

    params.set("period", value);

    navigate(params);
  }

  function handleClear() {
    navigate(new URLSearchParams());
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
    >
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={period === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Conta</label>

          <select
            name="accountId"
            defaultValue={defaultValues.accountId}
            className="flex h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as contas</option>

            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Categoria</label>

          <select
            name="categoryId"
            defaultValue={defaultValues.categoryId}
            className="flex h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Cartão</label>

          <select
            name="creditCardId"
            defaultValue={defaultValues.creditCardId}
            className="flex h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos os cartões</option>

            {creditCards.map((creditCard) => (
              <option key={creditCard.id} value={creditCard.id}>
                {creditCard.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Tipo</label>

          <select
            name="type"
            defaultValue={defaultValues.type}
            className="flex h-10 w-36 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">De</label>

          <DateInput
            name="startDate"
            defaultValue={defaultValues.startDate}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Até</label>

          <DateInput
            name="endDate"
            defaultValue={defaultValues.endDate}
            className="w-40"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </form>
  );
}
