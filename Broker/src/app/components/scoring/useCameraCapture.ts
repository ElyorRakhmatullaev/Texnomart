import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

export type CameraStatus = "idle" | "starting" | "streaming" | "denied"

export interface UseCameraCaptureResult {
  status: CameraStatus
  videoRef: RefObject<HTMLVideoElement | null>
  start: () => void
  stop: () => void
  capture: () => Promise<Blob | null>
}

// Захват фото с фронтальной камеры для шага «Проверка MyID». Инкапсулирует
// getUserMedia + отрисовку кадра в canvas → blob. Камера всегда останавливается
// при уходе со страницы/анмаунте — треки MediaStream не должны переживать
// компонент (иначе индикатор камеры в браузере остаётся включённым).
export function useCameraCapture(): UseCameraCaptureResult {
  const [status, setStatus] = useState<CameraStatus>("idle")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Поколение запроса getUserMedia — растёт на каждый stop()/start()/анмаунт.
  // Если ответ пришёл после того, как счётчик уже сдвинулся (stop успел
  // отработать, пока permission-промис летел), поток немедленно
  // останавливается вместо того, чтобы «прицепиться» к уже неактуальному шагу.
  const requestIdRef = useRef(0)

  const stop = useCallback(() => {
    requestIdRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus((prev) => (prev === "denied" ? prev : "idle"))
  }, [])

  const start = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("denied")
      return
    }
    const requestId = ++requestIdRef.current
    setStatus("starting")
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 1280 }, facingMode: "user" },
      })
      .then((stream) => {
        if (requestIdRef.current !== requestId) {
          // stop()/новый start() случились, пока запрос летел — этот поток
          // уже никому не принадлежит, останавливаем сразу.
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setStatus("streaming")
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return
        setStatus("denied")
      })
  }, [])

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
    })
  }, [])

  // Обязательный cleanup: гарантирует остановку треков даже если вызывающий
  // компонент забыл вызвать stop() вручную (например, при анмаунте на любой фазе),
  // и инвалидирует запрос, который мог быть ещё в полёте на момент анмаунта.
  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return { status, videoRef, start, stop, capture }
}
