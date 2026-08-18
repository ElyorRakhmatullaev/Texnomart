import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { AlertTriangle, CameraOff, CheckCircle2, Eye, Loader2, ScanFace, Sun } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@texnomart/ui/button"
import { cn } from "@texnomart/ui/utils"
import { useScoringFlow } from "@/app/scoring-flow"
import { MYID_CHECK_DELAY_MS, PHOTO_MAX_BYTES, PHOTO_MIN_BYTES } from "@/lib/broker-mock-data"
import { useCameraCapture } from "@/app/components/scoring/useCameraCapture"
import demoPhoto from "@/assets/demo-photo.jpg"

type Phase = "camera" | "preview" | "invalid" | "checking" | "done"

const HINTS = [
  { icon: ScanFace, label: "Держите положение лица" },
  { icon: Eye, label: "Не закрывайте лицо" },
  { icon: Sun, label: "Хорошее освещение" },
]

// Валидация захваченного/демо-фото: формат jpeg/png и размер в диапазоне
// [PHOTO_MIN_BYTES, PHOTO_MAX_BYTES]. Возвращает текст ошибки или null (успех).
function validatePhoto(blob: Blob): string | null {
  const validType = blob.type === "image/jpeg" || blob.type === "image/png"
  const validSize = blob.size >= PHOTO_MIN_BYTES && blob.size <= PHOTO_MAX_BYTES
  if (validType && validSize) return null
  const kb = Math.round(blob.size / 1024)
  return `Фото не соответствует требованиям (размер ${kb} КБ, нужно 300 КБ – 1,5 МБ)`
}

export function MyIdPhotoPage() {
  const { state, setPhotoDone, setMyidDone } = useScoringFlow()
  const navigate = useNavigate()
  const { status, videoRef, start, stop, capture } = useCameraCapture()

  // Reload/back-nav с уже пройденным MyID — сразу показываем «Подтверждено»,
  // камера не запускается вовсе.
  const [phase, setPhase] = useState<Phase>(() => (state.myidDone ? "done" : "camera"))
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Blob текущего превью — хранится отдельно от object URL, т.к. нужен целиком
  // (тип + размер) для валидации при «Использовать фото».
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null)

  // Камера живёт только пока активна фаза "camera" — запускается при входе,
  // останавливается при уходе (превью/чек/готово) и при анмаунте.
  useEffect(() => {
    if (phase !== "camera") return
    start()
    return () => stop()
    // start/stop сознательно не в зависимостях — это стабильные useCallback
    // без внешних deps, добавление их в массив ничего не меняет в поведении.
  }, [phase])

  // Ревокация object URL превью — при смене на новый (или null при «Переснять»)
  // предыдущий освобождается; на анмаунте — последний.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Мок-проверка MyID: фиксированная задержка после успешной валидации фото.
  useEffect(() => {
    if (phase !== "checking") return
    const t = setTimeout(() => {
      setMyidDone()
      setPhase("done")
    }, MYID_CHECK_DELAY_MS)
    return () => clearTimeout(t)
  }, [phase, setMyidDone])

  async function handleCapture() {
    const blob = await capture()
    if (!blob) {
      toast.error("Не удалось сделать снимок. Попробуйте снова")
      return
    }
    setPreviewUrl(URL.createObjectURL(blob))
    setPendingBlob(blob)
    setPhase("preview")
  }

  async function handleUseDemo() {
    try {
      const res = await fetch(demoPhoto)
      const raw = await res.blob()
      // Vite отдаёт .jpg как статический ассет с корректным Content-Type, но
      // подстраховываемся явным MIME — валидация читает blob.type.
      const blob = raw.type === "image/jpeg" ? raw : new Blob([raw], { type: "image/jpeg" })
      setPreviewUrl(URL.createObjectURL(blob))
      setPendingBlob(blob)
      setPhase("preview")
    } catch {
      toast.error("Не удалось загрузить демо-фото")
    }
  }

  function handleUsePhoto() {
    if (!pendingBlob) return
    const error = validatePhoto(pendingBlob)
    if (error) {
      setInvalidMessage(error)
      setPhase("invalid")
      return
    }
    setPhotoDone()
    setPhase("checking")
  }

  function handleRetake() {
    setPreviewUrl(null)
    setPendingBlob(null)
    setInvalidMessage(null)
    setPhase("camera")
  }

  function handleContinue() {
    navigate("/scoring/banks")
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-[720px] rounded-lg bg-white p-6 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-8">
        <p className="text-center text-xs text-gray-400">Log Id: 123456</p>
        <h2 className="mt-1 text-center text-xl font-bold text-gray-900">Проверка MyID</h2>

        {phase !== "done" && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {HINTS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </span>
            ))}
          </div>
        )}

        {phase !== "done" && (
          <div className="relative mx-auto mt-6 aspect-[3/4] w-full max-w-[460px] overflow-hidden rounded-xl bg-gray-900">
            {/* Камера: видео либо плашка «недоступна» */}
            {phase === "camera" && status !== "denied" && (
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-full w-full scale-x-[-1] object-cover"
              />
            )}
            {phase === "camera" && status === "denied" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <CameraOff className="size-8 shrink-0 text-gray-400" />
                <p className="text-sm text-gray-300">
                  Камера недоступна. Проверьте доступ к камере или используйте демо-фото
                </p>
                <Button
                  type="button"
                  onClick={handleUseDemo}
                  className="h-10 font-semibold text-black hover:opacity-90"
                  style={{ background: "#FFD60A" }}
                >
                  Использовать демо-фото
                </Button>
              </div>
            )}
            {phase === "camera" && (status === "idle" || status === "starting") && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-300">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                Запуск камеры…
              </div>
            )}

            {/* Овальная рамка позиционирования лица — только пока идёт живая трансляция */}
            {phase === "camera" && status === "streaming" && (
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80"
                style={{ width: "78%", height: "88%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }}
              />
            )}

            {/* Превью снятого/демо-фото */}
            {(phase === "preview" || phase === "invalid" || phase === "checking") && previewUrl && (
              <img
                src={previewUrl}
                alt="Захваченное фото"
                className={cn(
                  "h-full w-full object-cover",
                  phase === "checking" && "opacity-40",
                )}
              />
            )}

            {phase === "invalid" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-6 text-center">
                <AlertTriangle className="size-8 shrink-0 text-red-400" />
                <p className="text-sm text-red-200">{invalidMessage}</p>
              </div>
            )}

            {phase === "checking" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm font-medium text-white">
                <Loader2 className="size-6 shrink-0 animate-spin" />
                Проверка MyID…
              </div>
            )}
          </div>
        )}

        {phase === "camera" && status === "streaming" && (
          <p className="mx-auto mt-3 max-w-[460px] text-center text-xs text-gray-500">
            Анфас, лицо полностью в овале · PNG/JPG · 300 КБ – 1,5 МБ
          </p>
        )}

        {phase === "camera" && status === "streaming" && (
          <Button
            type="button"
            onClick={handleCapture}
            className="mx-auto mt-6 block h-11 w-full max-w-[460px] font-semibold text-black hover:opacity-90"
            style={{ background: "#FFD60A" }}
          >
            Сделать снимок
          </Button>
        )}

        {phase === "preview" && (
          <div className="mx-auto mt-6 flex max-w-[460px] gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleRetake}
              className="h-11 flex-1 font-semibold"
            >
              Переснять
            </Button>
            <Button
              type="button"
              onClick={handleUsePhoto}
              className="h-11 flex-1 font-semibold text-black hover:opacity-90"
              style={{ background: "#FFD60A" }}
            >
              Использовать фото
            </Button>
          </div>
        )}

        {phase === "invalid" && (
          <Button
            type="button"
            onClick={handleRetake}
            className="mx-auto mt-6 block h-11 w-full max-w-[460px] font-semibold text-black hover:opacity-90"
            style={{ background: "#FFD60A" }}
          >
            Переснять
          </Button>
        )}

        {phase === "done" && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <CheckCircle2 className="size-5 shrink-0" />
              <span className="font-medium">Личность подтверждена</span>
            </div>
            <Button
              type="button"
              onClick={handleContinue}
              className="h-11 w-full max-w-[460px] font-semibold text-black hover:opacity-90"
              style={{ background: "#FFD60A" }}
            >
              Продолжить
            </Button>
          </div>
        )}

        {phase !== "checking" && (
          <button
            type="button"
            onClick={() => navigate("/scoring/verification")}
            className="mt-4 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Вернуться к предыдущему шагу
          </button>
        )}
      </div>
    </div>
  )
}
