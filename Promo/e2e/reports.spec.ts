import type { Page } from '@playwright/test';
import { test, expect, readXlsx } from './fixtures';
import { KM, LINES, PROMO, ROLES, USERS } from './data';

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

/**
 * Открыть воронку заголовка колонки. Ровно один Radix Popover открыт в любой
 * момент, поэтому берём единственный `role=dialog` — БЕЗ фильтра по строке
 * поиска: у enum-колонок (ФИО КМ / Номенклатура) поповер — `EnumCheckList`
 * (Command + `CommandInput placeholder="Поиск…"`, ReportFilters.tsx:370-411),
 * а у синтетической колонки «Изменение» — `ReportChangeHeaderFilter`
 * (ReportFilters.tsx:604-656), простой список кнопок БЕЗ поля поиска; фильтр
 * по `getByPlaceholder('Поиск…')` не находил бы этот поповер вовсе.
 */
async function openFunnel(page: Page, column: string) {
  await page.getByRole('button', { name: `Фильтр по «${column}»` }).click();
  const popover = page.getByRole('dialog');
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
    // Список значений — cmdk CommandItem, role="option" (не ARIA checkbox).
    await popover.getByRole('option', { name: KM.aliev }).click();
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
    await popover.getByRole('option', { name: LINES.dyson }).click();
    await search.fill("De'Longhi");
    await popover.getByRole('option', { name: LINES.delonghi }).click();
    await page.keyboard.press('Escape');
    await expect(shown(page)).toHaveText('Показано: 2 позиции');
  });

  test('15-8 · пустой результат и «Сбросить фильтры»', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    const change = await openFunnel(page, 'Изменение');
    // Опции «Изменение» — простые <button> (ReportFilters.tsx:604-656), без
    // роли checkbox.
    await change.getByRole('button', { name: 'Исключено' }).click(); // в 26-3 исключённых нет
    await page.keyboard.press('Escape');
    // EmptyNote рендерится дважды: мобильная копия первой в DOM-порядке
    // (`md:hidden`, DepartmentReportView.tsx:416-419), десктопная — второй,
    // отдельным блоком `hidden md:block` (:443-447). На 1440×900 видна
    // именно вторая.
    await expect(page.getByText('В отчёте пока нет строк.').last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Экспорт' })).toBeDisabled();
    // F6: бейдж счётчика активных фильтров на кнопке «Фильтры» (ReportsPage.tsx:
    // 342-346, activeFilterCount) — контроль тем же локатором: сначала показан,
    // после сброса исчезает.
    const filtersBtn = page.getByRole('button', { name: /^Фильтры/ });
    const filtersBadge = filtersBtn.locator('span.bg-primary');
    await expect(filtersBadge).toHaveText('1');
    await filtersBtn.click();
    await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
    await expect(shown(page)).toHaveText('Показано: 5 позиций');
    await expect(page.getByRole('button', { name: 'Экспорт' })).toBeEnabled();
    await expect(filtersBadge).toHaveCount(0);
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
    // Закреплённая панель: имя и плашка «Изменение» — соседние ячейки внутри
    // одной строки; ближайший предок с классом "flex" — это ячейка
    // «Номенклатура» (без плашки), а не сама строка. У строки уникально
    // "border-b" (DepartmentReportView.tsx:693), у ячеек — только "border-r".
    const row = name.locator('xpath=ancestor::*[contains(@class,"border-b")][1]');
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

test.describe('§5.2 · кто ознакомился', () => {
  test.use({ session: { user: 'u-6', role: ROLES.MKT } });

  test('Д-9 · ознакомление реального пользователя видно в «Кто ознакомился»', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.p3.id}`);
    await page.getByRole('button', { name: /Ознакомиться со всеми изменениями \(2\)/ }).click();
    await app.toast('Изменения отмечены как прочитанные. Статус акции не изменён.');

    await app.switchRole(ROLES.ADMIN);
    await page.getByRole('button', { name: 'Кто ознакомился' }).click();
    const drawer = page.getByRole('dialog', { name: 'Кто ознакомился с изменениями' });
    await expect(drawer).toContainText('Изменённых позиций: 2'); // контроль: тот же отчёт
    const alieva = drawer.getByRole('listitem').filter({ hasText: USERS['u-6'].name });
    await expect(alieva).toHaveCount(2); // по строке на каждую изменённую позицию
    for (const item of await alieva.all()) await expect(item).toContainText('Ознакомлен');
    await expect(drawer).toContainText('Пользователей: 4'); // 3 из реестра отдела + Алиева
  });
});
