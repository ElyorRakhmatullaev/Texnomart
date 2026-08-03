/**
 * Russian plural picker: `pluralRu(n, ["строка", "строки", "строк"])`.
 * Forms are [1, 2–4, 5+] — 11–14 always take the last form.
 */
export function pluralRu(
  n: number,
  [one, few, many]: [string, string, string]
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** «N строк» — rows/lines. */
export const LINE_FORMS: [string, string, string] = ["строка", "строки", "строк"];
/** «N позиций» — nomenclature positions. */
export const POSITION_FORMS: [string, string, string] = [
  "позиция",
  "позиции",
  "позиций",
];
