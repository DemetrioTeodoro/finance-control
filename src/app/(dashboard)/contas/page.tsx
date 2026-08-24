import { auth } from "@/auth";
import { getAccounts } from "@/services/account";
import { AccountForm } from "./account-form";
import { AccountEditButton } from "./account-edit-button";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const accounts = await getAccounts(session.user.id);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas</h1>

          <p className="text-muted-foreground">
            Gerencie suas contas financeiras
          </p>
        </div>

        <AccountForm />
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui nenhuma conta.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold">{account.name}</h2>

              <p className="text-sm text-muted-foreground">{account.type}</p>

              <p className="mt-4 text-2xl font-bold">
                {currency.format(Number(account.balance))}
              </p>

              <div className="mt-4">
                <AccountEditButton
                  account={{
                    id: account.id,
                    name: account.name,
                    type: account.type,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
