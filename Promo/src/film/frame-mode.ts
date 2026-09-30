/**
 * Режим кадра фильма (спецификация §3.2): вложенный экран Promo, который фильм
 * показывает во <iframe>. Включается ТОЛЬКО параметром film-frame=1 в адресе;
 * без него модуль ничего не делает.
 *
 * Импортируется ПЕРВОЙ строкой main.tsx: ES-модули вычисляются в порядке
 * импорта, поэтому подмены ниже действуют раньше любого кода приложения.
 *
 * Адрес: <BASE_URL>?film-frame=1&film-path=<маршрут>&role=<роль>&user=<id>&theme=light|dark
 */

/** «Сейчас» в кадре — тот же момент, что FIXED_NOW в e2e: 28.09.2026 12:00, Ташкент. */
export const FILM_NOW = Date.parse("2026-09-28T12:00:00+05:00");

const params = new URLSearchParams(window.location.search);

export const isFilmFrame = params.get("film-frame") === "1";

/** Хранилище в памяти с API Storage: кадр не видит и не трогает хранилища вкладки. */
class MemoryStorage {
  #items = new Map<string, string>();

  get length(): number {
    return this.#items.size;
  }
  key(index: number): string | null {
    return [...this.#items.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.#items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.#items.set(key, String(value));
  }
  removeItem(key: string): void {
    this.#items.delete(key);
  }
  clear(): void {
    this.#items.clear();
  }
}

/** Состояние кадра не зависит от времени: анимаций и переходов приложения нет. */
const FRAME_CSS = `
*, *::before, *::after { animation: none !important; transition: none !important; }
* { scrollbar-width: none !important; }
*::-webkit-scrollbar { display: none !important; }
[data-sonner-toaster] { display: none !important; }
`;

function installFilmFrame(): void {
  // Экран открывается от корня приложения (?film-path=…), а не глубокой ссылкой:
  // на GitHub Pages глубокая ссылка идёт через 404.html и общий для вкладки
  // sessionStorage «spaRedirect» — два окна, грузящиеся разом, перепутали бы
  // экраны. Адрес переставляется до создания роутера (routes.tsx читает его при
  // импорте, а этот модуль импортируется первым).
  const filmPath = params.get("film-path");
  if (filmPath) {
    window.history.replaceState(
      null,
      "",
      `${import.meta.env.BASE_URL}${filmPath}${window.location.search}`,
    );
  }

  const session = new MemoryStorage();
  session.setItem("auth", "true");
  session.setItem("promo:current-user-id", params.get("user") ?? "u-1");
  session.setItem("promo:current-role", params.get("role") ?? "Коммерческий директор");
  const local = new MemoryStorage();
  local.setItem("promo:pref-theme", params.get("theme") === "dark" ? "dark" : "light");
  Object.defineProperty(window, "sessionStorage", { value: session, configurable: true });
  Object.defineProperty(window, "localStorage", { value: local, configurable: true });

  // «Сейчас» зафиксировано: new Date() без аргументов и Date.now(); остальное — как обычно.
  const RealDate = Date;
  RealDate.now = () => FILM_NOW;
  window.Date = new Proxy(RealDate, {
    construct: (target, args, newTarget) =>
      Reflect.construct(target, args.length === 0 ? [FILM_NOW] : args, newTarget),
    apply: () => new RealDate(FILM_NOW).toString(),
  });

  const style = document.createElement("style");
  style.textContent = FRAME_CSS;
  document.head.appendChild(style);
  document.documentElement.dataset.filmFrame = "1";
}

if (isFilmFrame) installFilmFrame();
