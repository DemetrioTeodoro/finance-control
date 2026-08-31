"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";

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
  hasActiveFilters: boolean;
};

export function TransactionFilters({
  accounts,
  categories,
  creditCards,
  defaultValues,
  hasActiveFilters,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(formData: FormData) {
    const params = new URLSearchParams();

    const accountId = formData.get("accountId")?.toString();
    const categoryId = formData.get("categoryId")?.toString();
    const creditCardId = formData.get("creditCardId")?.toString();
    const type = formData.get("type")?.toString();
    const startDate = formData.get("startDate")?.toString();
    const endDate = formData.get("endDate")?.toString();

    if (accountId) params.set("accountId", accountId);
    if (categoryId) params.set("categoryId", categoryId);
    if (creditCardId) params.set("creditCardId", creditCardId);
    if (type) params.set("type", type);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
    >
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
            onClick={() => router.push(pathname)}
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </form>
  );
}
