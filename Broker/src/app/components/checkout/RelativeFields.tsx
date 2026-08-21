import { type SyntheticEvent } from "react"
import { Trash2 } from "lucide-react"
import { Input } from "@texnomart/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@texnomart/ui/select"
import { RELATION_KINDS } from "@/lib/broker-mock-data"

// Маска телефона: храним только «сырые» цифры после кода 998 (макс. 9),
// формат для отображения/сабмита собираем из них.
//
// Разбор всей строки на каждое нажатие (а не диффом с предыдущим значением) —
// нужно аккуратно отличать «стирание цифр пользователя» от «стирания самого
// префикса +998» (иначе backspace на пустом поле «+998» → «+99» и наивная
// проверка startsWith("998") не срабатывает — в поле подставляются фантомные
// цифры). Правило: если все цифры строки начинаются с "998" — за префиксом
// остались настоящие цифры пользователя; если сама строка цифр — префикс
// "998" ещё не «дописан» (стирание), пользовательских цифр нет; иначе (вставка
// локального номера без кода страны) — цифры пользователя взяты как есть.
export function extractDigits(value: string): string {
  const allDigits = value.replace(/\D/g, "")
  if (allDigits.startsWith("998")) return allDigits.slice(3, 12)
  if ("998".startsWith(allDigits)) return ""
  return allDigits.slice(0, 9)
}

export function digitsFromPhone(phone: string | undefined): string {
  return extractDigits(phone ?? "")
}

// extractDigits разбирает всю строку заново на каждое нажатие и опознаёт
// префикс "+998" только по факту, что он идёт первым — если курсор оказался
// ЛЕВЕЕ префикса (Home/стрелка влево/клик в начало поля) и пользователь
// печатает там, вставленная цифра встаёт перед "+998", эвристика перестаёт
// узнавать префикс и весь конкатенированный набор цифр (включая цифры
// префикса) трактуется как ввод пользователя — номер “едет”. Не даём курсору
// попасть левее первой редактируемой позиции: пока цифр нет, это конец
// строки "+998" (позиция 4); как только есть хоть одна цифра, строка — уже
// "+998 …" и редактируемая зона начинается сразу за пробелом (позиция 5).
export function clampPhoneCursor(e: SyntheticEvent<HTMLInputElement>) {
  const el = e.currentTarget
  const minPos = extractDigits(el.value).length === 0 ? 4 : 5
  const start = el.selectionStart ?? minPos
  const end = el.selectionEnd ?? minPos
  if (start < minPos || end < minPos) {
    el.setSelectionRange(Math.max(start, minPos), Math.max(end, minPos))
  }
}

export function formatUzPhone(digits: string): string {
  let out = "+998"
  if (digits.length > 0) out += " " + digits.slice(0, 2)
  if (digits.length > 2) out += " " + digits.slice(2, 5)
  if (digits.length > 5) out += " " + digits.slice(5, 7)
  if (digits.length > 7) out += " " + digits.slice(7, 9)
  return out
}

export interface RelativeDraft {
  type: string
  phoneDigits: string
  name: string
}

export interface RelativeFieldsProps {
  index: number
  value: RelativeDraft
  onChange: (next: RelativeDraft) => void
  onRemove: () => void
  removable: boolean
  error?: string
}

export function RelativeFields({ index, value, onChange, onRemove, removable, error }: RelativeFieldsProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">Родственник {index + 1}</h3>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Удалить родственника ${index + 1}`}
            className="flex size-11 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Вид родства</label>
          <Select value={value.type} onValueChange={(type) => onChange({ ...value, type })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              {RELATION_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">Имя</label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Например, Дилшод"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">Номер телефона</label>
          <Input
            inputMode="numeric"
            value={formatUzPhone(value.phoneDigits)}
            onChange={(e) => onChange({ ...value, phoneDigits: extractDigits(e.target.value) })}
            onSelect={clampPhoneCursor}
            onClick={clampPhoneCursor}
            onKeyUp={clampPhoneCursor}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
