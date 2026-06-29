import type { AuditEvent } from "./promo-mock-data";

const STORAGE_KEY = "promo:audit-live";

/** Сериализуемый вид (Date → ISO-строка). */
type StoredEvent = Omit<AuditEvent, "id" | "at"> & { at: string };

function read(): StoredEvent[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredEvent[];
  } catch {
    return [];
  }
}

export function appendAuditEvent(
  input: Omit<AuditEvent, "id" | "at"> & { at?: Date }
): void {
  if (typeof window === "undefined") return;
  const { at, ...rest } = input;
  const stored: StoredEvent = { ...rest, at: (at ?? new Date()).toISOString() };
  const all = read();
  all.push(stored);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Живые события с восстановленными Date и стабильными id (AUD-L####). */
export function getLiveAuditEvents(): AuditEvent[] {
  return read().map((e, i) => ({
    ...e,
    id: `AUD-L${String(i + 1).padStart(4, "0")}`,
    at: new Date(e.at),
  }));
}
