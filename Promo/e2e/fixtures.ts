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
  // F4: BOM через String.fromCharCode, а не литеральный символ в исходнике —
  // иммунно к редактору, который мог бы снять invisible-символ и превратить
  // проверку в no-op.
  const BOM = String.fromCharCode(0xfeff);
  const src = text.startsWith(BOM) ? text.slice(BOM.length) : text;
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
      let shown = Number.NaN;
      for (let step = 0; step < 48; step++) {
        const labelId = await grid.getAttribute('aria-labelledby');
        const caption = ((await page.locator(`[id="${labelId}"]`).textContent()) ?? '').trim().toLowerCase();
        const [monthName, yearText] = caption.split(/\s+/);
        shown = Number(yearText) * 12 + RU_MONTHS.indexOf(monthName);
        if (shown === target) break;
        await page
          .locator(shown < target ? 'button[name="next-month"]' : 'button[name="previous-month"]')
          .last()
          .click();
      }
      // F9: без этой проверки промах навигации (например, «ноябрь» не нашёлся в
      // RU_MONTHS из-за опечатки) тихо кликнул бы по номеру дня в чужом месяце.
      expect(shown, `pickDate(${ddmmyyyy}): календарь не долистался до нужного месяца`).toBe(target);
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
      // AuditLogTable.tsx:251,282 render «Записей: N» twice — a desktop copy
      // (`.hidden md:block`) and a mobile copy (`.md:hidden`) — both present in
      // the DOM at once; only the desktop one is visible at our 1440×900
      // default viewport. `.filter({ visible: true })` (F12) picks it by actual
      // visibility rather than DOM order, so it stays correct at any viewport.
      await expect(page.getByText(/Записей: \d+/).filter({ visible: true })).toBeVisible();
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
