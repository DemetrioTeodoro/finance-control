/**
 * Últimos filtros usados em cada tela (transações, relatórios, contas
 * fixas), guardados em cookie para serem reaplicados quando o usuário volta
 * para a tela sem filtros na URL (ex.: pelo menu). Um cookie por tela, com
 * a query string dos filtros.
 *
 * Este módulo é usado pelo client (gravação); a leitura no server fica em
 * `saved-filters-server.ts`, que depende de `next/headers`.
 */
export type SavedFiltersScreen = "transacoes" | "relatorios" | "contas-fixas";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function savedFiltersCookieName(screen: SavedFiltersScreen) {
  return `filters-${screen}`;
}

/** Grava os filtros da tela. Query vazia apaga o cookie. */
export function saveFilters(screen: SavedFiltersScreen, query: string) {
  const name = savedFiltersCookieName(screen);

  document.cookie = query
    ? `${name}=${query}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`
    : `${name}=; path=/; max-age=0; samesite=lax`;
}
