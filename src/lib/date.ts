/**
 * Converte uma data no formato "yyyy-mm-dd" (o formato emitido pelo
 * DateInput) para meia-noite no fuso horário local, em vez de UTC.
 *
 * `new Date("yyyy-mm-dd")` interpreta a string como meia-noite UTC, que em
 * fusos negativos (ex.: UTC-3) formata como o dia anterior ao ser exibida
 * com `Intl.DateTimeFormat` no fuso local do servidor.
 */
export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
