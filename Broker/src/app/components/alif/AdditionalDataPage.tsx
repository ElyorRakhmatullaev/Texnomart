import { useState } from "react"
import { useNavigate } from "react-router"
import { addMonths, format } from "date-fns"
import { Input } from "@texnomart/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@texnomart/ui/select"
import { Button } from "@texnomart/ui/button"
import { useScoringFlow, type AdditionalData } from "@/app/scoring-flow"
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
function extractDigits(value: string): string {
  const allDigits = value.replace(/\D/g, "")
  if (allDigits.startsWith("998")) return allDigits.slice(3, 12)
  if ("998".startsWith(allDigits)) return ""
  return allDigits.slice(0, 9)
}

function digitsFromPhone(phone: string | undefined): string {
  return extractDigits(phone ?? "")
}

function formatUzPhone(digits: string): string {
  let out = "+998"
  if (digits.length > 0) out += " " + digits.slice(0, 2)
  if (digits.length > 2) out += " " + digits.slice(2, 5)
  if (digits.length > 5) out += " " + digits.slice(5, 7)
  if (digits.length > 7) out += " " + digits.slice(7, 9)
  return out
}

function defaultDebitDate(): string {
  return format(addMonths(new Date(), 1), "yyyy-MM-dd")
}

interface TrusteeFieldsProps {
  title: string
  phoneDigits: string
  onPhoneChange: (digits: string) => void
  relation: string
  onRelationChange: (relation: string) => void
  error?: string
}

function TrusteeFields({ title, phoneDigits, onPhoneChange, relation, onRelationChange, error }: TrusteeFieldsProps) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Номер телефона</label>
          <Input
            value={formatUzPhone(phoneDigits)}
            onChange={(e) => onPhoneChange(extractDigits(e.target.value))}
            placeholder="+998 __ ___ __ __"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Вид родства</label>
          <Select value={relation || undefined} onValueChange={onRelationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите вид родства" />
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
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function AdditionalDataPage() {
  const { state, saveAdditionalData } = useScoringFlow()
  const navigate = useNavigate()

  const [t1Digits, setT1Digits] = useState(() => digitsFromPhone(state.additionalData?.trustee1.phone))
  const [t1Relation, setT1Relation] = useState(state.additionalData?.trustee1.relation ?? "")
  const [t2Digits, setT2Digits] = useState(() => digitsFromPhone(state.additionalData?.trustee2?.phone))
  const [t2Relation, setT2Relation] = useState(state.additionalData?.trustee2?.relation ?? "")
  const [debitDate, setDebitDate] = useState(() => state.additionalData?.debitDate ?? defaultDebitDate())

  const t1Complete = t1Digits.length === 9
  const t1Valid = t1Complete && t1Relation !== ""

  const t2Started = t2Digits.length > 0 || t2Relation !== ""
  const t2Filled = t2Digits.length === 9 && t2Relation !== ""
  const t2Partial = t2Started && !t2Filled

  const debitDateValid = /^\d{4}-\d{2}-\d{2}$/.test(debitDate)

  const canSubmit = t1Valid && !t2Partial && debitDateValid

  function handleSubmit() {
    if (!canSubmit) return
    const data: AdditionalData = {
      trustee1: { phone: formatUzPhone(t1Digits), relation: t1Relation },
      debitDate,
    }
    if (t2Filled) {
      data.trustee2 = { phone: formatUzPhone(t2Digits), relation: t2Relation }
    }
    saveAdditionalData(data)
    navigate("/scoring/alif/confirm")
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-[720px] rounded-lg bg-white p-6 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-8">
        <p className="text-xs text-gray-400">Log Id: 123456</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Дополнительные данные</h2>
        <p className="mt-1 text-sm text-gray-500">
          Укажите контакты близких — это увеличивает шанс одобрения
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <TrusteeFields
            title="Доверительное лицо — 1"
            phoneDigits={t1Digits}
            onPhoneChange={setT1Digits}
            relation={t1Relation}
            onRelationChange={setT1Relation}
          />
          <TrusteeFields
            title="Доверительное лицо — 2"
            phoneDigits={t2Digits}
            onPhoneChange={setT2Digits}
            relation={t2Relation}
            onRelationChange={setT2Relation}
            error={t2Partial ? "Заполните оба поля или очистите" : undefined}
          />
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-gray-900">Дата списания оплаты</h3>
          <Input
            type="date"
            className="mt-3 max-w-[240px]"
            value={debitDate}
            onChange={(e) => setDebitDate(e.target.value)}
          />
        </div>

        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="mt-8 h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
          style={{ background: "#FFD60A" }}
        >
          Продолжить
        </Button>

        <button
          type="button"
          onClick={() => navigate("/scoring/alif/card")}
          className="mt-3 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          Вернуться к предыдущему шагу
        </button>
      </div>
    </div>
  )
}
