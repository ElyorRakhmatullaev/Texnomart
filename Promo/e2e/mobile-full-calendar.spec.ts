/**
 * Полный промо-календарь на телефоне (Promo №1, №2 плана
 * docs/superpowers/plans/2026-09-30-mobile-layout-fixes.md, Задача 2).
 *
 * Календарь остаётся таблицей (Pattern F: закреплённая + прокручиваемая панели).
 * На телефоне закреплённая панель узкая (одна колонка «Номенклатура», ФИО КМ —
 * второй строкой), у строки одна кнопка «Открыть строку» 44px, действия полосы
 * акции — в меню «Действия акции».
 */
import type { Locator, Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { LINES, PROMO } from './data';
import { PHONE, expectInViewport, expectNoPageOverflow } from './mobile';

/** Строки закреплённой панели (название, маркеры, кнопка строки). */
const frozenRows = (page: Page) => page.locator('div.group\\/row');
/** Строки прокручиваемой панели — тот же порядок, что у закреплённой. */
const scrollRows = (page: Page) => page.locator('div.flex.items-stretch.border-b.text-sm');
/** Прокручиваемая панель таблицы: ближайший предок строк с `overflow-x-auto`. */
const scrollPane = (page: Page) =>
  scrollRows(page).first().locator('xpath=ancestor::div[contains(@class,"overflow-x-auto")][1]');
/** Карточка таблицы (шапка + обе панели + нижний скролл). */
const gridCard = (page: Page) => page.locator('[data-slot="card"]').filter({ has: frozenRows(page) });

async function openCalendar(app: App, promoId?: string) {
  await app.open(promoId ? `full-calendar?promo=${promoId}` : 'full-calendar');
  await expect(frozenRows(app.page).first()).toBeVisible();
}

/**
 * Страница полного календаря прокручивается своим контейнером внутри <main>
 * (`min-h-0 flex-1 overflow-auto`) — его боковая прокрутка не видна в <main>,
 * поэтому проверяем оба.
 */
async function expectCalendarFitsScreen(page: Page) {
  await expectNoPageOverflow(page);
  const inner = await page
    .locator('main div.min-h-0.flex-1.overflow-auto')
    .first()
    .evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(inner, 'боковая прокрутка страницы календаря').toBeLessThanOrEqual(1);
}

/** Таблица целиком на экране, прокручиваемой панели остаётся не меньше `minW` px. */
async function expectUsableGrid(page: Page, minW: number) {
  await expectCalendarFitsScreen(page);
  const cardOverflow = await gridCard(page).evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(cardOverflow, 'закреплённая панель шире карточки таблицы').toBeLessThanOrEqual(1);
  const w = await scrollPane(page).evaluate((el) => el.clientWidth);
  expect(w, 'ширина прокручиваемой панели').toBeGreaterThanOrEqual(minW);
}

/** Pattern F: строка закреплённой панели и строка прокручиваемой — одной высоты, содержимое не срезано. */
async function expectPanesAligned(page: Page) {
  const frozen = await frozenRows(page).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  const scroll = await scrollRows(page).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(frozen.length, 'строк в закреплённой панели').toBeGreaterThan(0);
  expect(scroll, 'высоты строк: прокручиваемая панель против закреплённой').toEqual(frozen);
  const clipped = await frozenRows(page).evaluateAll((rows) =>
    rows
      .filter((row) => {
        const r = row.getBoundingClientRect();
        return [...row.querySelectorAll('*')].some((c) => {
          const b = c.getBoundingClientRect();
          return b.height > 0 && (b.top < r.top - 1 || b.bottom > r.bottom + 1);
        });
      })
      .map((row) => row.textContent),
  );
  expect(clipped, 'содержимое строки выходит за её высоту').toEqual([]);
  // Тело закреплённой панели не шире её шапки: длинная полоса акции («26-115 ·
  // 12 позиций» + «⋯») раздвигала тело, и колонки прокручиваемой части съезжали
  // со своих заголовков (ревью 30.09).
  const headW = await gridCard(page)
    .locator('div.sticky div.shrink-0.border-r')
    .first()
    .evaluate((e) => e.getBoundingClientRect().width);
  const bodyW = await frozenRows(page)
    .first()
    .locator('xpath=ancestor::div[contains(@class,"shrink-0") and contains(@class,"border-r")][1]')
    .evaluate((e) => e.getBoundingClientRect().width);
  expect(bodyW, 'ширина закреплённой панели: тело против шапки').toBe(headW);
}

async function expectTapTarget(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label}: нет на странице`).not.toBeNull();
  expect(box!.width, `${label}: ширина`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label}: высота`).toBeGreaterThanOrEqual(44);
}

const openRowButton = (row: Locator) => row.getByRole('button', { name: 'Открыть строку' });

/** Лист выезжает справа: мерить положение кнопок — только после анимации. */
async function settled(sheet: Locator) {
  await expect(sheet).toBeVisible();
  await sheet.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
}

test.describe('Полный календарь · телефон · коммерческий директор', () => {
  test.use({ ...PHONE, session: { user: 'u-1' } });

  test('М-К1 нет боковой прокрутки · КД', async ({ app, page }) => {
    await openCalendar(app);
    await expectUsableGrid(page, 140);
  });

  test('М-К2 высоты панелей совпадают · КД', async ({ app, page }) => {
    await openCalendar(app);
    await expectPanesAligned(page);
  });

  test('М-К3 КД открывает «Детали изменений» с телефона', async ({ app, page }) => {
    await openCalendar(app, PROMO.p3.id);
    const row = app.gridRow(LINES.delonghi);
    await expect(row).toContainText('Рашидова'); // ФИО КМ — второй строкой под названием
    const open = openRowButton(row);
    await expect(open).toBeVisible();
    await expectTapTarget(open, 'Открыть строку');
    await expectInViewport(open, 'Открыть строку');
    await open.click();
    await expect(page.getByRole('dialog', { name: 'Детали изменений' })).toBeVisible();
  });

  test('М-К5 действия акции из меню · КД', async ({ app, page }) => {
    await openCalendar(app, PROMO.p3.id);
    const trigger = page.getByRole('button', { name: 'Действия акции' });
    await expect(trigger).toBeVisible();
    await expectInViewport(trigger, 'Действия акции');
    await expectTapTarget(trigger, 'Действия акции');
    await trigger.click();
    const history = page.getByRole('menuitem', { name: 'История' });
    await settled(page.getByRole('menu'));
    await expectInViewport(history, 'пункт «История»');
    await expect(page.getByRole('menuitem', { name: 'Добавить номенклатуру' })).toHaveCount(0); // только КМ
    await history.click();
    await expect(page.getByRole('dialog', { name: 'История и изменения' })).toBeVisible();
  });
});

test.describe('Полный календарь · телефон · КМ', () => {
  test.use({ ...PHONE, session: { user: 'u-4' } });

  test('М-К1 нет боковой прокрутки · КМ', async ({ app, page }) => {
    await openCalendar(app);
    await expectUsableGrid(page, 140);
  });

  test('М-К2 высоты панелей совпадают · КМ', async ({ app, page }) => {
    await openCalendar(app);
    await expectPanesAligned(page);
  });

  test('М-К4 КМ открывает панель строки и удаляет черновик', async ({ app, page }) => {
    await openCalendar(app, PROMO.p3.id);
    await page.getByRole('button', { name: 'Действия акции' }).click();
    await page.getByRole('menuitem', { name: 'Добавить номенклатуру' }).click();
    const add = page.getByRole('dialog', { name: 'Добавить номенклатуру' });
    await add.getByPlaceholder('Поиск по названию или коду 1С…').fill(LINES.fan.split(' ')[0]);
    await add.getByRole('option', { name: new RegExp(LINES.fan) }).first().click();
    await app.toast(`Номенклатура добавлена: ${LINES.fan}`);
    await app.dismissToasts();
    // Высота новой строки (черновик с пометкой) — тоже совпадает в обеих панелях.
    await expectPanesAligned(page);

    const sheet = page.getByRole('dialog', { name: 'Редактировать строку' });
    await openRowButton(app.gridRow(LINES.fan)).click();
    await settled(sheet);
    const del = sheet.getByRole('button', { name: 'Удалить номенклатуру' });
    await expectInViewport(del, 'Удалить номенклатуру');
    await del.click();
    await app.toast(`Номенклатура удалена: ${LINES.fan}. Изменения сохранены автоматически.`);
    await expect(sheet).toBeHidden();
    await expect(app.gridRow(LINES.fan)).toHaveCount(0);

    // Согласованная позиция не удаляется — только исключается через согласование.
    await openRowButton(app.gridRow(LINES.xiaomi)).click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Исключить позицию из акции' })).toBeVisible(); // контроль
    await expect(sheet.getByRole('button', { name: 'Удалить номенклатуру' })).toHaveCount(0);
  });

  test('М-К9 КМ доходит до «Детали изменений» через лист строки, красная точка гаснет', async ({ app, page }) => {
    // На телефоне у строки нет иконки-глаза: правящая роль открывает лист
    // «Редактировать строку», детали (и причина отказа) — кнопкой в нём.
    await openCalendar(app, PROMO.p3.id);
    const open = openRowButton(app.gridRow(LINES.xiaomi));
    await expect(open.locator('span.bg-red-500')).toHaveCount(1); // непросмотренный отказ
    await open.click();
    const sheet = page.getByRole('dialog', { name: 'Редактировать строку' });
    await settled(sheet);
    await sheet.getByRole('button', { name: 'Детали изменений' }).click();
    const details = page.getByRole('dialog', { name: 'Детали изменений' });
    await expect(details).toBeVisible();
    await expect(sheet).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(details).toBeHidden();
    await expect(open.locator('span.bg-red-500')).toHaveCount(0);
  });

  test('М-К5 действия акции из меню · КМ', async ({ app, page }) => {
    await openCalendar(app, PROMO.p3.id);
    const trigger = page.getByRole('button', { name: 'Действия акции' });
    await expect(trigger).toBeVisible();
    await expectInViewport(trigger, 'Действия акции');
    await trigger.click();
    await expect(page.getByRole('menuitem', { name: 'Добавить номенклатуру' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'История' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Отменить акцию' })).toHaveCount(0); // только КД
  });

  test('М-К6 шапка КМ', async ({ app, page }) => {
    await openCalendar(app);
    const create = page.getByRole('button', { name: 'Создать акцию' });
    await expect(create).toBeVisible();
    await expectInViewport(create, 'Создать акцию');
    await expectCalendarFitsScreen(page);
  });
});

test.describe('Полный календарь · узкий Android 360px', () => {
  test.use({ ...PHONE, viewport: { width: 360, height: 780 } });

  // Ширины закреплённой панели фиксированы (выбор 40 + номенклатура 172): на 360
  // контенту остаётся 334px, прокручиваемой панели КМ — ~120px, КД — ~160px.
  for (const user of ['u-1', 'u-4'] as const) {
    test.describe(user, () => {
      test.use({ session: { user } });
      test(`М-К7 360px · ${user === 'u-1' ? 'КД' : 'КМ'}`, async ({ app, page }) => {
        await openCalendar(app);
        await expectUsableGrid(page, 110);
        await expectPanesAligned(page);
      });
    });
  }
});

test.describe('Полный календарь · планшет 800px', () => {
  // С md боковое меню AppShell уже на экране: контенту остаётся ≈544px, а
  // десктопная закреплённая панель — 579–618px. Узкая сетка включается ниже lg.
  test.use({ viewport: { width: 800, height: 1000 }, session: { user: 'u-1' } });

  test('М-К10 планшет · таблица не схлопывается', async ({ app, page }) => {
    await openCalendar(app);
    await expectUsableGrid(page, 240);
    await expectPanesAligned(page);
    await expect(openRowButton(app.gridRow(LINES.xiaomi))).toBeVisible();
  });
});

test.describe('Полный календарь · десктоп', () => {
  test.use({ session: { user: 'u-1' } });

  test('М-К8 десктоп не изменился', async ({ app, page }) => {
    await openCalendar(app, PROMO.p3.id);
    const row = app.gridRow(LINES.delonghi);
    await expect(row.getByRole('button', { name: 'Просмотр деталей' })).toBeVisible();
    await expect(openRowButton(row)).toHaveCount(0);
    const card = gridCard(page);
    await expect(card.getByText('№ промо', { exact: true })).toBeVisible();
    await expect(card.getByText('ФИО КМ', { exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'История' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Действия акции' })).toHaveCount(0);
    await expectPanesAligned(page);
  });
});
