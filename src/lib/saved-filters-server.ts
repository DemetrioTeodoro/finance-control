import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  savedFiltersCookieName,
  type SavedFiltersScreen,
} from "@/lib/saved-filters";

/**
 * Chamado no início do `page.tsx`: se a URL veio sem nenhum filtro e há
 * filtros salvos para a tela, redireciona para eles.
 */
export async function restoreSavedFilters(
  screen: SavedFiltersScreen,
  params: Record<string, string | undefined>,
) {
  if (Object.keys(params).length > 0) {
    return;
  }

  const cookieStore = await cookies();
  const savedFilters = cookieStore.get(savedFiltersCookieName(screen))?.value;

  if (savedFilters) {
    redirect(`/${screen}?${savedFilters}`);
  }
}
