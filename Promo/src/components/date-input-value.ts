/**
 * yyyy-mm-dd ⇄ local-tz `Date` — мост между строковым состоянием фильтров и
 * `DatePickerField` / `DateRangeFilter`.
 *
 * Раньше в этих местах стоял нативный `<input type="date">`, и состояние уже
 * хранилось строкой. Замена поля на оформленный компонент состояние не трогает:
 * наружу по-прежнему уходит та же строка, меняется только вид контрола.
 *
 * Разбор идёт через `T00:00:00` намеренно: `new Date("2026-09-11")` трактуется
 * как UTC-полночь, и восточнее Гринвича дата уезжает на сутки назад.
 */
export function parseInputDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
