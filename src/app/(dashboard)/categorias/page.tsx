import { auth } from "@/auth";
import { getCategories } from "@/services/category";
import { CategoryForm } from "./category-form";
import { CategoryEditButton } from "./category-edit-button";
import { CategoryDeleteButton } from "./category-delete-button";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const categories = await getCategories(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>

          <p className="text-muted-foreground">
            Organize suas receitas e despesas
          </p>
        </div>

        <CategoryForm />
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui nenhuma categoria.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: category.color ?? "#64748b",
                  }}
                />

                <span className="min-w-0 flex-1 truncate font-medium">
                  {category.name}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <CategoryEditButton
                  category={{
                    id: category.id,
                    name: category.name,
                    color: category.color,
                  }}
                />

                <CategoryDeleteButton
                  category={{
                    id: category.id,
                    name: category.name,
                  }}
                  hasTransactions={category.transactionCount > 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
