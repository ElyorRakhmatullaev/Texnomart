import { BROKER_CLIENT } from "@/lib/broker-mock-data"

const FIELDS: Array<{ label: string; value: string }> = [
  { label: "ФИО", value: BROKER_CLIENT.name },
  { label: "Номер телефона", value: BROKER_CLIENT.phone },
  { label: "ПИНФЛ", value: BROKER_CLIENT.pinfl },
  { label: "Карта", value: BROKER_CLIENT.cardMask },
]

export function ClientInfoBand() {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-white p-4 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:grid-cols-4 md:p-6">
      {FIELDS.map((field) => (
        <div key={field.label} className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">{field.label}</span>
          <span className="text-sm font-medium text-gray-900">{field.value}</span>
        </div>
      ))}
    </div>
  )
}
