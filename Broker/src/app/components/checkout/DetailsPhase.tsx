import { useState } from "react"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@texnomart/ui/select"
import { Checkbox } from "@texnomart/ui/checkbox"
import { Button } from "@texnomart/ui/button"
import { DialogFooter } from "@texnomart/ui/dialog"
import { useScoringFlow, type Relation } from "@/app/scoring-flow"
import { ACTIVITY_AREAS, BROKER_CLIENT } from "@/lib/broker-mock-data"
import { HoldStatusBar } from "./HoldStatusBar"
import {
  RelativeFields,
  digitsFromPhone,
  extractDigits,
  formatUzPhone,
  makeRelativeId,
  type RelativeDraft,
} from "./RelativeFields"

// Фаза «Дополнительные данные» — контент бывшей AdditionalDataPage без
// страничного контейнера/кнопки «назад» (у попапа есть крестик закрытия).
// Переход дальше по цепочке происходит сам (деривация в AlifCheckoutDialog)
// по факту saveDetails.
export function DetailsPhase() {
  const { state, saveDetails } = useScoringFlow()

  const [relatives, setRelatives] = useState<RelativeDraft[]>(() => {
    if (state.relations && state.relations.length > 0) {
      return state.relations.map((r) => ({
        id: makeRelativeId(),
        type: r.type,
        phoneDigits: digitsFromPhone(r.phone),
        name: r.name,
      }))
    }
    return [{ id: makeRelativeId(), type: "", phoneDigits: "", name: "" }]
  })

  const [activityAreaId, setActivityAreaId] = useState(state.survey?.activityAreaId ?? "")
  const [language, setLanguage] = useState<"ru" | "uz">(state.survey?.language ?? "ru")
  const [car, setCar] = useState(state.survey?.car ?? false)

  const clientDigits = extractDigits(BROKER_CLIENT.phone)

  // Индекс → текст ошибки. Три правила ТЗ: телефон заполнен, не совпадает с
  // телефоном клиента, не совпадает с другим родственником.
  const relativeErrors = relatives.map((relative, i) => {
    if (relative.phoneDigits.length > 0 && relative.phoneDigits.length < 9) {
      return "Введите номер полностью"
    }
    if (relative.phoneDigits.length === 9 && relative.phoneDigits === clientDigits) {
      return "Номер совпадает с номером клиента"
    }
    const duplicate = relatives.some(
      (other, j) => j !== i && other.phoneDigits.length === 9 && other.phoneDigits === relative.phoneDigits,
    )
    if (duplicate) return "Такой номер уже указан у другого родственника"
    return undefined
  })

  const allFilled = relatives.every(
    (r) => r.type !== "" && r.name.trim() !== "" && r.phoneDigits.length === 9,
  )
  const canSubmit =
    relatives.length >= 1 && allFilled && relativeErrors.every((e) => e === undefined) && activityAreaId !== ""

  function handleSubmit() {
    if (!canSubmit) return
    const relations: Relation[] = relatives.map((r) => ({
      type: r.type,
      phone: formatUzPhone(r.phoneDigits),
      name: r.name.trim(),
    }))
    saveDetails(relations, { activityAreaId, language, car })
  }

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Дополнительные данные</h2>
      <p className="mt-1 text-sm text-gray-500">
        Укажите хотя бы одного близкого родственника — это увеличивает шанс одобрения
      </p>

      <div className="mt-4">
        <HoldStatusBar />
      </div>

      <div className="mt-6 space-y-3">
        {relatives.map((relative, i) => (
          <RelativeFields
            key={relative.id}
            index={i}
            value={relative}
            onChange={(next) => setRelatives((prev) => prev.map((r, j) => (j === i ? next : r)))}
            onRemove={() => setRelatives((prev) => prev.filter((_, j) => j !== i))}
            removable={relatives.length > 1}
            error={relativeErrors[i]}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRelatives((prev) => [...prev, { id: makeRelativeId(), type: "", phoneDigits: "", name: "" }])}
        className="mt-3 flex h-11 items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        <Plus className="size-4" />
        Добавить родственника
      </button>

      <div className="mt-6">
        <h3 className="font-semibold text-gray-900">Анкета</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Сфера деятельности</label>
            <Select value={activityAreaId} onValueChange={setActivityAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Предпочитаемый язык</label>
            <Select value={language} onValueChange={(value) => setLanguage(value as "ru" | "uz")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="uz">Oʻzbekcha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-gray-700">
          <Checkbox checked={car} onCheckedChange={(value) => setCar(value === true)} />
          Есть автомобиль
        </label>
      </div>

      <DialogFooter className="mt-8 w-full">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
          style={{ background: "#FFD60A" }}
        >
          Продолжить
        </Button>
      </DialogFooter>
    </div>
  )
}
