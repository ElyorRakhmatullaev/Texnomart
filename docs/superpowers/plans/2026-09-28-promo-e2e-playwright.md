# Promo · Playwright-тесты по пунктам №12–27 — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Набор из 123 Playwright-тестов (+ проверка самой обвязки), который одной командой поднимает прототип Promo и проверяет выполненные пункты №12–27 и доработки 25.09.

**Architecture:** `@playwright/test` внутри `Promo/`, тесты в `Promo/e2e/`. Фикстура `app` кладёт вход в sessionStorage до загрузки страницы, фиксирует время, меняет роль через меню аватара и даёт хелперы для скачиваний, дат, выпадающих списков и таблиц. Семь файлов сценариев по разделам; известные дефекты — `test.fail`.

**Tech Stack:** `@playwright/test` 1.61.1, установленный Chrome (`channel: 'chrome'`), Vite 6 dev-сервер на порту 5183, `xlsx` (уже зависимость Promo) для чтения выгрузок.

**Spec:** `docs/superpowers/specs/2026-09-28-promo-e2e-playwright-design.md` — читать вместе с планом: там требования, границы и таблица известных дефектов (§5).

## Global Constraints

- **Код приложения не меняется.** Никаких правок в `Promo/src/**` и `packages/**`. `data-testid` не добавляются.
- **Тест проверяет требование, а не текущее поведение.** Если тест падает:
  1. Сначала проверить сам тест: локатор, ожидание анимации, опечатку. Правится локатор, а не ожидаемый текст или поведение.
  2. Если строка в плане расходится с исходником (опечатка плана) — взять строку из исходника, указать `файл:строка` в отчёте задачи.
  3. Если поведение приложения расходится с требованием спецификации — тест остаётся с правильным ожиданием и получает `test.fail(true, 'Дефект: <что не так> (<файл:строка>)')`; дефект вносится в отчёт задачи.
  4. **Запрещено** ослаблять проверку, чтобы тест прошёл: менять ожидаемые значения на фактические, заменять `toBe` на `toBeTruthy`, убирать проверку, ставить `test.skip`.
- **У каждой проверки отсутствия есть положительный контроль** в том же тесте: `toHaveCount(0)` / `toBeHidden()` / `not.toContainText` доказывают что-то, только если тот же локатор в другом месте теста находит элемент.
- **Переходы только через `app.open('путь')`** без ведущего `/` — иначе прогон против GitHub Pages (`/Texnomart/promo/`) уйдёт в корень сайта.
- **Тесты независимы:** никаких `test.describe.serial`, никаких зависимостей от порядка. Каждый тест сам создаёт нужное состояние.
- **Смена роли — только `app.switchRole()`** (меню аватара, без перезагрузки). Строки, отправки и правки полного календаря живут в памяти страницы.
- **Тест, который выходит из системы (`app.logout()`), объявляет `session: null`**: иначе при следующей загрузке фикстура снова положит вход.
- **Время:** 28.09.2026 12:00 Ташкент (`FIXED_NOW`); пояс `Asia/Tashkent`, локаль `ru-RU`. Тест, которому нужно другое время, ставит `test.use({ now: … })` или `page.clock.setFixedTime(…)`.
- **Команды** (из `D:\Texnomart\Promo`): `npx playwright test e2e/<файл>.spec.ts`. pnpm нет в PATH — `corepack pnpm …`.
- **Коммиты — в `main`, без трейлера `Co-Authored-By`** и других AI-подписей (правило репозитория).
- **Отчёт задачи** перечисляет: сколько тестов прошло; какие получили `test.fail` и почему (с `файл:строка`); где строка плана была исправлена по исходнику.

## Review Focus

1. **Пустые проверки отсутствия.** Неверный локатор делает `toHaveCount(0)` всегда зелёным. Ревьюер каждой задачи сверяет, что у каждой такой проверки есть положительный контроль (правило в Global Constraints; тесты ниже его соблюдают).
2. **Запуск против GitHub Pages.** Любой `page.goto('/…')` ломает прогон под подпутём. Задача 9 гоняет весь набор с `BASE_URL`.
3. **Другая машина — другой пояс и дата.** Без фиксации пояса форма плана строит даты со сдвигом на день, а сроки «уезжают». Обвязка (задача 1) проверяет в браузере `new Date()` и пояс.
4. **Нет Chrome.** На машине без Chrome `channel: 'chrome'` падает. `PW_CHANNEL=chromium` + `npx playwright install chromium` — описано в `Promo/CLAUDE.md` (задача 9).
5. **Плавающие тесты.** Три прогона подряд в задаче 9 должны дать одинаковый результат; тосты и анимации закрываются хелперами, а не `waitForTimeout`.

---

### Task 1: Обвязка — Playwright, конфиг, фикстуры, данные, самопроверка

**Files:**
- Modify: `Promo/package.json` (devDependency + скрипты)
- Modify: `package.json` (корень, скрипт `test:e2e:promo`)
- Modify: `.gitignore`
- Create: `Promo/playwright.config.ts`
- Create: `Promo/e2e/data.ts`
- Create: `Promo/e2e/fixtures.ts`
- Test: `Promo/e2e/harness.spec.ts`

**Interfaces:**
- Produces (используют все следующие задачи):
  - `test`, `expect` из `./fixtures`; опции `test.use({ session: { user: UserId; role?: RoleName } | null, now: Date })`. По умолчанию `session = { user: 'u-2' }` (Администратор), `now = FIXED_NOW`.
  - фикстура `app: App` с методами:
    - `open(path: string): Promise<void>` — путь без ведущего `/`
    - `openLogin(): Promise<void>`, `submitLogin(email, password): Promise<void>`, `login(email, password): Promise<void>`, `logout(): Promise<void>`
    - `openUserMenu(): Promise<void>`, `switchRole(role: RoleName): Promise<void>`, `dismissToasts(): Promise<void>`
    - `toast(text: string | RegExp): Promise<void>` — ждёт видимый тост
    - `download(trigger: () => Promise<unknown>): Promise<Downloaded>` — `{ name, buffer, text }`
    - `menu(trigger: Locator, item: string | RegExp): Promise<void>` — пункт выпадающего меню
    - `select(trigger: Locator, option: string | RegExp): Promise<void>` — пункт Radix Select
    - `pickDate(trigger: Locator, ddmmyyyy: string): Promise<void>` — не кликает, если дата уже выбрана
    - `gridRow(name: string | RegExp): Locator` — строка закреплённой панели полного календаря
    - `gridScrollRow(name: string): Promise<Locator>` — строка прокручиваемой панели с тем же индексом
    - `notification(typeLabel: string, promoNo: string): Locator` — карточка уведомления
    - `userRow(fullName: string): Locator`, `userAction(fullName, action): Promise<void>`, `openJournal(userId: string): Promise<Locator>`
    - `storage(key): Promise<string | null>`, `setStorage(key, value: unknown): Promise<void>`
    - `expectPasswordsNotLeaked(passwords: string[]): Promise<void>`
    - `newTabAs(user: UserId, role?: RoleName): Promise<App>` — вторая вкладка того же контекста (общий localStorage, своя сессия)
  - `parseCsv(text: string): string[][]`, `readXlsx(buffer: Buffer): { sheetNames: string[]; rows(sheet: string): unknown[][] }`
  - из `./data`: `FIXED_NOW`, `ROLES`, `RoleName`, `USERS`, `UserId`, `PROMO`, `LINES`, `KM`, `CATEGORIES`, `LEGACY_CATEGORIES`

- [ ] **Step 1: Установить Playwright**

Run (из `D:\Texnomart`):
```bash
corepack pnpm --filter promo add -D @playwright/test@1.61.1
```
Expected: в `Promo/package.json` появился `"@playwright/test": "1.61.1"` в `devDependencies`. Если версии нет в реестре — поставить последнюю стабильную `1.x` и указать её в отчёте. Браузер не скачивается: используется установленный Chrome.

- [ ] **Step 2: Скрипты и .gitignore**

В `Promo/package.json` → `"scripts"` добавить:
```json
"test:e2e": "playwright test",
"test:e2e:report": "playwright show-report"
```
В корневом `package.json` → `"scripts"` добавить после `"build:promo"`:
```json
"test:e2e:promo": "pnpm --filter promo test:e2e",
```
В конец `.gitignore`:
```
# Playwright e2e (Promo)
test-results/
playwright-report/
```

- [ ] **Step 3: Конфиг**

Create `Promo/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

// BASE_URL задан → прогон против уже поднятого сайта (например, GitHub Pages
// https://elyorrakhmatullaev.github.io/Texnomart/promo/), свой сервер не нужен.
const BASE_URL = process.env.BASE_URL;
const LOCAL_URL = 'http://localhost:5183/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL ?? LOCAL_URL,
    channel: process.env.PW_CHANNEL ?? 'chrome',
    locale: 'ru-RU',
    timezoneId: 'Asia/Tashkent',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: BASE_URL
    ? undefined
    : {
        command: 'npx vite --port 5183 --strictPort',
        url: LOCAL_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
```

- [ ] **Step 4: Данные**

Create `Promo/e2e/data.ts`:
```ts
/** Сиды прототипа, на которые опираются тесты (Promo/src/lib/*). */

/** 28.09.2026 12:00 по Ташкенту, понедельник. Все сроки в сидах считаются от «сейчас». */
export const FIXED_NOW = new Date('2026-09-28T12:00:00+05:00');

export const ROLES = {
  KD: 'Коммерческий директор',
  OD: 'Операционный директор',
  DM: 'Директор маркетинга',
  KM: 'Категорийный менеджер (КМ)',
  SKM: 'Старший КМ',
  MKT: 'Сотрудник маркетинга',
  PUR: 'Сотрудник закупа',
  ANL: 'Сотрудник аналитики',
  ADMIN: 'Администратор',
} as const;
export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** users-store.ts:97-134. role — основная роль (с неё начинается сессия). */
export const USERS = {
  'u-1': { name: 'Сардор Мавлянов', email: 'sardor@texnomart.uz', password: 'Director2026!', role: ROLES.KD },
  'u-2': { name: 'Администратор Системы', email: 'admin@texnomart.uz', password: 'Admin2026!', role: ROLES.ADMIN },
  'u-3': { name: 'Резервный Администратор', email: 'reserv@texnomart.uz', password: 'Backup2026!', role: ROLES.ADMIN },
  'u-4': { name: 'Каримов Шохрух', email: 'karimov@texnomart.uz', password: 'Manager2026!', role: ROLES.KM },
  'u-5': { name: 'Исмаилов Жасур', email: 'ismailov@texnomart.uz', password: 'Senior2026!', role: ROLES.SKM },
  'u-6': { name: 'Алиева Нигора', email: 'alieva@texnomart.uz', password: 'Market2026!', role: ROLES.MKT },
  'u-7': { name: 'Новый Сотрудник', email: 'newuser@texnomart.uz', password: 'Temp1234!a', role: ROLES.PUR },
  // u-8 — активное «Уполномоченное лицо КД» до 31.12.2026: для роли КМ не использовать.
  'u-8': { name: 'Тошматов Фаррух', email: 'toshmatov@texnomart.uz', password: 'Manager2026!', role: ROLES.KM },
} as const;
export type UserId = keyof typeof USERS;

/** PR-2026-00X ↔ «26-X» (formatPromoNo). */
export const PROMO = {
  p1: { id: 'PR-2026-001', no: '26-1', name: 'Чёрная пятница 2026' },
  p2: { id: 'PR-2026-002', no: '26-2', name: 'Рассрочка на технику к Новому году' },
  p3: { id: 'PR-2026-003', no: '26-3', name: '1+1 на мелкую бытовую технику' },
  p4: { id: 'PR-2026-004', no: '26-4', name: 'Распродажа ТВ и аудио' },
  p5: { id: 'PR-2026-005', no: '26-5', name: 'Cashback на смартфоны' },
  p6: { id: 'PR-2026-006', no: '26-6', name: 'Скидки на климатическую технику' },
  p8: { id: 'PR-2026-008', no: '26-8' },
  p11: { id: 'PR-2026-011', no: '26-11' },
  u15: { id: 'UN-2026-015', no: '26-15' },
} as const;

/** Строки полного календаря и отчётов (promo-mock-data.ts:1016-1121, отчёты :3158+). */
export const LINES = {
  saundbar: 'Saund-бар Samsung HW-B650', // 26-1, km-1, отклонена
  xiaomi: 'Xiaomi TV A2 50"', // 26-3, km-1, согласована
  lgOled: 'LG OLED 48" OLED48C4', // 26-3, km-1, ожидает добавления
  delonghi: "Кофемашина De'Longhi Magnifica", // 26-3, km-4, ожидает изменения
  dyson: 'Пылесос Dyson V12', // 26-3, km-4, согласована
  boschBlender: 'Блендер Bosch ErgoMixx', // 26-3, km-4, ожидает исключения
  fan: 'Вентилятор Centek CT-5015', // нигде не используется — для добавления
  samsungFridge: 'Samsung RB37 No Frost', // отчёт 26-15: Добавлено
  lgFridge: 'LG GC-B247 Side-by-Side', // отчёт 26-15: Изменено
  boschWasher: 'Стиральная машина Bosch WGG', // отчёт 26-15: Исключено
} as const;

export const KM = {
  aliev: 'Алиев Бекзод', // km-1 — КМ-вид полного календаря
  yusupova: 'Юсупова Нигора', // km-2
  karimov: 'Каримов Шерзод', // km-3 — КМ-область аудита
  ismailov: 'Исмаилов Жасур', // km-6, старший КМ
} as const;

/** Девять согласованных категорий распределения (distribution-store.ts:28-38). */
export const CATEGORIES = [
  'Климатическая техника и техника для ухода за домом',
  'Крупно-бытовая техника для кухни',
  'Мелко-бытовая техника для дома, уход за одеждой, красота и здоровье',
  'Мелко-бытовая техника для кухни',
  'Аудио и видео техника, геймерские товары',
  'Техника для офиса, умный дом, компьютеры и периферия',
  'Персональная электроника',
  'Автотовары, спорт товары и товары для дома и сада',
  'Посуда для дома',
] as const;

/** Старые названия (distribution-store.ts:49-56) — не должны показываться. */
export const LEGACY_CATEGORIES = [
  'Телевизоры и аудио',
  'Холодильники и крупная БТ',
  'Смартфоны и гаджеты',
  'Мелкая бытовая техника',
  'Ноутбуки и ПК',
  'Климатическая техника',
] as const;
```

Note: `'Климатическая техника'` — префикс согласованной «Климатическая техника и техника для ухода за домом». Проверять отсутствие старого названия только точным совпадением текста ячейки (`{ exact: true }`), не подстрокой.

- [ ] **Step 5: Фикстуры**

Create `Promo/e2e/fixtures.ts`:
```ts
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { FIXED_NOW, USERS, type RoleName, type UserId } from './data';

export { expect };

export type Session = { user: UserId; role?: RoleName } | null;
export type Downloaded = { name: string; buffer: Buffer; text: string };

const RU_MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

/** CSV прототипа: BOM, «;», строки через \r\n, кавычки удваиваются. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ';') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function readXlsx(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  return {
    sheetNames: wb.SheetNames,
    rows(sheet: string): unknown[][] {
      return XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' }) as unknown[][];
    },
  };
}

async function injectSession(page: Page, user: UserId, role: RoleName) {
  // Только если входа ещё нет: перезагрузка не должна сбрасывать роль,
  // выбранную в тесте через меню аватара.
  await page.addInitScript(
    ({ user, role }) => {
      if (!window.sessionStorage.getItem('auth')) {
        window.sessionStorage.setItem('auth', 'true');
        window.sessionStorage.setItem('promo:current-user-id', user);
        window.sessionStorage.setItem('promo:current-role', role);
      }
    },
    { user, role },
  );
}

export function createApp(page: Page, now: Date) {
  const app = {
    page,

    async open(path: string) {
      await page.goto(path.replace(/^\//, ''));
    },

    async openLogin() {
      await app.open('login');
      await expect(page.locator('#email')).toBeVisible();
    },

    async submitLogin(email: string, password: string) {
      await page.locator('#email').fill(email);
      await page.locator('#password').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
    },

    async login(email: string, password: string) {
      await app.openLogin();
      await app.submitLogin(email, password);
      await expect(page).not.toHaveURL(/\/login(\?|$)/);
    },

    async dismissToasts() {
      const closers = page.locator('[data-sonner-toast] [data-close-button]');
      for (const btn of await closers.all()) {
        if (await btn.isVisible()) await btn.click();
      }
      await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    },

    async openUserMenu() {
      await app.dismissToasts();
      await page.getByRole('button').filter({ has: page.locator('[data-slot="avatar"]') }).first().click();
    },

    async logout() {
      await app.openUserMenu();
      await page.getByRole('menuitem', { name: 'Выйти' }).click();
      await expect(page).toHaveURL(/\/login/);
    },

    async switchRole(role: RoleName) {
      await app.openUserMenu();
      await page.getByRole('menuitem', { name: role, exact: true }).click();
      await expect(page.getByRole('menu')).toBeHidden();
    },

    async toast(text: string | RegExp) {
      await expect(page.locator('[data-sonner-toast]').filter({ hasText: text }).first()).toBeVisible();
    },

    async download(trigger: () => Promise<unknown>): Promise<Downloaded> {
      const [dl] = await Promise.all([page.waitForEvent('download'), trigger()]);
      const buffer = await readFile(await dl.path());
      return { name: dl.suggestedFilename(), buffer, text: buffer.toString('utf8') };
    },

    async menu(trigger: Locator, item: string | RegExp) {
      await trigger.click();
      await page.getByRole('menuitem', { name: item }).click();
    },

    async select(trigger: Locator, option: string | RegExp) {
      await trigger.click();
      await page.getByRole('option', { name: option, exact: typeof option === 'string' }).click();
    },

    /** DatePickerField (react-day-picker 8, подпись месяца «сентябрь 2026»). */
    async pickDate(trigger: Locator, ddmmyyyy: string) {
      if (((await trigger.textContent()) ?? '').includes(ddmmyyyy)) return; // повторный клик снял бы дату
      const [d, m, y] = ddmmyyyy.split('.').map(Number);
      await trigger.click();
      const grid = page.getByRole('grid').last();
      await expect(grid).toBeVisible();
      const target = y * 12 + (m - 1);
      for (let step = 0; step < 48; step++) {
        const labelId = await grid.getAttribute('aria-labelledby');
        const caption = ((await page.locator(`[id="${labelId}"]`).textContent()) ?? '').trim().toLowerCase();
        const [monthName, yearText] = caption.split(/\s+/);
        const shown = Number(yearText) * 12 + RU_MONTHS.indexOf(monthName);
        if (shown === target) break;
        await page
          .locator(shown < target ? 'button[name="next-month"]' : 'button[name="previous-month"]')
          .last()
          .click();
      }
      await grid
        .locator('button[name="day"]:not(.day-outside)')
        .filter({ hasText: new RegExp(`^${d}$`) })
        .click();
    },

    /** Закреплённая панель полного календаря: название, маркеры, иконки. */
    gridRow(name: string | RegExp) {
      return page.locator('div.group\\/row').filter({ hasText: name });
    },

    /** Прокручиваемая панель: строка с тем же индексом, что и закреплённая. */
    async gridScrollRow(name: string) {
      const texts = await page.locator('div.group\\/row').allTextContents();
      const idx = texts.findIndex((t) => t.includes(name));
      expect(idx, `строка «${name}» в закреплённой панели`).toBeGreaterThanOrEqual(0);
      return page.locator('div.flex.items-stretch.border-b.text-sm').nth(idx);
    },

    notification(typeLabel: string, promoNo: string) {
      return page
        .locator('div.flex.gap-3.rounded-lg.border')
        .filter({ hasText: typeLabel })
        .filter({ hasText: `№ ${promoNo} ·` });
    },

    /** Строка таблицы пользователей по ФИО в первой колонке (не в «Руководитель»). */
    userRow(fullName: string) {
      return page.getByRole('row').filter({ has: page.locator('td:first-child', { hasText: fullName }) });
    },

    async userAction(fullName: string, action: string) {
      await app.userRow(fullName).getByRole('button', { name: 'Действия' }).click();
      await page.getByRole('menuitem', { name: action, exact: true }).click();
    },

    async openJournal(userId: string) {
      await app.open(`users/${userId}`);
      await page.getByRole('tab', { name: 'Журнал действий' }).click();
      return page.getByRole('tabpanel');
    },

    async storage(key: string) {
      return page.evaluate((k) => window.localStorage.getItem(k), key);
    },

    async setStorage(key: string, value: unknown) {
      await page.evaluate(([k, v]) => window.localStorage.setItem(k, v), [key, JSON.stringify(value)] as const);
    },

    /** №23 п.3 / №26 п.3: пароль не пишется ни в журнал, ни в аудит. Вызывать на странице журнала. */
    async expectPasswordsNotLeaked(passwords: string[]) {
      for (const p of passwords) await expect(page.locator('body')).not.toContainText(p);
      const live = (await app.storage('promo:audit-live')) ?? '';
      for (const p of passwords) expect(live, 'пароль в promo:audit-live').not.toContain(p);
      await app.open('audit');
      await page.getByRole('tab', { name: 'Аудит-лог' }).click();
      await page.getByRole('button', { name: 'Все действия', exact: true }).click();
      await expect(page.getByText(/Записей: \d+/)).toBeVisible();
      for (const p of passwords) await expect(page.locator('body')).not.toContainText(p);
    },

    async newTabAs(user: UserId, role?: RoleName) {
      const tab = await page.context().newPage();
      await tab.clock.setFixedTime(now);
      await injectSession(tab, user, role ?? USERS[user].role);
      return createApp(tab, now);
    },
  };
  return app;
}

export type App = ReturnType<typeof createApp>;

export const test = base.extend<{ session: Session; now: Date; app: App }>({
  session: [{ user: 'u-2' }, { option: true }],
  now: [FIXED_NOW, { option: true }],
  app: async ({ page, session, now }, use) => {
    // setFixedTime, а не clock.install: вход ждёт setTimeout 600 мс, таймеры должны идти.
    await page.clock.setFixedTime(now);
    if (session) await injectSession(page, session.user, session.role ?? USERS[session.user].role);
    await use(createApp(page, now));
  },
});
```

- [ ] **Step 6: Самопроверка обвязки**

Create `Promo/e2e/harness.spec.ts`:
```ts
import { test, expect, parseCsv, readXlsx } from './fixtures';
import { ROLES } from './data';

test.describe('Обвязка', () => {
  test('время и пояс зафиксированы', async ({ app, page }) => {
    await app.open('short-calendar');
    const [iso, tz] = await page.evaluate(() => [
      new Date().toISOString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ]);
    expect(iso).toBe('2026-09-28T07:00:00.000Z');
    expect(tz).toBe('Asia/Tashkent');
  });

  test('вход из фикстуры и смена роли без перезагрузки', async ({ app, page }) => {
    await app.open('short-calendar');
    await expect(page).toHaveURL(/\/short-calendar/);
    await app.switchRole(ROLES.KM);
    await app.openUserMenu();
    await expect(page.getByRole('menuitem', { name: ROLES.KM, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => sessionStorage.getItem('promo:current-role'))).toBe(ROLES.KM);
    await page.reload();
    expect(await page.evaluate(() => sessionStorage.getItem('promo:current-role'))).toBe(ROLES.KM);
  });

  test('pickDate выбирает дату в DatePickerField', async ({ app, page }) => {
    await app.open('audit');
    await page.getByRole('tab', { name: 'Аудит-лог' }).click();
    const from = page.getByRole('button', { name: /Дата, с/ });
    await app.pickDate(from, '15.08.2026');
    await expect(page.getByRole('button', { name: /15\.08\.2026/ })).toBeVisible();
  });

  test('CSV скачивается и разбирается', async ({ app, page }) => {
    await app.open('short-calendar');
    const file = await app.download(() => app.menu(page.getByRole('button', { name: 'Экспорт' }), 'CSV'));
    const rows = parseCsv(file.text);
    expect(rows[0][0]).toBe('№ промо');
    expect(rows.length).toBeGreaterThan(1);
  });

  test('XLSX скачивается и читается', async ({ app, page }) => {
    await app.open('users');
    const file = await app.download(() => page.getByRole('button', { name: 'Экспорт' }).click());
    expect(file.name).toBe('Пользователи_2026-09-28.xlsx');
    const xlsx = readXlsx(file.buffer);
    expect(xlsx.rows(xlsx.sheetNames[0]).length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 7: Прогнать обвязку**

Run (из `D:\Texnomart\Promo`): `npx playwright test e2e/harness.spec.ts`
Expected: `5 passed`. Если `pickDate` не находит подпись месяца (`aria-labelledby` пуст) — прочитать разметку календаря в трассе (`npx playwright show-trace test-results/…/trace.zip`) и поправить поиск подписи в `fixtures.ts`, сохранив сигнатуру. Если выпадающее меню «Экспорт» открывается за экраном — это дефект приложения, а не обвязки: указать в отчёте.

- [ ] **Step 8: Commit**

```bash
git add Promo/package.json package.json .gitignore pnpm-lock.yaml Promo/playwright.config.ts Promo/e2e/data.ts Promo/e2e/fixtures.ts Promo/e2e/harness.spec.ts
git commit -m "test(promo): обвязка Playwright — конфиг, фикстуры, данные"
```

---

### Task 2: `auth.spec.ts` — вход, прямая ссылка, №23

**Files:**
- Create: `Promo/e2e/auth.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `app.open/openLogin/submitLogin/login/logout/toast/userAction/openJournal/storage/expectPasswordsNotLeaked` (Task 1); `USERS`, `PROMO` из `data.ts`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/auth.spec.ts`:
```ts
import { test, expect } from './fixtures';
import { PROMO, USERS } from './data';

const admin = USERS['u-2'];

// Все тесты файла входят и выходят сами.
test.use({ session: null });

test.describe('Вход', () => {
  test('ВХ-1 · обычный вход ведёт на краткий календарь', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await expect(page).toHaveURL(/\/short-calendar$/);
    await app.toast('Добро пожаловать в систему!');
  });

  test('ВХ-2 · неверный пароль и неизвестный email дают одно сообщение', async ({ app, page }) => {
    await app.openLogin();
    await app.submitLogin(admin.email, 'wrong-password');
    await expect(page.getByText('Неверный email или пароль.')).toBeVisible();
    await app.submitLogin('nobody@texnomart.uz', admin.password);
    await expect(page.getByText('Неверный email или пароль.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('ВХ-3 · пять неудач блокируют вход', async ({ app, page }) => {
    await app.openLogin();
    for (let i = 1; i <= 3; i++) {
      await app.submitLogin(admin.email, `wrong-${i}`);
      await expect(page.getByRole('button', { name: 'Войти' })).toBeEnabled();
    }
    await expect(page.getByText('Осталось 2 попытки. После блокировка на 15 минут.')).toBeVisible();
    await app.submitLogin(admin.email, 'wrong-4');
    await expect(page.getByText('Осталось 1 попытка. После блокировка на 15 минут.')).toBeVisible();
    await app.submitLogin(admin.email, 'wrong-5');
    await expect(page.getByText(/Заблокировано\. Повторите через \d+:\d{2}/)).toBeVisible();
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeDisabled();
  });

  test('ВХ-4 · деактивированный пользователь не входит', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await app.open('users');
    await app.userAction(USERS['u-8'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await app.logout();
    await app.submitLogin(USERS['u-8'].email, USERS['u-8'].password);
    await expect(page.getByText('Учётная запись заблокирована. Обратитесь к администратору.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Прямая ссылка (25.09)', () => {
  test('ПС-1 · после входа открывается отчёт из ссылки', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.u15.id}`);
    await expect(page).toHaveURL(/\/login/);
    await app.submitLogin(admin.email, admin.password);
    await expect(page).toHaveURL(new RegExp(`/reports\\?promo=${PROMO.u15.id}$`));
    // 26-15 — не отчёт по умолчанию (по умолчанию 26-3): счётчики только у 26-15.
    await expect(page.getByText('Добавлено: 1')).toBeVisible();
    await expect(page.getByText('Исключено: 1')).toBeVisible();
  });

  test('ПС-2 · после входа открывается полный календарь с акцией из ссылки', async ({ app, page }) => {
    await app.open(`full-calendar?promo=${PROMO.p1.id}`);
    await expect(page).toHaveURL(/\/login/);
    await app.submitLogin(admin.email, admin.password);
    await expect(page).toHaveURL(new RegExp(`/full-calendar\\?promo=${PROMO.p1.id}$`));
    await expect(
      page.getByText(`Показана акция по ссылке из календаря готовности: № ${PROMO.p1.no}`),
    ).toBeVisible();
  });
});

test.describe('№23 · пароли в журнале', () => {
  const NEW_PASSWORD = 'NewPass2026!x';

  test('23-1 · первый вход требует сменить временный пароль', async ({ app, page }) => {
    const user = USERS['u-7'];
    await app.login(user.email, user.password);
    await expect(page).toHaveURL(/\/change-password$/);
    await app.open('users');
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByText('Это первый вход — задайте постоянный пароль, чтобы продолжить.')).toBeVisible();
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Сохранить и войти' }).click();
    await app.toast('Пароль изменён. Добро пожаловать!');
    await expect(page).toHaveURL(/\/short-calendar$/);

    await app.logout();
    await app.login(admin.email, admin.password);
    const journal = await app.openJournal('u-7');
    await expect(journal.getByText('смена пароля', { exact: true })).toBeVisible();
    await expect(journal.getByText('Временный пароль заменён постоянным при первом входе')).toBeVisible();
    await app.expectPasswordsNotLeaked([user.password, NEW_PASSWORD]);
  });

  test('23-2 · форма смены пароля не пропускает слабый или несовпадающий пароль', async ({ app, page }) => {
    const user = USERS['u-7'];
    await app.login(user.email, user.password);
    const save = page.getByRole('button', { name: 'Сохранить и войти' });
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill('Other2026!xyz');
    await expect(page.getByText('Пароли не совпадают')).toBeVisible();
    await expect(save).toBeDisabled();
    for (const weak of ['Ab1!short', 'Abcdefgh1234']) {
      await page.locator('#password').fill(weak);
      await page.locator('#confirmPassword').fill(weak);
      await expect(page.getByText('Пароли совпадают')).toBeVisible();
      await expect(save).toBeDisabled();
    }
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_PASSWORD);
    await expect(save).toBeEnabled();
  });

  test('23-3 · сброс пароля пишется в журнал без пароля', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await app.open('users');
    await app.userAction(USERS['u-4'].name, 'Сбросить пароль');
    await app.toast('Пароль сброшен');
    const users = JSON.parse((await app.storage('promo:users')) ?? '[]') as { id: string; password: string }[];
    const temp = users.find((u) => u.id === 'u-4')!.password;
    expect(temp).not.toBe(USERS['u-4'].password);
    const done = page.getByRole('button', { name: 'Готово' });
    if (await done.isVisible()) await done.click();

    const journal = await app.openJournal('u-4');
    await expect(journal.getByText('сброс пароля', { exact: true })).toBeVisible();
    await expect(journal.getByText('Сброшен пароль, выдан новый временный')).toBeVisible();
    await app.expectPasswordsNotLeaked([temp]);
  });

  test('23-4 · создание пользователя пишется в журнал, первый вход — со сменой пароля', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await app.open('users');
    await page.getByRole('button', { name: 'Создать пользователя' }).click();
    const form = page.getByRole('dialog', { name: 'Новый пользователь' });
    await form.getByLabel('ФИО').fill('Тестовый Пользователь');
    await form.getByLabel('Email (логин)').fill('e2e.user@texnomart.uz');
    await form.getByRole('button', { name: 'Создать' }).click();
    const tempDialog = page.getByRole('dialog', { name: 'Временный пароль' });
    await expect(tempDialog).toBeVisible();
    const temp = ((await tempDialog.locator('code').textContent()) ?? '').trim();
    expect(temp).toHaveLength(12);
    await tempDialog.getByRole('button', { name: 'Готово' }).click();
    await app.toast('Пользователь создан');

    await app.userAction('Тестовый Пользователь', 'Открыть');
    await page.getByRole('tab', { name: 'Журнал действий' }).click();
    const journal = page.getByRole('tabpanel');
    await expect(journal.getByText('создание', { exact: true })).toBeVisible();
    await expect(journal.getByText(/выдан временный пароль/)).toBeVisible();
    await app.expectPasswordsNotLeaked([temp]);

    await app.logout();
    await app.openLogin();
    await app.submitLogin('e2e.user@texnomart.uz', temp);
    await expect(page).toHaveURL(/\/change-password$/);
  });

  test('23-5 · смена пароля в профиле пишется в журнал', async ({ app, page }) => {
    const user = USERS['u-4'];
    await app.login(user.email, user.password);
    await app.openUserMenu();
    await page.getByRole('menuitem', { name: 'Профиль' }).click();
    await page.getByRole('tab', { name: 'Безопасность' }).click();
    await page.locator('#currentPassword').fill('Wrong2026!pass');
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();
    await expect(page.getByText('Текущий пароль неверён')).toBeVisible();
    await page.locator('#currentPassword').fill(user.password);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();
    await app.toast('Пароль изменён');

    await app.logout();
    await app.login(admin.email, admin.password);
    const journal = await app.openJournal('u-4');
    await expect(journal.getByText('Пароль изменён владельцем учётной записи')).toBeVisible();
    await app.expectPasswordsNotLeaked([NEW_PASSWORD]);
  });
});
```

Note к 23-5: старый пароль `Manager2026!` совпадает с паролем u-8, поэтому в `expectPasswordsNotLeaked` передаётся только новый.

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/auth.spec.ts`
Expected: `11 passed`. Падения разбирать по правилам Global Constraints; метка `test.fail` — только для подтверждённого расхождения с требованием.

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/auth.spec.ts
git commit -m "test(promo): e2e вход, прямая ссылка и пароли в журнале (№23)"
```

---

### Task 3: `short-calendar.spec.ts` — №12, №27, доработки 25.09

**Files:**
- Create: `Promo/e2e/short-calendar.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `parseCsv`, `app.open/switchRole/menu/select/pickDate/download/toast/setStorage` (Task 1); `ROLES`, `PROMO`, `KM`, `CATEGORIES`, `LEGACY_CATEGORIES`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/short-calendar.spec.ts`:
```ts
import type { Locator, Page } from '@playwright/test';
import { test, expect, parseCsv, type App } from './fixtures';
import { CATEGORIES, KM, LEGACY_CATEGORIES, PROMO, ROLES } from './data';

const CALENDAR_HEADER = [
  '№ промо', 'Тип промо', 'Название акции', 'Период (начало)', 'Период (окончание)',
  'Крайний срок заполнения КМ', 'Срок отчёта', 'Общий статус акции', 'Отправка смежным отделам',
  'Согласовано КМ', 'Всего КМ (без «Не участвует»)', 'Согласовано КД', 'На согл. у КД',
  'На согл. у ст. КМ', 'На корр. / Не заполнено', 'Не участвует', 'Распределение по категориям',
];

const PLAN_HEADER = [
  '№ промо', 'Статус строки', 'Цикл согласования', 'Тип акции', 'Наименование акции',
  'Период (начало)', 'Период (окончание)', 'Маркетинг: ознакомление', 'Маркетинг: отправка на согл.',
  'Маркетинг: статус', 'КД: согласование', 'КД: статус', 'ОД: согласование', 'ОД: статус',
  'Отклонил', 'Роль согласующего', 'Дата и время отклонения', 'Комментарий отклонения',
];

/** Порядок строк плана — по дате начала (так же, как на экране). */
const PLAN_ORDER = ['26-7', '26-6', '26-12', '26-13', '26-5', '26-10', '26-14', '26-8', '26-3', '26-9', '26-11', '26-1', '26-15', '26-2', '26-16'];

const exportButton = (page: Page) => page.getByRole('button', { name: 'Экспорт' });

async function exportCsv(app: App) {
  return app.download(() => app.menu(exportButton(app.page), 'CSV'));
}

async function openPlan(app: App) {
  await app.open('short-calendar');
  await app.page.getByRole('tab', { name: 'План акций' }).click();
}

function planRow(page: Page, promoNo: string) {
  return page.getByRole('row').filter({ has: page.getByText(promoNo, { exact: true }) });
}

async function openDistribution(app: App, promoNo: string) {
  await planRow(app.page, promoNo).getByRole('button', { name: 'Распределить по категориям / КМ' }).click();
  const sheet = app.page.getByRole('dialog', { name: 'Распределение по категориям / КМ' });
  await expect(sheet).toBeVisible();
  return sheet;
}

/** Период внутри срока акции → «Сформировать даты». Уже выбранные даты не трогаются. */
async function generateDates(app: App, sheet: Locator, from: string, to: string) {
  await app.pickDate(sheet.getByLabel('Начало периода'), from);
  await app.pickDate(sheet.getByLabel('Окончание периода'), to);
  await sheet.getByRole('button', { name: 'Сформировать даты' }).click();
}

async function applyToAll(app: App, sheet: Locator, category: string, km: string) {
  await sheet.getByLabel('Категория для всех дат').fill(category);
  await app.select(sheet.getByLabel('Ответственный КМ').first(), km);
  await sheet.getByRole('button', { name: 'Применить ко всем датам' }).click();
}

async function saveDistribution(app: App, sheet: Locator) {
  await sheet.getByRole('button', { name: 'Сохранить распределение' }).click();
  await app.toast('Распределение сохранено');
  await expect(sheet).toBeHidden();
}

function distributionBlock(page: Page, promoNo: string, count: number) {
  return planRow(page, promoNo).getByRole('button', { name: `Распределение по категориям (${count})` });
}

test.describe('№12 · экспорт', () => {
  test('12-1 · CSV календаря: № промо текстом, 17 колонок', async ({ app, page }) => {
    await app.open('short-calendar');
    const file = await exportCsv(app);
    expect(file.name).toBe('краткий-промо-календарь_2026-09-28.csv');
    expect(file.text.startsWith('\uFEFF')).toBe(true);
    const [header, ...rows] = parseCsv(file.text);
    expect(header).toEqual(CALENDAR_HEADER);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r[0]).toMatch(/^="26-\d+"$/);
    await app.toast(/Экспортировано: \d+ акций \(с учётом фильтров\)/);
  });

  test('12-2 · колонки отчёта только у ролей с доступом к отчётам', async ({ app }) => {
    await app.open('short-calendar');
    for (const role of [ROLES.DM, ROLES.OD, ROLES.KM]) {
      await app.switchRole(role);
      const [header] = parseCsv((await exportCsv(app)).text);
      expect(header, role).toHaveLength(15);
      expect(header, role).not.toContain('Срок отчёта');
      expect(header, role).not.toContain('Отправка смежным отделам');
    }
    await app.switchRole(ROLES.KD);
    const [kdHeader] = parseCsv((await exportCsv(app)).text);
    expect(kdHeader).toEqual(CALENDAR_HEADER);
  });

  test('12-3 · PDF в прототипе недоступен', async ({ app }) => {
    await app.open('short-calendar');
    await app.menu(exportButton(app.page), 'PDF');
    await app.toast('Экспорт в PDF недоступен в прототипе — используйте CSV или Excel.');
  });

  test.describe('план', () => {
    test.use({ session: { user: 'u-2', role: ROLES.DM } });

    test('12-4 · CSV плана: все колонки, порядок как на экране', async ({ app }) => {
      await openPlan(app);
      const file = await exportCsv(app);
      expect(file.name).toBe('план-акций_2026-09-28.csv');
      const [header, ...rows] = parseCsv(file.text);
      expect(header).toEqual(PLAN_HEADER);
      expect(rows.map((r) => r[0])).toEqual(PLAN_ORDER.map((no) => `="${no}"`));
      await app.toast('Экспортировано: план акций (15 строк)');
    });

    test('12-5 · созданный черновик в экспорте, удалённый — нет', async ({ app, page }) => {
      await openPlan(app);
      await page.getByRole('button', { name: 'Создать строку плана' }).click();
      const dialog = page.getByRole('dialog', { name: /Создать строку плана/ });
      await expect(dialog.getByText('26-17')).toBeVisible();
      await dialog.getByLabel('Название акции').fill('E2E черновик');
      await app.pickDate(dialog.getByLabel('Дата начала'), '01.12.2026');
      await app.pickDate(dialog.getByLabel('Дата окончания'), '05.12.2026');
      await dialog.getByRole('button', { name: 'Создать' }).click();
      await app.toast('Черновик «E2E черновик» добавлен — выберите тип промо перед отправкой');

      const [, ...withDraft] = parseCsv((await exportCsv(app)).text);
      const draft = withDraft.find((r) => r[0] === '="26-17"');
      expect(draft).toBeDefined();
      expect(draft![1]).toBe('Черновик');
      expect(draft![4]).toBe('E2E черновик');

      await planRow(page, '26-17').getByRole('button', { name: 'Удалить' }).click();
      await app.toast('Черновик удалён');
      const [, ...after] = parseCsv((await exportCsv(app)).text);
      expect(after).toHaveLength(15);
      expect(after.some((r) => r[0] === '="26-17"')).toBe(false);
    });
  });

  test.describe('отклонение ОД', () => {
    test.use({ session: { user: 'u-2', role: ROLES.OD } });

    test('12-6 · в экспорте роль отклонившего — операционный директор', async ({ app, page }) => {
      test.fail(true, 'Дефект: отклонение ОД при плане «На согл. с КД» пишет роль КД (PlanMode.tsx:667-675)');
      await openPlan(app);
      await page.getByRole('checkbox', { name: 'Выбрать акцию 26-6' }).click();
      await page.getByRole('button', { name: /Отклонить выбранные/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Отклонить выбранные акции' });
      await dialog.getByLabel(/Комментарий/).fill('Сроки пересекаются с 26-7');
      await dialog.getByRole('button', { name: 'Отклонить' }).click();
      await app.toast('Отклонено акций: 1. План возвращён директору маркетинга');
      const [header, ...rows] = parseCsv((await exportCsv(app)).text);
      const row = rows.find((r) => r[0] === '="26-6"')!;
      expect(row[header.indexOf('Роль согласующего')]).toBe(ROLES.OD);
    });
  });
});

test.describe('№27 · распределение по категориям / КМ', () => {
  test('27-1 · КД видит распределение на строке плана', async ({ app, page }) => {
    await openPlan(app);
    await app.switchRole(ROLES.KD);
    await distributionBlock(page, '26-1', 4).click();
    await expect(page.getByText('Ответственный КМ').first()).toBeVisible();
    await expect(page.getByText(/Аудио и видео техника, геймерские товары/).first()).toBeVisible();
  });

  test('27-2 · ОД видит распределение согласованной КД строки только для просмотра', async ({ app, page }) => {
    await openPlan(app);
    await app.switchRole(ROLES.OD);
    const row = planRow(page, '26-1');
    await distributionBlock(page, '26-1', 4).click();
    await expect(
      page.getByText('Только просмотр — распределение задают директор маркетинга и коммерческий директор.').first(),
    ).toBeVisible();
    await expect(row.getByRole('button', { name: 'Распределить по категориям / КМ' })).toHaveCount(0);
    // контроль: у КД кнопка на этой строке есть
    await app.switchRole(ROLES.KD);
    await expect(row.getByRole('button', { name: 'Распределить по категориям / КМ' })).toBeVisible();
  });

  test('27-3 · кто может распределять', async ({ app, page }) => {
    const distribute = (no: string) =>
      planRow(page, no).getByRole('button', { name: 'Распределить по категориям / КМ' });
    await openPlan(app);
    await app.switchRole(ROLES.DM);
    await expect(distribute('26-8')).toBeVisible(); // черновик
    await expect(distribute('26-1')).toBeVisible();
    await app.switchRole(ROLES.KD);
    await expect(distribute('26-1')).toBeVisible(); // отправлена
    await expect(distribute('26-8')).toHaveCount(0); // черновик — нет
    for (const role of [ROLES.OD, ROLES.KM]) {
      await app.switchRole(role);
      await expect(page.getByRole('button', { name: 'Распределить по категориям / КМ' }), role).toHaveCount(0);
    }
  });

  test('27-4 · форма: период → даты, без дней недели, «Применить ко всем датам»', async ({ app, page }) => {
    await openPlan(app);
    await app.switchRole(ROLES.KD);
    const sheet = await openDistribution(app, '26-5');
    await expect(sheet.getByText('Период акции: 10.08.2026 — 24.08.2026')).toBeVisible();
    await expect(sheet.getByRole('button', { name: /^(Пн|Вт|Ср|Чт|Пт|Сб|Вс)$/ })).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: 'Сформировать даты' })).toBeVisible(); // контроль
    await generateDates(app, sheet, '10.08.2026', '12.08.2026');
    for (const day of ['Понедельник · 10.08.2026', 'Вторник · 11.08.2026', 'Среда · 12.08.2026']) {
      await expect(sheet.getByText(day)).toBeVisible();
    }
    await expect(sheet.getByText('Четверг · 13.08.2026')).toHaveCount(0);
    await applyToAll(app, sheet, CATEGORIES[6], KM.aliev);
    await saveDistribution(app, sheet);
    await distributionBlock(page, '26-5', 1).click();
    await expect(page.getByText('10.08.2026–12.08.2026').first()).toBeVisible();
    await expect(page.getByText(CATEGORIES[6]).first()).toBeVisible();
  });

  test.describe('директор маркетинга', () => {
    test.use({ session: { user: 'u-2', role: ROLES.DM } });

    test('27-5 · несколько связок на одну дату', async ({ app, page }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      await generateDates(app, sheet, '01.11.2026', '01.11.2026');
      await applyToAll(app, sheet, CATEGORIES[0], KM.aliev);
      await sheet.getByRole('button', { name: 'Добавить категорию / КМ на этот день' }).click();
      await sheet.locator('input[list="distribution-categories"]').last().fill(CATEGORIES[1]);
      await app.select(sheet.getByRole('combobox').last(), KM.yusupova);
      await saveDistribution(app, sheet);
      await distributionBlock(page, '26-11', 2).click();
      await expect(page.getByText(CATEGORIES[0]).first()).toBeVisible();
      await expect(page.getByText(CATEGORIES[1]).first()).toBeVisible();
    });

    test('27-6 · дубль категории на дату и незаполненный КМ не сохраняются', async ({ app }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      const save = sheet.getByRole('button', { name: 'Сохранить распределение' });
      await generateDates(app, sheet, '01.11.2026', '01.11.2026');
      await expect(sheet.getByText('Заполните категорию и ответственного КМ во всех строках.')).toBeVisible();
      await expect(save).toBeDisabled();
      await applyToAll(app, sheet, CATEGORIES[0], KM.aliev);
      await expect(save).toBeEnabled(); // контроль
      await sheet.getByRole('button', { name: 'Добавить категорию / КМ на этот день' }).click();
      await sheet.locator('input[list="distribution-categories"]').last().fill(CATEGORIES[0].toUpperCase());
      await app.select(sheet.getByRole('combobox').last(), KM.yusupova);
      await expect(sheet.getByText('Категория уже распределена на эту дату — уберите дубль.')).toBeVisible();
      await expect(save).toBeDisabled();
    });

    test('27-7 · без даты периода даты не формируются', async ({ app, page }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      const generate = sheet.getByRole('button', { name: 'Сформировать даты' });
      await expect(generate).toBeEnabled(); // контроль: период предзаполнен
      await sheet.getByLabel('Начало периода').click();
      await page.getByRole('grid').last().locator('button[name="day"][aria-selected="true"]').click();
      await expect(sheet.getByText('Укажите обе даты периода распределения.')).toBeVisible();
      await expect(generate).toBeDisabled();
    });

    test('27-8 · подряд идущие даты с одной категорией склеиваются в период', async ({ app, page }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      await generateDates(app, sheet, '01.11.2026', '05.11.2026');
      await applyToAll(app, sheet, CATEGORIES[4], KM.aliev);
      await saveDistribution(app, sheet);
      await distributionBlock(page, '26-11', 1).click();
      await expect(page.getByText('01.11.2026–05.11.2026').first()).toBeVisible();
      await expect(page.getByText(/Вс–Чт · 5 дн\./).first()).toBeVisible();
    });

    test('27-9 · девять согласованных категорий и ручная категория у ДМ и КД', async ({ app, page }) => {
      await openPlan(app);
      let sheet = await openDistribution(app, '26-11');
      const options = await sheet
        .locator('#distribution-categories option')
        .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
      expect(options).toEqual([...CATEGORIES]);
      await generateDates(app, sheet, '01.11.2026', '01.11.2026');
      await applyToAll(app, sheet, 'Товары для творчества', KM.aliev);
      await saveDistribution(app, sheet);
      await distributionBlock(page, '26-11', 1).click();
      await expect(page.getByText('Товары для творчества').first()).toBeVisible();

      await app.switchRole(ROLES.KD);
      sheet = await openDistribution(app, '26-5');
      await generateDates(app, sheet, '10.08.2026', '10.08.2026');
      await applyToAll(app, sheet, 'Уценённая техника', KM.aliev);
      await saveDistribution(app, sheet);
      await distributionBlock(page, '26-5', 1).click();
      await expect(page.getByText('Уценённая техника').first()).toBeVisible();
    });

    test('27-10 · распределение сохраняется после перезагрузки', async ({ app, page }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      await generateDates(app, sheet, '01.11.2026', '02.11.2026');
      await applyToAll(app, sheet, CATEGORIES[2], KM.aliev);
      await saveDistribution(app, sheet);
      await page.reload();
      await page.getByRole('tab', { name: 'План акций' }).click();
      await expect(distributionBlock(page, '26-11', 1)).toBeVisible();
    });

    test('К-3 · категория «constructor» не роняет экран', async ({ app, page }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      await generateDates(app, sheet, '01.11.2026', '01.11.2026');
      await applyToAll(app, sheet, 'constructor', KM.aliev);
      await saveDistribution(app, sheet);
      await distributionBlock(page, '26-11', 1).click();
      await expect(page.getByText('constructor', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });
});

test.describe('Доработки 25.09 · категории и «Переотправлено КМ»', () => {
  test.use({ session: { user: 'u-2', role: ROLES.KD } });

  test('К-1 · в блоке и в фильтре только согласованные категории', async ({ app, page }) => {
    await app.open('short-calendar');
    await page.getByRole('button', { name: /Распределение по категориям — развернуть/ }).click();
    await expect(page.getByText(CATEGORIES[6]).first()).toBeVisible(); // контроль
    for (const legacy of LEGACY_CATEGORIES) {
      await expect(page.getByText(legacy, { exact: true }), legacy).toHaveCount(0);
    }
    await page.getByRole('button', { name: /^Фильтры/ }).click();
    await page.getByRole('combobox').filter({ hasText: 'Все категории' }).click();
    const names = await page.getByRole('option').allTextContents();
    expect(names[0]).toBe('Все категории');
    for (const n of names.slice(1)) expect(CATEGORIES as readonly string[]).toContain(n.trim());
    expect(names.length).toBeGreaterThan(1);
  });

  test('К-2 · старое название из браузера показывается согласованным', async ({ app, page }) => {
    await app.open('short-calendar');
    await app.setStorage('promo:category-distribution', {
      [PROMO.p11.id]: [{ date: '2026-11-01', category: 'Телевизоры и аудио', responsibleKmId: 'km-1' }],
    });
    await page.reload();
    await page.getByRole('tab', { name: 'План акций' }).click();
    await distributionBlock(page, '26-11', 1).click();
    await expect(page.getByText('Аудио и видео техника, геймерские товары').first()).toBeVisible();
    await expect(page.getByText('Телевизоры и аудио', { exact: true })).toHaveCount(0);
  });

  test('К-4 · пульсирующая точка распределения только у КМ', async ({ app, page }) => {
    const dot = page.getByTitle('По акциям есть распределение по категориям — раскройте блок');
    await app.open('short-calendar');
    await app.switchRole(ROLES.KM);
    await expect(dot).toBeVisible();
    await app.switchRole(ROLES.KD);
    await expect(dot).toHaveCount(0);
  });

  test('П-1 · «Переотправлено КМ» у 26-1 ведёт в полный календарь', async ({ app, page }) => {
    await app.open('short-calendar');
    await planRow(page, '26-1').getByText('Переотправлено КМ').first().click();
    await expect(page).toHaveURL(new RegExp(`/full-calendar\\?promo=${PROMO.p1.id}$`));
    await expect(page.getByText(`Показана акция по ссылке из календаря готовности: № ${PROMO.p1.no}`)).toBeVisible();
    await expect(page.getByText('Элемент согласования не найден')).toHaveCount(0);
  });
});
```

Notes для исполнителя:
- Роль меняется только после первой загрузки страницы (`openPlan` → `switchRole`): меню аватара есть лишь в загруженном приложении.
- `planRow` работает и в таблице календаря (П-1), и в таблице плана: № промо стоит в собственном элементе.
- Если у полей периода нет подписи-`label` (`getByLabel` пуст) — найти триггеры по порядку `sheet.getByRole('button', { name: /\d{2}\.\d{2}\.\d{4}|Выберите дату/ })` первым и вторым и указать это в отчёте.

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/short-calendar.spec.ts`
Expected: `21 passed` (12-6 — «expected to fail», учитывается как пройденный). Разбор падений — по Global Constraints.

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/short-calendar.spec.ts
git commit -m "test(promo): e2e краткий календарь — экспорт (№12), распределение (№27), доработки 25.09"
```

---

### Task 4: `full-calendar.spec.ts` — №13, №14, отклонённое исключение, доступ №15 п.3

**Files:**
- Create: `Promo/e2e/full-calendar.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `app.open/switchRole/select/toast/gridRow/gridScrollRow` (Task 1); `ROLES`, `PROMO`, `LINES`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/full-calendar.spec.ts`:
```ts
import type { Locator, Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { LINES, PROMO, ROLES } from './data';

const ORANGE = /bg-orange-50\/70/;

async function openPromo(app: App, promoId: string) {
  await app.open(`full-calendar?promo=${promoId}`);
  await expect(app.page.getByText(/Показана акция по ссылке из календаря готовности/)).toBeVisible();
}

async function addNomenclature(app: App, name: string) {
  await app.page.getByRole('button', { name: 'Добавить номенклатуру' }).click();
  const dialog = app.page.getByRole('dialog', { name: 'Добавить номенклатуру' });
  await dialog.getByPlaceholder('Поиск по названию или коду 1С…').fill(name.split(' ')[0]);
  await dialog.getByRole('option', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&')) }).first().click();
}

function details(page: Page) {
  return page.getByRole('dialog', { name: 'Детали изменений' });
}

async function openDetails(app: App, line: string) {
  await app.gridRow(line).getByRole('button', { name: 'Просмотр деталей' }).first().click();
  await expect(details(app.page)).toBeVisible();
  return details(app.page);
}

async function closeDetails(page: Page) {
  await page.keyboard.press('Escape');
  await expect(details(page)).toBeHidden();
}

async function requestExclusion(app: App, line: string, reason: string) {
  await app.gridRow(line).getByRole('button', { name: 'Исключить позицию из акции' }).click();
  const dialog = app.page.getByRole('dialog', { name: 'Исключить позицию из акции' });
  await dialog.getByLabel(/Причина исключения/).fill(reason);
  await dialog.getByRole('button', { name: 'Отправить на согласование' }).click();
  await app.toast('Запрос на исключение позиции отправлен на согласование коммерческому директору.');
}

/** КД в панели «Детали изменений»: отклонить с причиной. */
async function kdReject(app: App, line: string, reason: string) {
  const sheet = await openDetails(app, line);
  await sheet.getByRole('button', { name: 'Отклонить', exact: true }).click();
  const dialog = app.page.getByRole('dialog', { name: /^Отклонить/ });
  await dialog.getByLabel(/Причина отклонения/).fill(reason);
  await dialog.getByRole('button', { name: 'Отклонить', exact: true }).click();
}

/** КД в панели: согласовать и подтвердить. */
async function kdApprove(app: App, line: string, confirmTitle: string | RegExp) {
  const sheet = await openDetails(app, line);
  await sheet.getByRole('button', { name: 'Согласовать', exact: true }).click();
  const confirm = app.page.getByRole('alertdialog', { name: confirmTitle });
  await confirm.getByRole('button', { name: 'Согласовать', exact: true }).click();
}

/** КМ правит «Скидка, %» в прокручиваемой панели (значение сейчас — `from`). */
async function editDiscount(app: App, line: string, from: string, to: string) {
  const row = await app.gridScrollRow(line);
  await row.getByText(`${from}%`, { exact: true }).click();
  const input = row.locator('input').first();
  await input.fill(to);
  await input.press('Enter');
}

const exclusionButton = (row: Locator) => row.getByRole('button', { name: 'Исключить позицию из акции' });

test.describe('№13 · черновики, исключение, решения, отклонения', () => {
  test.use({ session: { user: 'u-2', role: ROLES.KM } });

  test('13-1 · новая позиция КМ — черновик без иконки исключения', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await app.toast(`Номенклатура добавлена: ${LINES.fan}`);
    const row = app.gridRow(LINES.fan);
    await expect(row.getByText('Черновик', { exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Изменить строку' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Удалить строку' })).toBeVisible();
    await expect(exclusionButton(row)).toHaveCount(0);
    await expect(exclusionButton(app.gridRow(LINES.xiaomi))).toBeVisible(); // контроль
  });

  test('13-2 · черновик не виден КД и старшему КМ', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await expect(app.gridRow(LINES.fan)).toBeVisible();
    for (const role of [ROLES.KD, ROLES.SKM]) {
      await app.switchRole(role);
      await expect(app.gridRow(LINES.delonghi), role).toBeVisible(); // контроль
      await expect(app.gridRow(LINES.fan), role).toHaveCount(0);
    }
  });

  test('13-3 · без обязательных полей отправить нельзя', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await page.getByText(/3 строки: не заполнены обязательные поля/).click();
    const blockers = page.getByRole('dialog').filter({ hasText: 'Что мешает отправить' });
    const item = blockers.getByRole('button').filter({ hasText: LINES.fan });
    await expect(item).toContainText('Прогноз продаж');
    await expect(item).toContainText('Подарок (1)');
    await page.keyboard.press('Escape');
    await app.gridRow(LINES.fan).getByRole('checkbox', { name: 'Выбрать строку' }).click();
    await expect(page.getByRole('button', { name: 'Отправить выбранные (1)' })).toBeDisabled();
  });

  test('13-4 · отправленная позиция видна КД светло-оранжевой', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await app.gridRow(LINES.fan).getByRole('button', { name: 'Изменить строку' }).click();
    const edit = page.getByRole('dialog', { name: 'Редактировать строку' });
    await edit.getByLabel(/Прогноз продаж/).fill('10');
    await edit.getByRole('button', { name: 'Выбрать подарок' }).first().click();
    const gifts = page.getByRole('dialog', { name: 'Выбор подарочной номенклатуры' });
    await gifts.getByRole('option').first().click();
    await app.toast(/Подарок выбран: /);
    await page.keyboard.press('Escape');
    await expect(edit).toBeHidden();

    await app.gridRow(LINES.fan).getByRole('checkbox', { name: 'Выбрать строку' }).click();
    await page.getByRole('button', { name: 'Отправить выбранные (1)' }).click();
    await app.toast('Отправлено на согласование: 1 строка');
    await expect(app.gridRow(LINES.fan).getByText('Черновик', { exact: true })).toHaveCount(0);

    await app.switchRole(ROLES.KD);
    await expect(app.gridRow(LINES.fan)).toBeVisible();
    await expect(app.gridRow(LINES.fan)).toHaveClass(ORANGE);
  });

  test('13-5 · черновик удаляется', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await app.gridRow(LINES.fan).getByRole('button', { name: 'Удалить строку' }).click();
    await app.toast(`Номенклатура удалена: ${LINES.fan}. Изменения сохранены автоматически.`);
    await expect(app.gridRow(LINES.fan)).toHaveCount(0);
    await expect(app.gridRow(LINES.xiaomi)).toBeVisible(); // контроль
  });

  test('13-6 · дубль номенклатуры — тоже черновик с меткой «дубль»', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await expect(app.gridRow(LINES.xiaomi)).toHaveCount(1);
    await addNomenclature(app, LINES.xiaomi);
    const dup = page.getByRole('dialog', { name: 'Дубль номенклатуры' });
    await expect(dup.getByText(`Уже добавлена в эту акцию (${PROMO.p3.no}).`)).toBeVisible();
    await dup.getByRole('button', { name: 'Добавить дубль' }).click();
    await app.toast(/Дубль добавлен: /);
    await expect(app.gridRow(LINES.xiaomi)).toHaveCount(2);
    const added = app.gridRow(LINES.xiaomi).filter({ hasText: 'Черновик' });
    await expect(added).toHaveCount(1);
    await expect(added.getByText('дубль')).toBeVisible();
  });

  test('13-11 · отклонённая позиция находится фильтром, красная точка гаснет', async ({ app, page }) => {
    await app.open('full-calendar');
    await app.select(page.getByRole('combobox').filter({ hasText: 'Все статусы' }), 'Переотправлено на корректировку КМ');
    await expect(page.getByText(/Показано: 1 промо · 1 позиция/)).toBeVisible();
    const eye = app.gridRow(LINES.saundbar).getByRole('button', { name: 'Просмотр деталей' });
    await expect(eye.locator('span.bg-red-500')).toHaveCount(1);
    await eye.click();
    await expect(details(page).getByText('Возвращено на корректировку КМ')).toBeVisible();
    await expect(details(page).getByText(/Скидка выше согласованного лимита по категории/)).toBeVisible();
    await closeDetails(page);
    await expect(eye.locator('span.bg-red-500')).toHaveCount(0);
  });

  test('13-12 · просмотренная точка не возвращается после перезагрузки', async ({ app, page }) => {
    await app.open('full-calendar');
    const eye = () => app.gridRow(LINES.saundbar).getByRole('button', { name: 'Просмотр деталей' });
    await expect(eye().locator('span.bg-red-500')).toHaveCount(1);
    await eye().click();
    await closeDetails(page);
    await page.reload();
    await expect(eye()).toBeVisible();
    await expect(eye().locator('span.bg-red-500')).toHaveCount(0);
    await expect(
      app.gridRow(LINES.xiaomi).getByRole('button', { name: 'Просмотр деталей' }).locator('span.bg-red-500'),
    ).toHaveCount(1); // контроль: у другой отклонённой строки точка есть
  });

  test('13-14 · повторное отклонение просмотренной строки снова зажигает точку', async ({ app, page }) => {
    test.fail(true, 'Дефект: «просмотрено» хранится по id строки (full-calendar-rejection-store.ts:8-12)');
    await openPromo(app, PROMO.p3.id);
    await openDetails(app, LINES.xiaomi);
    await closeDetails(page);
    await requestExclusion(app, LINES.xiaomi, 'Модель снята с производства');
    await app.switchRole(ROLES.KD);
    await kdReject(app, LINES.xiaomi, 'Остатки ещё есть — оставить в акции');
    await app.switchRole(ROLES.KM);
    await expect(
      app.gridRow(LINES.xiaomi).getByRole('button', { name: 'Просмотр деталей' }).locator('span.bg-red-500'),
    ).toHaveCount(1);
  });
});

test.describe('№13 · проверяющие', () => {
  test.use({ session: { user: 'u-2', role: ROLES.SKM } });

  test('13-7 · иконка исключения у согласованных позиций, но не у ожидающих', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await expect(exclusionButton(app.gridRow(LINES.delonghi))).toBeVisible();
    await expect(exclusionButton(app.gridRow(LINES.dyson))).toBeVisible();
    await expect(exclusionButton(app.gridRow(LINES.lgOled))).toHaveCount(0); // ожидает добавления
    await expect(exclusionButton(app.gridRow(LINES.boschBlender))).toHaveCount(0); // уже на исключении
  });

  test('13-13 · позиция, добавленная старшим КМ, видна ему', async ({ app }) => {
    test.fail(true, 'Дефект: строка старшего КМ — черновик, скрытый от проверяющих, в т.ч. от него (FullCalendarPage.tsx:355-356)');
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await app.toast(`Номенклатура добавлена: ${LINES.fan}`);
    await expect(app.gridRow(LINES.fan)).toBeVisible();
  });
});

test.describe('№13–14 · коммерческий директор', () => {
  test.use({ session: { user: 'u-2', role: ROLES.KD } });

  test('13-8 · решения только в панели «Детали изменений»', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    const rows = page.locator('div.group\\/row');
    await expect(rows.first()).toBeVisible();
    await expect(rows.getByRole('button', { name: /^(Согласовать|Отклонить)$/ })).toHaveCount(0);
    await expect(rows.getByRole('checkbox')).toHaveCount(0);
    const sheet = await openDetails(app, LINES.delonghi);
    await expect(sheet.getByText('Решение: изменение данных позиции')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Согласовать', exact: true })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Отклонить', exact: true })).toBeVisible();
  });

  test('13-9 · отклонение без причины невозможно', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    const sheet = await openDetails(app, LINES.delonghi);
    await sheet.getByRole('button', { name: 'Отклонить', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Отклонить изменение' });
    const reject = dialog.getByRole('button', { name: 'Отклонить', exact: true });
    await expect(reject).toBeDisabled();
    await dialog.getByLabel(/Причина отклонения/).fill('   ');
    await expect(reject).toBeDisabled();
    await dialog.getByLabel(/Причина отклонения/).fill('Скидка выше лимита');
    await expect(reject).toBeEnabled();
    await reject.click();
    await app.toast('Изменение отклонено — строка возвращена КМ с причиной.');
  });

  test('13-10 · согласованное изменение становится актуальным', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await expect(app.gridRow(LINES.delonghi)).toHaveClass(ORANGE);
    await kdApprove(app, LINES.delonghi, 'Согласовать изменение?');
    await app.toast('Изменение согласовано — новые значения стали актуальными.');
    await expect(app.gridRow(LINES.delonghi)).not.toHaveClass(ORANGE);
    const values = await app.gridScrollRow(LINES.delonghi);
    await expect(values).toContainText('18%');
    await expect(values).toContainText('55');
  });

  test('14-4 · все три вида повторных действий подсвечены', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await expect(app.gridRow(LINES.delonghi)).toHaveClass(ORANGE); // изменение
    await expect(app.gridRow(LINES.lgOled)).toHaveClass(ORANGE); // добавление
    await expect(app.gridRow(LINES.boschBlender)).toHaveClass(ORANGE); // исключение
    await expect(app.gridRow(LINES.dyson)).not.toHaveClass(ORANGE); // контроль: согласованная
  });

  test('14-5 · детали изменения: кто, когда, комментарий, было/стало', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    const sheet = await openDetails(app, LINES.delonghi);
    await expect(sheet).toContainText('Изменение цены и прогноза');
    await expect(sheet).toContainText('28.07.2026 11:40');
    await expect(sheet).toContainText('Комментарий КМ к правке');
    await expect(sheet).toContainText(/40[\s\S]*55/);
    await expect(sheet).toContainText(/16%[\s\S]*18%/);
  });

  test('14-6 · согласованное исключение убирает позицию', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await kdApprove(app, LINES.boschBlender, 'Согласовать исключение позиции?');
    await app.toast('Исключение согласовано — позиция исключена из акции.');
    await expect(app.gridRow(LINES.boschBlender)).toHaveCount(0);
    await page.getByText('Скрыть отменённое').click();
    const row = app.gridRow(LINES.boschBlender);
    await expect(row.getByText('Удалено')).toBeVisible();
    await expect(row).toHaveClass(/line-through/);
  });

  test('14-7 · решение по исключению сохраняется после перезагрузки', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await kdApprove(app, LINES.boschBlender, 'Согласовать исключение позиции?');
    await app.toast('Исключение согласовано — позиция исключена из акции.');
    await page.reload();
    await expect(app.gridRow(LINES.dyson)).toBeVisible(); // контроль
    await expect(app.gridRow(LINES.boschBlender)).toHaveCount(0);
  });
});

test.describe('№14 · запрос на исключение', () => {
  test.use({ session: { user: 'u-2', role: ROLES.KM } });

  test('14-1 · после запроса строка подсвечена, иконки исключения нет', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    const row = app.gridRow(LINES.xiaomi);
    await expect(exclusionButton(row)).toBeVisible();
    await expect(row).not.toHaveClass(ORANGE);
    await requestExclusion(app, LINES.xiaomi, 'Модель снята с производства');
    await expect(row).toHaveClass(ORANGE);
    await expect(exclusionButton(row)).toHaveCount(0);
  });

  test('14-2 · запрос без причины не отправляется', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await exclusionButton(app.gridRow(LINES.xiaomi)).click();
    const dialog = page.getByRole('dialog', { name: 'Исключить позицию из акции' });
    const send = dialog.getByRole('button', { name: 'Отправить на согласование' });
    await expect(send).toBeDisabled();
    await dialog.getByLabel(/Причина исключения/).fill('   ');
    await expect(send).toBeDisabled();
    await dialog.getByLabel(/Причина исключения/).fill('Нет поставок');
    await expect(send).toBeEnabled();
  });

  test('14-3 · детали запроса читаемы: тип, автор, дата, комментарий', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await requestExclusion(app, LINES.xiaomi, 'Модель снята с производства');
    const sheet = await openDetails(app, LINES.xiaomi);
    await expect(sheet).toContainText('Запрос на исключение из промо');
    await expect(sheet).toContainText('Категорийный менеджер (КМ)');
    await expect(sheet).toContainText(/Дата отправки[\s\S]*28\.09\.2026/);
    await expect(sheet).toContainText('Модель снята с производства');
    const label = sheet.getByText('Кто отправил');
    expect(await label.evaluate((el) => getComputedStyle(el).fontSize)).toBe('14px');
    expect(
      await label.evaluate((el) => getComputedStyle(el.closest('[class*="px-6"]') as Element).paddingLeft),
    ).toBe('24px');
  });

  test('ОИ-1 · отклонённое исключение не убирает позицию при согласовании правки', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await requestExclusion(app, LINES.xiaomi, 'Модель снята с производства');
    await app.switchRole(ROLES.KD);
    await kdReject(app, LINES.xiaomi, 'Остатки ещё есть — оставить в акции');
    await app.toast('Исключение отклонено — позиция остаётся в акции, КМ увидит причину.');
    await closeDetails(app.page);

    await app.switchRole(ROLES.KM);
    await editDiscount(app, LINES.xiaomi, '14', '20');
    await app.toast('Изменение отправлено на повторное согласование — в таблице пока показаны согласованные данные.');
    await expect(await app.gridScrollRow(LINES.xiaomi)).toContainText('14%');
    const sheet = await openDetails(app, LINES.xiaomi);
    await expect(sheet).toContainText('Изменение данных позиции');
    await expect(sheet).toContainText(/Скидка[\s\S]*14%[\s\S]*20%/);
    await expect(sheet).toContainText(/Комментарий[\s\S]*—/);
    await expect(sheet).not.toContainText('Модель снята с производства');
    await closeDetails(app.page);

    await app.switchRole(ROLES.KD);
    await kdApprove(app, LINES.xiaomi, 'Согласовать изменение?');
    await app.toast('Изменение согласовано — новые значения стали актуальными.');
    await expect(app.gridRow(LINES.xiaomi)).toBeVisible();
    await expect(await app.gridScrollRow(LINES.xiaomi)).toContainText('20%');
  });

  test('ОИ-2 · ввод того же значения не создаёт запроса', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await app.dismissToasts();
    await editDiscount(app, LINES.xiaomi, '14', '14');
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    await expect(app.gridRow(LINES.xiaomi)).not.toHaveClass(ORANGE);
    await editDiscount(app, LINES.xiaomi, '14', '15'); // контроль: реальная правка даёт запрос
    await expect(app.gridRow(LINES.xiaomi)).toHaveClass(ORANGE);
  });

  test('ОИ-3 · согласуется последняя правка, а не первая', async ({ app }) => {
    test.fail(true, 'Дефект: повторная правка поля с value меняет только now (full-calendar-status.ts:191)');
    await openPromo(app, PROMO.p3.id);
    await editDiscount(app, LINES.xiaomi, '14', '18');
    await app.toast(/Изменение отправлено на повторное согласование/);
    await app.switchRole(ROLES.KD);
    await kdApprove(app, LINES.xiaomi, 'Согласовать изменение?');
    await expect(await app.gridScrollRow(LINES.xiaomi)).toContainText('18%');
  });
});

test.describe('№15 п.3 · доступ к полному календарю', () => {
  test('15-3 · роли без доступа не видят раздел ни в меню, ни по адресу', async ({ app, page }) => {
    await app.open('reports');
    const navItem = page.getByRole('link', { name: 'Полный промо-календарь' });
    await expect(navItem).toBeVisible(); // контроль: у Администратора пункт есть
    for (const role of [ROLES.MKT, ROLES.DM, ROLES.PUR, ROLES.ANL]) {
      await app.switchRole(role);
      await expect(page.getByRole('link', { name: 'Отчёты смежным отделам' }), role).toBeVisible();
      await expect(navItem, role).toHaveCount(0);
      await app.open('full-calendar');
      await expect(page.getByText('Нет доступа к полному промо-календарю.'), role).toBeVisible();
      await app.open('reports');
    }
  });
});
```

Notes:
- Точное значение до правки в ОИ-3 — 14% (посев), правка 18%; при дефекте согласование применяет 20% из посевного отклонённого запроса.
- Если выбор в «Добавить номенклатуру» — не `option`, а кнопка/строка списка: поправить `addNomenclature` один раз, сигнатуру не менять.
- Если карточка «Редактировать строку» сохраняется кнопкой, а не автосохранением, — нажать её вместо `Escape` в 13-4.

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/full-calendar.spec.ts`
Expected: `25 passed` (13-13, 13-14, ОИ-3 — «expected to fail»).

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/full-calendar.spec.ts
git commit -m "test(promo): e2e полный календарь — черновики, исключение, решения КД (№13–14)"
```

---

### Task 5: `reports.spec.ts` — №15, №16

**Files:**
- Create: `Promo/e2e/reports.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `readXlsx`, `app.open/switchRole/download/toast` (Task 1); `ROLES`, `PROMO`, `LINES`, `KM`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/reports.spec.ts`:
```ts
import type { Page } from '@playwright/test';
import { test, expect, readXlsx } from './fixtures';
import { KM, LINES, PROMO, ROLES } from './data';

const GIFT_COLUMNS = [
  'Подарок (1)', 'Подарок (1): наличие, %', 'Подарок (1): остаток',
  'Подарок (2)', 'Подарок (2): наличие, %', 'Подарок (2): остаток',
  'Подарок на выбор (1)', 'Подарок на выбор (1): наличие, %', 'Подарок на выбор (1): остаток',
];

const INSTALMENT_COLUMNS = [
  '12 мес: платёж (старая)', '12 мес: размер скидки',
  '24 мес: платёж (старая)', '24 мес: размер скидки',
  '36 мес: платёж (старая)', '36 мес: размер скидки',
];

/** Колонки отчёта по порядку: у каждой колонки воронка «Фильтр по «<название>»». */
async function reportColumns(page: Page) {
  return page
    .getByRole('button', { name: /^Фильтр по «/ })
    .evaluateAll((els) => els.map((el) => (el.getAttribute('aria-label') ?? '').replace(/^Фильтр по «|»$/g, '')));
}

const shown = (page: Page) => page.getByText(/^Показано: \d+ позици/);

async function openFunnel(page: Page, column: string) {
  await page.getByRole('button', { name: `Фильтр по «${column}»` }).click();
  const popover = page.getByRole('dialog').filter({ has: page.getByPlaceholder('Поиск…') });
  await expect(popover).toBeVisible();
  return popover;
}

test.describe('№15 · отчёт маркетинга', () => {
  test('15-1 · подарки как в полном календаре', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const cols = await reportColumns(page);
    const start = cols.indexOf('Подарок (1)');
    expect(start).toBeGreaterThan(0);
    expect(cols.slice(start, start + 9)).toEqual(GIFT_COLUMNS);
    await expect(page.getByText('Мультиварка Redmond RMC').first()).toBeVisible();
    await expect(page.getByText('Утюг Philips Azur').first()).toBeVisible();
  });

  test('15-2 · закупу и аналитике — подарки без наличия и остатка', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    expect(await reportColumns(page)).toContain('Подарок (1): остаток'); // контроль
    for (const dept of ['Закуп', 'Аналитика']) {
      await page.getByRole('tab', { name: dept }).click();
      const cols = await reportColumns(page);
      for (const c of ['Подарок (1)', 'Подарок (2)', 'Подарок на выбор (1)']) expect(cols, dept).toContain(c);
      for (const c of GIFT_COLUMNS.filter((g) => g.includes(':'))) expect(cols, dept).not.toContain(c);
    }
  });

  test('15-4 · платёж и скидка на 12, 24, 36 мес.', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const cols = await reportColumns(page);
    for (const c of INSTALMENT_COLUMNS) expect(cols).toContain(c);
  });

  test('15-5 · сотрудникам отделов — только свой отдел', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    await expect(page.getByRole('tab', { name: 'Закуп' })).toBeVisible(); // контроль
    for (const [role, dept] of [[ROLES.MKT, 'Маркетинг'], [ROLES.PUR, 'Закуп'], [ROLES.ANL, 'Аналитика']] as const) {
      await app.switchRole(role);
      await expect(page.getByRole('tab'), role).toHaveCount(0);
      await expect(page.getByText(dept, { exact: true }).first(), role).toBeVisible();
    }
  });

  test('15-6 · фильтр «ФИО КМ» как в Excel', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    await expect(shown(page)).toHaveText('Показано: 5 позиций');
    let popover = await openFunnel(page, 'ФИО КМ');
    await popover.getByPlaceholder('Поиск…').fill('Алиев');
    await popover.getByRole('checkbox', { name: KM.aliev }).click();
    await page.keyboard.press('Escape');
    await expect(shown(page)).toHaveText('Показано: 2 позиции');
    await expect(page.getByRole('button', { name: /^Фильтры/ })).toContainText('1');

    popover = await openFunnel(page, 'ФИО КМ');
    await popover.getByRole('button', { name: 'Выбрать все' }).click();
    await expect(popover.getByRole('button', { name: 'Выбрать все' })).toBeDisabled();
    await popover.getByRole('button', { name: 'Очистить фильтр' }).click();
    await page.keyboard.press('Escape');
    await expect(shown(page)).toHaveText('Показано: 5 позиций');
  });

  test('15-7 · фильтр «Номенклатура»: поиск и множественный выбор', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const popover = await openFunnel(page, 'Номенклатура');
    const search = popover.getByPlaceholder('Поиск…');
    await search.fill('zzzz');
    await expect(popover.getByText('Ничего не найдено')).toBeVisible();
    await search.fill('Dyson');
    await popover.getByRole('checkbox', { name: LINES.dyson }).click();
    await search.fill("De'Longhi");
    await popover.getByRole('checkbox', { name: LINES.delonghi }).click();
    await page.keyboard.press('Escape');
    await expect(shown(page)).toHaveText('Показано: 2 позиции');
  });

  test('15-8 · пустой результат и «Сбросить фильтры»', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const change = await openFunnel(page, 'Изменение');
    await change.getByRole('checkbox', { name: 'Исключено' }).click(); // в 26-3 исключённых нет
    await page.keyboard.press('Escape');
    await expect(page.getByText('В отчёте пока нет строк.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Экспорт' })).toBeDisabled();
    await page.getByRole('button', { name: /^Фильтры/ }).click();
    await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
    await expect(shown(page)).toHaveText('Показано: 5 позиций');
    await expect(page.getByRole('button', { name: 'Экспорт' })).toBeEnabled();
  });

  test('15-9 · выгрузка .xlsx с подарками и рассрочкой', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const file = await app.download(() => page.getByRole('button', { name: 'Экспорт' }).click());
    expect(file.name).toBe(`Отчёт_Маркетинг_${PROMO.p3.id}_2026-09-28.xlsx`);
    const xlsx = readXlsx(file.buffer);
    expect(xlsx.sheetNames).toContain('Маркетинг');
    const [header, ...rows] = xlsx.rows('Маркетинг');
    expect(header[0]).toBe('Изменение');
    for (const c of [...GIFT_COLUMNS, ...INSTALMENT_COLUMNS]) expect(header).toContain(c);
    expect(rows).toHaveLength(5);
  });
});

test.describe('№16 · добавленные и исключённые позиции', () => {
  test('16-1 · в 26-15 есть все три вида изменений', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.u15.id}`);
    for (const t of ['Добавлено: 1', 'Изменено: 1', 'Исключено: 1', 'Всего позиций: 3']) {
      await expect(page.getByText(t)).toBeVisible();
    }
  });

  test('16-2 · исключённая позиция остаётся зачёркнутой с отметкой', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.u15.id}`);
    const name = page.getByText(LINES.boschWasher, { exact: true }).first();
    await expect(name).toBeVisible();
    const row = name.locator('xpath=ancestor::*[contains(@class,"flex")][1]');
    await expect(row).toContainText('Исключено');
    expect(await name.evaluate((el) => !!el.closest('.line-through') || getComputedStyle(el).textDecorationLine.includes('line-through'))).toBe(true);
  });

  test('16-3 · «Только изменения» оставляет изменённые, добавленные и исключённые', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    await page.getByRole('switch', { name: 'Только изменения' }).click();
    await expect(shown(page)).toHaveText('Показано: 2 позиции'); // 26-3: только «Изменено»
    await app.open(`reports?promo=${PROMO.u15.id}`);
    await page.getByRole('switch', { name: 'Только изменения' }).click();
    await expect(shown(page)).toHaveText('Показано: 3 позиции');
    for (const n of [LINES.samsungFridge, LINES.lgFridge, LINES.boschWasher]) {
      await expect(page.getByText(n, { exact: true }).first()).toBeVisible();
    }
  });

  test('16-4 · подсказка «Было / Стало» у изменённой ячейки', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    await page.getByText(/^4\s440\s000 сум$/).first().hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toContainText(/Было: 4\s990\s000 сум/);
    await expect(tip).toContainText(/Стало: 4\s440\s000 сум/);
  });

  test('16-5 · ознакомление снимает подсветку, но не счётчики', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const highlighted = page.locator('.ring-amber-300');
    await expect(highlighted.first()).toBeVisible();
    await page.getByRole('button', { name: /Ознакомиться со всеми изменениями \(2\)/ }).click();
    await app.toast('Изменения отмечены как прочитанные. Статус акции не изменён.');
    await expect(page.getByRole('button', { name: /Ознакомиться со всеми изменениями/ })).toHaveCount(0);
    await expect(highlighted).toHaveCount(0);
    await expect(page.getByText('Изменено: 2')).toBeVisible();
  });

  test('16-6 · ознакомление сохраняется и действует только для своего отдела', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    await page.getByRole('button', { name: /Ознакомиться со всеми изменениями \(2\)/ }).click();
    await app.toast('Изменения отмечены как прочитанные. Статус акции не изменён.');
    await page.reload();
    await expect(page.getByText('Изменено: 2')).toBeVisible();
    await expect(page.getByRole('button', { name: /Ознакомиться со всеми изменениями/ })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Закуп' }).click();
    await expect(page.getByRole('button', { name: /Ознакомиться со всеми изменениями \(2\)/ })).toBeVisible();
  });

  test('16-7 · «Кто ознакомился» — только руководящим ролям', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const who = page.getByRole('button', { name: 'Кто ознакомился' });
    for (const role of [ROLES.ADMIN, ROLES.KD, ROLES.SKM]) {
      await app.switchRole(role);
      await expect(who, role).toBeVisible();
    }
    await who.click();
    const drawer = page.getByRole('dialog', { name: 'Кто ознакомился с изменениями' });
    await expect(drawer).toContainText('Изменённых позиций: 2');
    await expect(drawer).toContainText('Пользователей: 3');
    await page.keyboard.press('Escape');
    for (const role of [ROLES.KM, ROLES.MKT]) {
      await app.switchRole(role);
      await expect(who, role).toHaveCount(0);
    }
  });
});
```

Notes:
- 16-2: если зачёркивание стоит на ячейках прокручиваемой панели, а не на названии, — проверить класс `line-through` у строки прокручиваемой панели той же позиции; ожидание («позиция зачёркнута») не менять.
- 16-1…16-3 намеренно идут по 26-15: в 26-3 «Добавлено: 0 · Исключено: 0» (спецификация §5.3).

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/reports.spec.ts`
Expected: `15 passed`.

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/reports.spec.ts
git commit -m "test(promo): e2e отчёты смежным отделам — подарки, рассрочка, фильтры, изменения (№15–16)"
```

---

### Task 6: `notifications.spec.ts` — №17, настройки 25.09

**Files:**
- Create: `Promo/e2e/notifications.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `app.open/switchRole/notification/newTabAs` (Task 1); `ROLES`, `PROMO`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/notifications.spec.ts`:
```ts
import type { Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { PROMO, ROLES } from './data';

const CARD = 'div.flex.gap-3.rounded-lg.border';
const cards = (page: Page) => page.locator(CARD);

type Seed = [type: string, promoNo: string];

async function expectExactly(app: App, expected: Seed[]) {
  await app.open('notifications');
  for (const [type, no] of expected) await expect(app.notification(type, no), `${type} ${no}`).toHaveCount(1);
  await expect(cards(app.page)).toHaveCount(expected.length);
}

async function expectYouAs(page: Page, role: string) {
  await expect(page.getByText('Вам как:').first()).toBeVisible();
  await expect(cards(page).filter({ hasText: 'Вам как:' }).first()).toContainText(role);
  await expect(page.getByText('Получают роли:')).toHaveCount(0);
}

test.describe('№17 · КМ', () => {
  test.use({ session: { user: 'u-4' } });

  test('17-1 · только события схемы КМ', async ({ app, page }) => {
    await expectExactly(app, [
      ['Назначение КМ', '26-2'],
      ['Возврат на корректировку', '26-1'],
      ['Согласовано КД', '26-3'],
      ['Заявка о неучастии', '26-6'],
    ]);
    await expect(page.getByText('2 непрочит.')).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Повторная отправка' })).toHaveCount(0);
    await expect(cards(page).filter({ hasText: 'Акция отменена' })).toHaveCount(0);
    await expectYouAs(page, ROLES.KM);
  });

  test('17-8 · «Отметить прочитанным» сохраняется и не трогает других пользователей', async ({ app, page }) => {
    await app.open('notifications');
    const card = app.notification('Назначение КМ', '26-2');
    await expect(page.getByText('2 непрочит.')).toBeVisible();
    await card.getByRole('button', { name: 'Отметить прочитанным' }).click();
    await expect(page.getByText('1 непрочит.')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Отметить прочитанным' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('1 непрочит.')).toBeVisible();
    await expect(app.notification('Назначение КМ', '26-2').getByRole('button', { name: 'Отметить прочитанным' })).toHaveCount(0);

    const other = await app.newTabAs('u-8', ROLES.KM);
    await other.open('notifications');
    await expect(
      other.notification('Назначение КМ', '26-2').getByRole('button', { name: 'Отметить прочитанным' }),
    ).toBeVisible();
  });

  test('17-9 · настройки уведомлений закрыты не-администратору', async ({ app, page }) => {
    await app.open('notification-settings');
    await expect(page.getByText('Недостаточно прав. Экран доступен только роли «Администратор».')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Уведомления' })).toBeVisible(); // контроль
    await expect(page.getByRole('link', { name: 'Настройки уведомлений' })).toHaveCount(0);
  });
});

test.describe('№17 · старший КМ', () => {
  test.use({ session: { user: 'u-5' } });

  test('17-2 · повторная отправка по 26-2 есть, по 26-1 — нет', async ({ app, page }) => {
    await expectExactly(app, [
      ['Новое промо на согласование', '26-1'],
      ['Повторная отправка', '26-2'],
      ['Срок истекает сегодня', '26-9'],
      ['Автопередача КД', '26-2'],
    ]);
    await expect(app.notification('Повторная отправка', '26-1')).toHaveCount(0);
    await expect(page.getByText('4 непрочит.')).toBeVisible();
    await expectYouAs(page, ROLES.SKM);
  });
});

test.describe('№17 · коммерческий директор', () => {
  test.use({ session: { user: 'u-1' } });

  test('17-3 · повторная отправка по 26-1 есть, события этапа старшего КМ — нет', async ({ app, page }) => {
    await expectExactly(app, [
      ['Новое промо на согласование', '26-8'],
      ['Повторная отправка', '26-1'],
      ['Автопередача КД', '26-2'],
      ['Просрочка срока согласования', '26-6'],
    ]);
    await expect(app.notification('Повторная отправка', '26-2')).toHaveCount(0);
    await expect(app.notification('Новое промо на согласование', '26-1')).toHaveCount(0);
    await expect(app.notification('Срок истекает сегодня', '26-9')).toHaveCount(0);
    await expect(page.getByText('4 непрочит.')).toBeVisible();
    await expectYouAs(page, ROLES.KD);
  });
});

test.describe('№17 · смежные отделы', () => {
  test.use({ session: { user: 'u-6' } });

  const REPORT_EVENTS: Seed[] = [
    ['Новая версия отчёта', '26-3'],
    ['Новая версия отчёта', '26-15'],
    ['Новый отчёт по акции', '26-7'],
  ];

  test('17-4 · только отчётные события, у каждого «Открыть отчёт»', async ({ app, page }) => {
    await expectExactly(app, REPORT_EVENTS);
    for (const [type, no] of REPORT_EVENTS) {
      await expect(app.notification(type, no).getByRole('link', { name: 'Открыть отчёт' })).toBeVisible();
    }
    await app.notification('Новая версия отчёта', '26-15').getByRole('link', { name: 'Открыть отчёт' }).click();
    await expect(page).toHaveURL(new RegExp(`/reports\\?promo=${PROMO.u15.id}$`));
    await expect(page.getByText('Добавлено: 1')).toBeVisible();
  });

  test('17-5 · закупу и аналитике — тот же набор', async ({ app }) => {
    await app.open('notifications');
    for (const role of [ROLES.PUR, ROLES.ANL]) {
      await app.switchRole(role);
      await expectExactly(app, REPORT_EVENTS);
    }
  });

  test('17-6 · в карточке — роль, в которой пришло уведомление', async ({ app, page }) => {
    await app.open('notifications');
    await expectYouAs(page, ROLES.MKT);
  });
});

test.describe('№17 · администратор и настройки (25.09)', () => {
  const kmCancelled = (page: Page) =>
    page.getByRole('switch', { name: `${ROLES.KM}: Акция отменена` });

  test('17-7 · компактные блоки по ролям', async ({ app, page }) => {
    await app.open('notifications');
    for (const title of ['КМ', 'Старший КМ', 'Коммерческий директор', 'Смежные отделы', 'Директор маркетинга и операционный директор']) {
      await expect(page.getByText(title, { exact: true }).first(), title).toBeVisible();
    }
    await page.getByRole('button', { name: 'Показать все (8)' }).click();
    await expect(page.getByRole('button', { name: 'Свернуть' })).toBeVisible();
  });

  test('НУ-1 · включённый тип появляется у роли', async ({ app, page }) => {
    await app.open('notifications');
    await app.switchRole(ROLES.KM);
    await expect(app.notification('Возврат на корректировку', '26-1')).toHaveCount(1); // контроль
    await expect(app.notification('Акция отменена', PROMO.p4.no)).toHaveCount(0);
    await app.switchRole(ROLES.ADMIN);
    await app.open('notification-settings');
    await kmCancelled(page).click();
    await expect(kmCancelled(page)).toBeChecked();
    await app.switchRole(ROLES.KM);
    await app.open('notifications');
    await expect(app.notification('Акция отменена', PROMO.p4.no)).toHaveCount(1);
  });

  test('НУ-2 · настройка сохраняется, «Сбросить к умолчаниям» её снимает', async ({ app, page }) => {
    await app.open('notification-settings');
    await kmCancelled(page).click();
    await page.reload();
    await expect(kmCancelled(page)).toBeChecked();
    await page.getByRole('button', { name: 'Сбросить к умолчаниям' }).click();
    await expect(kmCancelled(page)).not.toBeChecked();
    await app.switchRole(ROLES.KM);
    await app.open('notifications');
    await expect(app.notification('Возврат на корректировку', '26-1')).toHaveCount(1); // контроль
    await expect(app.notification('Акция отменена', PROMO.p4.no)).toHaveCount(0);
  });

  test('НУ-3 · выключенный тип пропадает у роли', async ({ app, page }) => {
    await app.open('notifications');
    await app.switchRole(ROLES.KD);
    await expect(app.notification('Просрочка срока согласования', '26-6')).toHaveCount(1);
    await app.switchRole(ROLES.ADMIN);
    await app.open('notification-settings');
    const sw = page.getByRole('switch', { name: `${ROLES.KD}: Просрочка срока согласования` });
    await expect(sw).toBeChecked();
    await sw.click();
    await app.switchRole(ROLES.KD);
    await app.open('notifications');
    await expect(app.notification('Автопередача КД', '26-2')).toHaveCount(1); // контроль
    await expect(app.notification('Просрочка срока согласования', '26-6')).toHaveCount(0);
  });

  test('НУ-4 · настройка не расширяет адресата события этапа', async ({ app, page }) => {
    await app.open('notification-settings');
    await expect(page.getByRole('switch', { name: `${ROLES.KD}: Повторная отправка` })).toBeChecked();
    await app.switchRole(ROLES.KD);
    await app.open('notifications');
    await expect(app.notification('Повторная отправка', '26-1')).toHaveCount(1);
    await expect(app.notification('Повторная отправка', '26-2')).toHaveCount(0);
  });
});
```

Notes:
- `expectExactly` проверяет и наличие каждого ожидаемого события, и общее число карточек — так «лишние» события ловятся без перечисления всех 19.
- u-6 и u-8 — реальные не-администраторы: «Вам как» у Администратора не показывается (NotificationItem.tsx:87).

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/notifications.spec.ts`
Expected: `13 passed`.

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/notifications.spec.ts
git commit -m "test(promo): e2e уведомления — маршрутизация по ролям и настройки (№17)"
```

---

### Task 7: `audit.spec.ts` — №18, №19, №20, отклонение 26-1

**Files:**
- Create: `Promo/e2e/audit.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `app.open/switchRole/select/pickDate` (Task 1); `ROLES`, `KM`, `LINES`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/audit.spec.ts`:
```ts
import type { Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { KM, LINES, ROLES } from './data';

const RANGE = /^(\d{2})\.(\d{2})\.(\d{4}) — \d{2}\.\d{2}\.\d{4}/;

async function openTab(app: App, tab: string) {
  await app.open('audit');
  await app.page.getByRole('tab', { name: tab }).click();
}

const combo = (page: Page, text: string) => page.getByRole('combobox').filter({ hasText: text });
const bodyRows = (page: Page) => page.getByRole('row').filter({ has: page.getByRole('cell') });

async function openParticipant(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).first().click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe('№18 · «Сроки по плану»', () => {
  test('18-1 · «Период плана» — диапазоны дат по возрастанию', async ({ app, page }) => {
    await openTab(app, 'Сроки по плану');
    await combo(page, 'Все периоды плана').click();
    const options = (await page.getByRole('option').allTextContents()).map((t) => t.trim());
    expect(options[0]).toBe('Все периоды плана');
    const ranges = options.slice(1);
    expect(ranges.length).toBeGreaterThan(1);
    const starts = ranges.map((r) => {
      const m = r.match(RANGE);
      expect(m, r).not.toBeNull();
      return `${m![3]}${m![2]}${m![1]}`;
    });
    expect(starts).toEqual([...starts].sort());
    expect(ranges.some((r) => r.includes('Ноябрь 2026'))).toBe(true); // подпись месяца
  });

  test('18-2 · выбор периода оставляет только его строки', async ({ app, page }) => {
    await openTab(app, 'Сроки по плану');
    const total = await bodyRows(page).count();
    await app.select(combo(page, 'Все периоды плана'), /^01\.11\.2026 — 30\.11\.2026/);
    const rows = bodyRows(page);
    expect(await rows.count()).toBeGreaterThan(0);
    expect(await rows.count()).toBeLessThan(total);
    for (const text of await rows.allTextContents()) expect(text).toContain('01.11.2026 — 30.11.2026');
    await page.getByRole('button', { name: 'Очистить' }).click();
    await expect(bodyRows(page)).toHaveCount(total);
  });
});

test.describe('№19 · автопередача КД', () => {
  test('19-1 · строка и комментарий в согласованной формулировке', async ({ app, page }) => {
    await openTab(app, 'Сроки по промо и отчётам');
    await app.select(combo(page, 'Все контрольные точки'), 'Авто-передача КД (просрочка старшего КМ)');
    await expect(page.getByText('Показано: 1')).toBeVisible();
    const row = bodyRows(page);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('26-2');
    await expect(row).toContainText(KM.ismailov);
    await expect(row).toContainText('Старший КМ');
    await expect(row).toContainText('Просрочено');
    await expect(row).toContainText(
      'Старший КМ: Исмаилов Жасур — просрочил срок согласования, промо автоматически передано КД (КМ: Тошматов Фаррух).',
    );
  });

  test.describe('КМ', () => {
    test.use({ session: { user: 'u-4' } });

    test('19-2 · КМ не видит контрольную точку автопередачи', async ({ app, page }) => {
      await openTab(app, 'Сроки по промо и отчётам');
      await combo(page, 'Все контрольные точки').click();
      const options = page.getByRole('option');
      await expect(options.first()).toBeVisible(); // контроль
      await expect(options.filter({ hasText: 'Авто-передача КД' })).toHaveCount(0);
    });
  });
});

test.describe('№20 · «Показатели участников»', () => {
  test('20-1 · без периода — только задачи с наступившим дедлайном', async ({ app, page }) => {
    await openTab(app, 'Показатели участников');
    const drawer = await openParticipant(page, KM.karimov);
    await expect(drawer).toContainText(/Задачи с наступившим дедлайном: \d+/);
    await expect(drawer).toContainText('Период не выбран — показаны только задачи с наступившим дедлайном, как в расчёте рейтинга.');
    await expect(drawer.getByText('Дедлайн не наступил')).toHaveCount(0);
  });

  test('20-2 · с периодом — будущие задачи помечены', async ({ app, page }) => {
    await openTab(app, 'Показатели участников');
    await app.pickDate(page.getByRole('button', { name: /Выберите дату/ }).first(), '01.11.2026');
    await app.pickDate(page.getByRole('button', { name: /Выберите дату/ }).first(), '30.11.2026');
    const drawer = await openParticipant(page, KM.karimov);
    await expect(drawer).toContainText(/Все задачи: \d+/);
    await expect(drawer.getByText('Дедлайн не наступил').first()).toBeVisible();
  });

  test('20-3 · клик по числу открывает задачи одной метрики', async ({ app, page }) => {
    await openTab(app, 'Показатели участников');
    const row = bodyRows(page).filter({ hasText: KM.karimov });
    const onTime = row.getByRole('button').filter({ hasText: /^\d+$/ }).first();
    await onTime.click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/Промо с дедлайном|Вовремя|С просрочкой/);
  });

  test('20-4 · КМ видит только себя, ОД — всех КМ без данных', async ({ app, page }) => {
    await openTab(app, 'Показатели участников');
    await app.switchRole(ROLES.KM);
    await openTab(app, 'Показатели участников');
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page)).toContainText(KM.karimov);
    await expect(page.getByRole('combobox').first()).toBeDisabled();
    await app.switchRole(ROLES.OD);
    await openTab(app, 'Показатели участников');
    await expect(bodyRows(page)).toHaveCount(5);
    for (const text of await bodyRows(page).allTextContents()) expect(text).toContain('Нет данных');
  });
});

test.describe('Аудит-лог', () => {
  test('А-1 · отклонение «Saund-бар» 25.11 видно администратору и КМ', async ({ app, page }) => {
    const expectRow = async () => {
      const row = bodyRows(page).filter({ hasText: LINES.saundbar }).filter({ hasText: 'отклонение' });
      await expect(row.first()).toBeVisible();
      await expect(row.first()).toContainText('25.11.2026');
      await expect(row.first()).toContainText(ROLES.KD);
      await expect(row.first()).toContainText('Переотправлено на корректировку КМ');
      await expect(row.first()).toContainText(/Скидка выше согласованного лимита по категории/);
    };
    await openTab(app, 'Аудит-лог');
    await expectRow();
    await app.switchRole(ROLES.KM);
    await openTab(app, 'Аудит-лог');
    await expectRow();
  });

  test('А-2 · «Ключевые» и «Все действия» — только у администратора', async ({ app, page }) => {
    await openTab(app, 'Аудит-лог');
    await expect(page.getByText('Записей: 20')).toBeVisible();
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    await expect(page.getByText('Записей: 25')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ключевые действия' })).toBeVisible();
    await app.switchRole(ROLES.KD);
    await openTab(app, 'Аудит-лог');
    await expect(page.getByText(/Записей: \d+/)).toBeVisible(); // контроль
    await expect(page.getByRole('button', { name: 'Ключевые действия' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Все действия', exact: true })).toHaveCount(0);
  });
});
```

Notes:
- Если таблицы вкладок — не `<table>` (нет ролей `row`/`cell`), заменить `bodyRows` одной функцией на локатор строки из разметки и указать это в отчёте.
- В 20-2 поля периода — `DatePickerField` с подписью «Выберите дату»; после выбора первого поля подпись второго остаётся «Выберите дату», поэтому оба раза — `.first()`.
- В 20-4 «Роль» — первый combobox вкладки; если это не так, найти его по подписи.

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/audit.spec.ts`
Expected: `10 passed`.

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/audit.spec.ts
git commit -m "test(promo): e2e аудит — периоды плана, автопередача, показатели (№18–20)"
```

---

### Task 8: `users.spec.ts` — №21, №22, №24, №25, №26

**Files:**
- Create: `Promo/e2e/users.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, `app.open/switchRole/select/pickDate/toast/userRow/userAction/openJournal/storage/expectPasswordsNotLeaked` (Task 1); `ROLES`, `USERS`, `FIXED_NOW`.
- Produces: —

- [ ] **Step 1: Написать тесты**

Create `Promo/e2e/users.spec.ts`:
```ts
import type { Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { FIXED_NOW, ROLES, USERS } from './data';

const tableScroller = (page: Page) =>
  page.locator('div.overflow-x-auto').filter({ has: page.getByRole('table') }).first();
const stickyTrack = (page: Page) => page.locator('div[aria-hidden="true"].sticky.bottom-0');

async function editUser(app: App, userId: string) {
  await app.open(`users/${userId}`);
  await app.page.getByRole('button', { name: 'Редактировать' }).click();
  const dialog = app.page.getByRole('dialog', { name: 'Редактировать пользователя' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openAudit(app: App) {
  await app.open('audit');
  await app.page.getByRole('tab', { name: 'Аудит-лог' }).click();
}

async function assignSubstitute(app: App, who: RegExp, from: string, to: string, reason: string) {
  const page = app.page;
  await page.getByRole('button', { name: /Назначить (замещение|другого)/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Назначить замещение КД' });
  await app.select(dialog.getByRole('combobox').first(), who);
  const [fromBtn, toBtn] = [dialog.getByLabel('С даты'), dialog.getByLabel('По дату')];
  await app.pickDate(fromBtn, from);
  await app.pickDate(toBtn, to);
  await dialog.getByLabel(/Причина/).fill(reason);
  await dialog.getByRole('button', { name: 'Назначить', exact: true }).click();
  await app.toast('Замещение назначено');
}

async function slaTexts(app: App) {
  await app.switchRole(ROLES.KD);
  await app.open('approvals');
  const text = (await app.page.locator('main').textContent()) ?? '';
  await app.switchRole(ROLES.ADMIN);
  return text.match(/\d+ раб\. дн\. \(до \d{2}\.\d{2}\.\d{4}\)|\+\d+ дн\./g) ?? [];
}

test.describe('№21 / №24 п.1 · таблица по ширине экрана', () => {
  test('21-1 · на 1440 без горизонтальной прокрутки', async ({ app, page }) => {
    await app.open('users');
    await expect(app.userRow(USERS['u-2'].name)).toBeVisible();
    const [scroll, client] = await tableScroller(page).evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(scroll).toBeLessThanOrEqual(client);
    await expect(stickyTrack(page)).toHaveCount(0);
  });

  test.describe('узкий экран', () => {
    test.use({ viewport: { width: 1000, height: 800 } });

    test('21-2 · закреплённая полоса прокрутки видна и двигает таблицу', async ({ app, page }) => {
      await app.open('users');
      const track = stickyTrack(page);
      await expect(track).toBeVisible();
      const box = await track.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(800);
      await track.evaluate((el) => {
        el.scrollLeft = 200;
        el.dispatchEvent(new Event('scroll'));
      });
      await expect.poll(() => tableScroller(page).evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });

    test('21-3 · «ФИО · email» остаётся слева при прокрутке', async ({ app, page }) => {
      await app.open('users');
      const row = app.userRow(USERS['u-4'].name);
      const first = row.locator('td').first();
      const other = row.locator('td').nth(3);
      const before = { first: (await first.boundingBox())!.x, other: (await other.boundingBox())!.x };
      await tableScroller(page).evaluate((el) => {
        el.scrollLeft = 300;
      });
      await expect.poll(async () => (await other.boundingBox())!.x).toBeLessThan(before.other); // контроль
      expect(Math.abs((await first.boundingBox())!.x - before.first)).toBeLessThanOrEqual(1);
    });
  });

  test.describe('телефон', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('21-4 · карточки вместо таблицы', async ({ app, page }) => {
      await app.open('users');
      await expect(page.getByText(/Создал\(а\): /).first()).toBeVisible();
      await expect(page.getByRole('table')).toBeHidden();
    });
  });
});

test.describe('№22 · учётные записи и роли', () => {
  test('22-1 · «Создана · кем» заполнена у всех', async ({ app, page }) => {
    await app.open('users');
    const rows = page.getByRole('row').filter({ has: page.locator('td') });
    await expect(rows).toHaveCount(8);
    for (const text of await rows.locator('td:nth-child(6)').allTextContents()) {
      expect(text).toMatch(/\d{2}\.\d{2}\.\d{4}\s*\S+/);
    }
    await expect(app.userRow(USERS['u-2'].name)).toContainText('Первичная настройка системы');
    await expect(app.userRow(USERS['u-7'].name)).toContainText('Алиева Нигора');
  });

  test('22-2 · роли разделены по типам, истёкшая помечена', async ({ app, page }) => {
    await app.open('users/u-4');
    await page.getByRole('tab', { name: 'Роли и доступ' }).click();
    for (const g of ['Основная роль', 'Дополнительные роли', 'Временные роли']) {
      await expect(page.getByText(g, { exact: true })).toBeVisible();
    }
    const temp = page.getByText(/с 01\.05\.2026 по 31\.05\.2026/);
    await expect(temp).toBeVisible();
    await expect(page.getByText('срок истёк').first()).toBeVisible();
  });

  test('22-3 · истёкшая временная роль не действует', async ({ app, page }) => {
    await app.open('users');
    await app.select(page.getByRole('combobox').filter({ hasText: 'Все роли' }), ROLES.SKM);
    await expect(page.getByText('Показано: 1')).toBeVisible();
    await expect(app.userRow(USERS['u-5'].name)).toBeVisible(); // контроль
    await expect(app.userRow(USERS['u-4'].name)).toHaveCount(0);
  });

  test('22-4 · деактивация и активация', async ({ app }) => {
    await app.open('users');
    const row = app.userRow(USERS['u-4'].name);
    await expect(row).toContainText('Активен');
    await app.userAction(USERS['u-4'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await expect(row).toContainText('Деактивирован');
    await app.userAction(USERS['u-4'].name, 'Активировать');
    await app.toast('Пользователь активирован');
    await expect(row).toContainText('Активен');
  });

  test('22-5 · статус «Деактивирован» сохраняется', async ({ app, page }) => {
    await app.open('users');
    await app.userAction(USERS['u-4'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await page.reload();
    await expect(app.userRow(USERS['u-4'].name)).toContainText('Деактивирован');
  });

  test('22-6 · должно остаться не менее двух администраторов', async ({ app, page }) => {
    await app.open('users');
    await app.userRow(USERS['u-2'].name).getByRole('button', { name: 'Действия' }).click();
    for (const item of ['Отозвать права администратора', 'Деактивировать']) {
      const mi = page.getByRole('menuitem', { name: item, exact: true });
      await expect(mi).toHaveAttribute('aria-disabled', 'true');
      await expect(mi).toHaveAttribute('title', 'Должно остаться не менее двух администраторов');
    }
    await page.keyboard.press('Escape');
    await app.userRow(USERS['u-4'].name).getByRole('button', { name: 'Действия' }).click();
    await expect(page.getByRole('menuitem', { name: 'Деактивировать', exact: true })).not.toHaveAttribute('aria-disabled', 'true'); // контроль
    await page.keyboard.press('Escape');

    const dialog = await editUser(app, 'u-2');
    await dialog.getByRole('button', { name: ROLES.ADMIN, exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Должно остаться не менее двух администраторов.');
  });

  test.describe('администратор подразделения', () => {
    test.use({ session: { user: 'u-6' } });

    test('22-7 · видит только своё подразделение, не выдаёт глобальные роли', async ({ app, page }) => {
      await app.open('users');
      await expect(page.getByText('Вы — администратор подразделения «Маркетинг»: управление ограничено вашим подразделением.')).toBeVisible();
      await expect(page.getByText('Показано: 1')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Создать пользователя' })).toHaveCount(0);
      const dialog = await editUser(app, 'u-6');
      for (const role of [ROLES.ADMIN, ROLES.KD]) {
        const chip = dialog.getByRole('button', { name: role, exact: true }).first();
        await expect(chip, role).toBeDisabled();
        await expect(chip, role).toHaveAttribute('title', 'Изменять эту роль может только глобальный администратор');
      }
      await expect(dialog.getByRole('button', { name: ROLES.KM, exact: true }).first()).toBeEnabled(); // контроль
    });
  });

  test.describe('не администратор', () => {
    test.use({ session: { user: 'u-2', role: ROLES.KM } });

    test('22-8 · экран закрыт', async ({ app, page }) => {
      await app.open('users');
      await expect(page.getByText('Доступ только для администраторов')).toBeVisible();
      await expect(page.getByRole('table')).toHaveCount(0);
    });
  });

  test('22-9 · проверки формы создания', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: 'Создать пользователя' }).click();
    const form = page.getByRole('dialog', { name: 'Новый пользователь' });
    await form.getByLabel('ФИО').fill('Тест Проверок');
    await form.getByLabel('Email (логин)').fill('not-an-email');
    await form.getByRole('button', { name: 'Создать' }).click();
    await expect(form.getByText('Введите корректный email.')).toBeVisible();
    await form.getByLabel('Email (логин)').fill('check@texnomart.uz');

    await form.getByRole('button', { name: /Добавить временную роль/ }).click();
    await expect(form.getByText('У временной роли укажите обе даты периода.')).toBeVisible();
    const dates = form.getByRole('button', { name: /Выберите дату/ });
    await app.pickDate(dates.first(), '10.10.2026');
    await app.pickDate(form.getByRole('button', { name: /Выберите дату/ }).first(), '05.10.2026');
    await expect(form.getByText('Дата окончания временной роли раньше даты начала.')).toBeVisible();

    await app.select(form.getByRole('combobox').filter({ hasText: /Выберите роль|роль/i }).last(), ROLES.KM);
    await expect(form.getByText(`Роль «${ROLES.KM}» уже назначена постоянно — временная не нужна.`)).toBeVisible();
  });
});

test.describe('№24 · роли в журнале', () => {
  test('24-1 · временная роль с периодом и основанием', async ({ app, page }) => {
    const dialog = await editUser(app, 'u-8');
    await dialog.getByRole('button', { name: /Добавить временную роль/ }).click();
    await app.select(dialog.getByRole('combobox').last(), ROLES.SKM);
    await app.pickDate(dialog.getByRole('button', { name: /Выберите дату/ }).first(), '01.10.2026');
    await app.pickDate(dialog.getByRole('button', { name: /Выберите дату/ }).first(), '15.10.2026');
    await dialog.getByLabel(/Основание/).last().fill('Отпуск старшего КМ');
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');

    await page.getByRole('tab', { name: 'Роли и доступ' }).click();
    await expect(page.getByText(/с 01\.10\.2026 по 15\.10\.2026/)).toBeVisible();
    await expect(page.getByText(/назначил\(а\): Администратор Системы/).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Журнал действий' }).click();
    const journal = page.getByRole('tabpanel');
    await expect(journal.getByText('изменение ролей', { exact: true })).toBeVisible();
    await expect(journal).toContainText('(временно 01.10.2026–15.10.2026)');
    await expect(journal).toContainText('Основание: Отпуск старшего КМ');
    await expect(journal).toContainText('Администратор Системы');
    await expect(journal).toContainText('28.09.2026 12:00');
  });

  test('24-2 · запись в аудите — только в «Все действия»', async ({ app, page }) => {
    const dialog = await editUser(app, 'u-5');
    await dialog.getByRole('button', { name: ROLES.KM, exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');
    await openAudit(app);
    const roleChange = page.getByRole('row').filter({ hasText: 'изменение ролей' });
    await expect(page.getByText(/Записей: \d+/)).toBeVisible();
    await expect(roleChange).toHaveCount(0);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    await expect(roleChange.first()).toBeVisible();
    await expect(roleChange.first()).toContainText('Пользователь');
  });

  test('24-3 · снятие дополнительной роли — «было → стало»', async ({ app, page }) => {
    const dialog = await editUser(app, 'u-5');
    await dialog.getByRole('button', { name: ROLES.KM, exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');
    const journal = await app.openJournal('u-5');
    await expect(journal.getByText('изменение ролей', { exact: true })).toBeVisible();
    await expect(journal).toContainText('Роли');
    await expect(journal).toContainText(ROLES.KM);
    await expect(journal).toContainText('→');
  });
});

test.describe('№25 · временное замещение КД', () => {
  test('25-1 · досрочное снятие пишется в историю и аудит', async ({ app, page }) => {
    await app.open('users');
    await expect(app.userRow(USERS['u-8'].name)).toContainText('Уполномоченное лицо КД до 31.12');
    await expect(page.getByText('c 15.06.2026 по 31.12.2026').first()).toBeVisible(); // латинская «c» — как в коде
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Снять замещение?' });
    await confirm.getByRole('button', { name: 'Снять', exact: true }).click();
    await app.toast('Замещение снято');
    await expect(page.getByText('Замещение не назначено')).toBeVisible();
    await page.getByRole('button', { name: /История замещений/ }).click();
    await expect(page.getByText(/Снято досрочно 28\.09\.2026/)).toBeVisible();

    await openAudit(app);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: 'снятие замещения' });
    await expect(row.first()).toContainText('c 15.06.2026 по 31.12.2026');
    await expect(row.first()).toContainText('Отпуск коммерческого директора');
  });

  test('25-2 · назначение пишется в аудит', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Снять', exact: true }).click();
    await app.toast('Замещение снято');
    await assignSubstitute(app, /^Исмаилов Жасур/, '28.09.2026', '10.10.2026', 'Командировка КД');
    await expect(page.getByText('c 28.09.2026 по 10.10.2026').first()).toBeVisible();

    await openAudit(app);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: 'назначение замещения' });
    await expect(row.first()).toContainText('Замещение КД: c 28.09.2026 по 10.10.2026');
    await expect(row.first()).toContainText('Командировка КД');
    await expect(row.first()).toContainText('Администратор Системы');
  });

  test('25-3 · без причины и с обратным периодом не назначается', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: /Назначить (замещение|другого)/ }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Назначить замещение КД' });
    const submit = dialog.getByRole('button', { name: 'Назначить', exact: true });
    await app.select(dialog.getByRole('combobox').first(), /^Исмаилов Жасур/);
    await app.pickDate(dialog.getByLabel('С даты'), '10.10.2026');
    await app.pickDate(dialog.getByLabel('По дату'), '05.10.2026');
    await expect(dialog.getByText('Дата окончания раньше даты начала.')).toBeVisible();
    await expect(submit).toBeDisabled();
    await app.pickDate(dialog.getByLabel('По дату'), '20.10.2026');
    await expect(submit).toBeDisabled(); // причины ещё нет
    await dialog.getByLabel(/Причина/).fill('Командировка');
    await expect(submit).toBeEnabled();
  });

  test('25-4 · история замещений свёрнута и показывает истёкшие', async ({ app, page }) => {
    await app.open('users');
    const toggle = page.getByRole('button', { name: 'История замещений (2)' });
    await expect(page.getByText('Срок истёк 31.03.2026')).toBeHidden();
    await toggle.click();
    await expect(page.getByText('Срок истёк 31.03.2026')).toBeVisible();
  });

  test('25-5 · назначение и снятие не меняют сроки согласования', async ({ app, page }) => {
    await app.open('users');
    const before = await slaTexts(app);
    expect(before.length).toBeGreaterThan(0);
    await app.open('users');
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Снять', exact: true }).click();
    await app.toast('Замещение снято');
    expect(await slaTexts(app)).toEqual(before);
    await app.open('users');
    await assignSubstitute(app, /^Исмаилов Жасур/, '28.09.2026', '10.10.2026', 'Командировка КД');
    expect(await slaTexts(app)).toEqual(before);
  });

  test('25-6 · замещение с будущей даты — запланировано', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Снять', exact: true }).click();
    await assignSubstitute(app, /^Исмаилов Жасур/, '05.10.2026', '10.10.2026', 'Отпуск КД');
    await expect(page.getByText('Замещение не назначено')).toBeVisible();
    await expect(page.getByText(/Запланировано с 05\.10\.2026/)).toBeVisible();
  });

  test.describe('после окончания срока', () => {
    test.use({ now: new Date('2027-01-02T12:00:00+05:00') });

    test('25-7 · замещение истекает само', async ({ app, page }) => {
      await app.open('users');
      await expect(app.userRow(USERS['u-8'].name)).toBeVisible();
      await expect(app.userRow(USERS['u-8'].name)).not.toContainText('Уполномоченное лицо КД');
      await expect(page.getByText('Замещение не назначено')).toBeVisible();
      await page.getByRole('button', { name: /История замещений/ }).click();
      await expect(page.getByText('Срок истёк 31.12.2026')).toBeVisible();
    });
  });

  test('25-8 · новое замещение при действующем пишет снятие предыдущего', async ({ app, page }) => {
    test.fail(true, 'Дефект: предыдущее замещение снимается без записи в аудит (KdSubstitutionPanel.tsx:131-154)');
    await app.open('users');
    await assignSubstitute(app, /^Исмаилов Жасур/, '28.09.2026', '10.10.2026', 'Командировка КД');
    await openAudit(app);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'назначение замещения' }).first()).toBeVisible(); // контроль
    await expect(page.getByRole('row').filter({ hasText: 'снятие замещения' }).first()).toBeVisible();
  });
});

test.describe('№26 · журнал действий по пользователю', () => {
  test('26-1 · подразделение, должность, руководитель — «было → стало»', async ({ app }) => {
    const dialog = await editUser(app, 'u-4');
    await app.select(dialog.getByRole('combobox').filter({ hasText: 'Категорийный менеджмент' }), 'Маркетинг');
    await dialog.getByLabel('Должность').fill('Ведущий категорийный менеджер');
    await app.select(dialog.getByRole('combobox').filter({ hasText: USERS['u-5'].name }), USERS['u-1'].name);
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');
    const journal = await app.openJournal('u-4');
    await expect(journal.getByText('изменение профиля', { exact: true })).toBeVisible();
    await expect(journal).toContainText(/Подразделение[\s\S]*Категорийный менеджмент[\s\S]*Маркетинг/);
    await expect(journal).toContainText(/Должность[\s\S]*Категорийный менеджер[\s\S]*Ведущий категорийный менеджер/);
    await expect(journal).toContainText(/Руководитель[\s\S]*Исмаилов Жасур[\s\S]*Сардор Мавлянов/);
  });

  test('26-2 · деактивация, активация, сброс пароля — без пароля', async ({ app }) => {
    await app.open('users');
    await app.userAction(USERS['u-4'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await app.userAction(USERS['u-4'].name, 'Активировать');
    await app.toast('Пользователь активирован');
    await app.userAction(USERS['u-4'].name, 'Сбросить пароль');
    await app.toast('Пароль сброшен');
    const done = app.page.getByRole('button', { name: 'Готово' });
    if (await done.isVisible()) await done.click();
    const users = JSON.parse((await app.storage('promo:users')) ?? '[]') as { id: string; password: string }[];
    const temp = users.find((u) => u.id === 'u-4')!.password;

    const journal = await app.openJournal('u-4');
    for (const [action, comment] of [
      ['деактивация', 'Учётная запись деактивирована'],
      ['восстановление', 'Учётная запись активирована'],
      ['сброс пароля', 'Сброшен пароль, выдан новый временный'],
    ]) {
      await expect(journal.getByText(action, { exact: true }), action).toBeVisible();
      await expect(journal.getByText(comment), comment).toBeVisible();
    }
    await app.expectPasswordsNotLeaked([temp]);
  });

  test('26-3 · права администратора — назначение и отзыв', async ({ app }) => {
    await app.open('users');
    await app.userAction(USERS['u-5'].name, 'Назначить администратором');
    await app.toast('Назначены права администратора');
    await app.userAction(USERS['u-5'].name, 'Отозвать права администратора');
    await app.toast('Права администратора отозваны');
    const journal = await app.openJournal('u-5');
    await expect(journal.getByText('назначение прав', { exact: true })).toBeVisible();
    await expect(journal.getByText('отзыв прав', { exact: true })).toBeVisible();
  });

  test('26-4 · журнал — от новых к старым', async ({ app, page }) => {
    await app.open('users');
    await app.userAction(USERS['u-5'].name, 'Назначить администратором');
    await app.toast('Назначены права администратора');
    await page.clock.setFixedTime(new Date(FIXED_NOW.getTime() + 60_000));
    await app.userAction(USERS['u-5'].name, 'Отозвать права администратора');
    await app.toast('Права администратора отозваны');
    const journal = await app.openJournal('u-5');
    const text = (await journal.textContent()) ?? '';
    expect(text.indexOf('отзыв прав')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('отзыв прав')).toBeLessThan(text.indexOf('назначение прав'));
    await expect(journal).toContainText('28.09.2026 12:01');
  });
});
```

Notes:
- 24-2 намеренно использует снятие роли у u-5 (короче 24-1): проверяется разделение «Ключевые / Все действия», а не содержание записи.
- Чипы ролей в диалоге — кнопки-переключатели; если это `checkbox`/`switch`, заменить роль в `getByRole` один раз и указать это в отчёте.
- Порядок полей дат в форме пользователя: после выбора даты начала подпись «Выберите дату» остаётся только у даты окончания, поэтому оба раза `.first()`.

- [ ] **Step 2: Прогнать**

Run: `npx playwright test e2e/users.spec.ts`
Expected: `28 passed` (25-8 — «expected to fail»).

- [ ] **Step 3: Commit**

```bash
git add Promo/e2e/users.spec.ts
git commit -m "test(promo): e2e пользователи — таблица, роли, замещение КД, журнал (№21–26)"
```

---

### Task 9: Стабильность, прогон против GitHub Pages, документация

**Files:**
- Modify: `Promo/CLAUDE.md` (раздел `## Commands`)
- Modify: `CLAUDE.md` (корень: Commands, Tech Stack, дерево)
- Modify: `HISTORY.md`, `docs/AI_CONTEXT.md`
- Modify: `tasks/lessons.md` (если есть уроки)

**Interfaces:**
- Consumes: весь набор (Tasks 1–8).
- Produces: —

- [ ] **Step 1: Три прогона подряд**

Run (из `D:\Texnomart\Promo`):
```bash
npx playwright test && npx playwright test && npx playwright test
```
Expected: каждый прогон — `128 passed` (123 теста + 5 обвязки; 5 дефектных — «expected to fail»), без `flaky`. Если какой-то тест проходит нестабильно — найти причину (ожидание анимации, тост поверх кнопки, общее состояние) и исправить тест, не добавляя `retries` и `waitForTimeout`.

- [ ] **Step 2: Прогон против GitHub Pages**

Run:
```bash
BASE_URL=https://elyorrakhmatullaev.github.io/Texnomart/promo/ npx playwright test
```
(PowerShell: `$env:BASE_URL='https://elyorrakhmatullaev.github.io/Texnomart/promo/'; npx playwright test`)
Expected: тот же результат. Pages отстаёт от `main` до деплоя — если после пуша прошло мало времени, дождаться окончания workflow `deploy.yml`. Любое падение только на Pages — это ошибка обвязки (путь с `/`, прямой переход без фолбэка `404.html`); исправить в тесте или `fixtures.ts`.

- [ ] **Step 3: `Promo/CLAUDE.md`**

В раздел `## Commands` добавить:
````markdown
### E2E (Playwright)

```bash
corepack pnpm --filter promo test:e2e          # весь набор; сам поднимает Vite на :5183
npx playwright test e2e/users.spec.ts           # один файл (из Promo/)
npx playwright show-report                      # HTML-отчёт последнего прогона
BASE_URL=https://elyorrakhmatullaev.github.io/Texnomart/promo/ npx playwright test   # против GitHub Pages
```

- Тесты — `Promo/e2e/` (обвязка `fixtures.ts`, сиды `data.ts`, 7 файлов по разделам); спецификация — `docs/superpowers/specs/2026-09-28-promo-e2e-playwright-design.md`.
- Браузер — установленный Chrome (`channel: 'chrome'`). Без Chrome: `PW_CHANNEL=chromium` + `npx playwright install chromium`.
- Время зафиксировано на 28.09.2026 12:00 (Ташкент): сиды считают сроки от «сейчас».
- Известные дефекты — `test.fail` с описанием; когда дефект исправят, прогон сообщит «expected to fail but passed» — снять пометку.
````

- [ ] **Step 4: Корневой `CLAUDE.md`**

- В блок `## Commands` после `pnpm build:promo` добавить строку: `pnpm test:e2e:promo              # Playwright e2e Promo (Promo/e2e)`.
- В `## Tech Stack` добавить пункт: `- **E2E-тесты**: Playwright (\`@playwright/test\`) — только Promo, \`Promo/e2e/\`, Chrome-канал`.
- В дереве `## Monorepo Structure` под `Promo/` добавить строку `│   ├── e2e/                    # Playwright e2e (fixtures, data, 7 spec files)` и `│   ├── playwright.config.ts`.
- В строке таблицы проектов «Texnomart Promo» в конец описания добавить: `**28.09 — Playwright e2e по пунктам №12–27** (123 теста, 5 известных дефектов как \`test.fail\`, \`corepack pnpm test:e2e:promo\`).`

- [ ] **Step 5: `HISTORY.md` и `docs/AI_CONTEXT.md`**

`HISTORY.md` — новая запись сверху:
```markdown
## 2026-09-28 — Promo: Playwright e2e по пунктам №12–27

Первый автоматический набор в репозитории: `@playwright/test` в `Promo/`, 123 теста в 7 файлах (вход и №23 · краткий календарь №12/№27 · полный календарь №13/№14 · отчёты №15/№16 · уведомления №17 · аудит №18–20 · пользователи №21–26) + самопроверка обвязки. По каждому пункту — основной путь, негативные случаи, роли и доступ, сохранение после перезагрузки, граничные случаи. Время зафиксировано на 28.09.2026 12:00 (Ташкент), вход кладётся в sessionStorage, роль меняется через меню аватара без перезагрузки. Код приложения не менялся.

Пять расхождений с требованиями оформлены как `test.fail`: роль отклонившего ОД в экспорте плана (№12), строка старшего КМ скрыта от него самого (№13), красная точка при повторном отклонении (№13), повторная правка до решения (доработка 25.09), молчаливое снятие замещения (№25). Ещё 10 дефектов вне №12–27 — в спецификации §5.2. Спецификация и план — `docs/superpowers/{specs,plans}/2026-09-28-promo-e2e-playwright*`.
```
`docs/AI_CONTEXT.md` — в шапке `> Last updated:` заменить на `2026-09-28 (**Promo — Playwright e2e по пунктам №12–27.** 123 теста в \`Promo/e2e/\`, запуск \`corepack pnpm test:e2e:promo\`; 5 известных дефектов — \`test.fail\`, список и 10 дефектов вне пунктов — в спецификации §5. See HISTORY.)`, прежнюю строку сделать `> Prev:`.

- [ ] **Step 6: Уроки**

Если при реализации нашлись неочевидные вещи (например, разметка календаря дат, поведение тостов под фиксированным временем, двойной DOM), добавить их в `tasks/lessons.md` разделом `## 2026-09-28 — Promo: Playwright e2e` в формате файла (заголовок-правило + 2–4 предложения).

- [ ] **Step 7: Commit**

```bash
git add Promo/CLAUDE.md CLAUDE.md HISTORY.md docs/AI_CONTEXT.md tasks/lessons.md
git commit -m "docs: Playwright e2e Promo — команды, история, контекст"
```
