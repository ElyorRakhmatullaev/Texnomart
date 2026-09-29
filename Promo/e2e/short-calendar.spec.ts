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

/**
 * Строка краткого КАЛЕНДАРЯ (вкладка «Промо-календарь»). ShortCalendarTable
 * рендерит закреплённую панель обычными <button>, а прокручиваемую — div[role=
 * "button"], без role="row"/<tr> вообще (ShortCalendarTable.tsx:281-309 —
 * закреплённая панель, :319-586 — прокручиваемая) — в отличие от
 * PlanApprovalTable, у которой строки настоящие <tr>. `planRow` (page.getByRole
 * ('row')) поэтому здесь ничего не находит; № промо в закреплённой панели даёт
 * индекс парной строки в прокручиваемой.
 */
async function calendarRow(page: Page, promoNo: string): Promise<Locator> {
  const frozenNos = page.locator('div.shrink-0.border-r.bg-white button span.tabular-nums');
  const count = await frozenNos.count();
  for (let i = 0; i < count; i++) {
    const text = (await frozenNos.nth(i).textContent())?.trim();
    if (text === promoNo) {
      return page.locator('div.min-w-max > div[role="button"]').nth(i);
    }
  }
  throw new Error(`Строка «${promoNo}» не найдена в закреплённой панели краткого календаря`);
}

async function openDistribution(app: App, promoNo: string) {
  await planRow(app.page, promoNo).getByRole('button', { name: 'Распределить по категориям / КМ' }).click();
  const sheet = app.page.getByRole('dialog', { name: 'Распределение по категориям / КМ' });
  await expect(sheet).toBeVisible();
  return sheet;
}

/**
 * Триггеры периода в форме распределения (CategoryDistributionDialog.tsx:368-
 * 390) не имеют программной подписи: плейсхолдер выводится ТЕКСТОМ внутри
 * <button> (DatePickerField.tsx:47-64), а не через <label>/aria-label — getByLabel
 * из брифа их не находит. Берём по порядку: первая кнопка периода — «Начало
 * периода», вторая — «Окончание периода» (совет из брифа, «Notes для
 * исполнителя»).
 */
function periodTrigger(sheet: Locator, index: 0 | 1): Locator {
  return sheet
    .getByRole('button', { name: /^\d{2}\.\d{2}\.\d{4}$|^Начало периода$|^Окончание периода$/ })
    .nth(index);
}

/** Период внутри срока акции → «Сформировать даты». Уже выбранные даты не трогаются. */
async function generateDates(app: App, sheet: Locator, from: string, to: string) {
  await app.pickDate(periodTrigger(sheet, 0), from);
  await app.pickDate(periodTrigger(sheet, 1), to);
  await sheet.getByRole('button', { name: 'Сформировать даты' }).click();
}

/**
 * «Категория для всех дат» (CategoryDistributionDialog.tsx:122-134, id="fill-cat")
 * несёт СВОЙ aria-label="Категория" на самом <Input> — по ARIA accessible-name
 * accessible-name computation aria-label побеждает связанный `<Label htmlFor=
 * "fill-cat">Категория для всех дат</Label>`, поэтому getByLabel по тексту
 * подписи ничего не находит (подтверждено прогоном — locator.fill дал timeout).
 * Берём по id напрямую.
 */
async function applyToAll(app: App, sheet: Locator, category: string, km: string) {
  await sheet.locator('#fill-cat').fill(category);
  await app.select(sheet.getByRole('combobox', { name: 'Ответственный КМ для всех дат' }), km);
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

/**
 * Группа даты в форме распределения (CategoryDistributionDialog.tsx:478-536,
 * className «rounded-lg border border-gray-200»). `sheet.getByRole('combobox')
 * .last()` из брифа на самом деле цепляет триггер «+ Добавить дату»
 * (:539-555) — он идёт ПОСЛЕ всех групп дат в DOM, а не последнюю строку
 * категория/КМ внутри группы (подтверждено прогоном — «Юсупова Нигора» не
 * найдена, открылся не тот список). Скоуп к самой группе исключает этот
 * триггер.
 */
function dayGroup(sheet: Locator, ddmmyyyy: string) {
  return sheet.locator('div.rounded-lg.border.border-gray-200').filter({ hasText: ddmmyyyy });
}

test.describe('№12 · экспорт', () => {
  test('12-1 · CSV календаря: № промо текстом, 17 колонок', async ({ app, page }) => {
    await app.open('short-calendar');
    const file = await exportCsv(app);
    expect(file.name).toBe('краткий-промо-календарь_2026-09-28.csv');
    const BOM = String.fromCharCode(0xfeff); // F4: не литеральный символ в исходнике
    expect(file.text.startsWith(BOM)).toBe(true);
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
      // «26-17» — VALUE поля «№ промо» (PlanMode.tsx:1411-1424, readOnly <Input>),
      // не текстовый узел: getByText его не находит (подтверждено прогоном).
      await expect(dialog.getByLabel('№ промо')).toHaveValue('26-17');
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
      await openPlan(app);
      await page.getByRole('checkbox', { name: 'Выбрать акцию 26-6' }).click();
      await page.getByRole('button', { name: /Отклонить выбранные/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Отклонить выбранные акции' });
      await dialog.getByLabel(/Комментарий/).fill('Сроки пересекаются с 26-7');
      await dialog.getByRole('button', { name: 'Отклонить' }).click();
      await app.toast('Отклонено акций: 1. План возвращён директору маркетинга');
      const [header, ...rows] = parseCsv((await exportCsv(app)).text);
      const row = rows.find((r) => r[0] === '="26-6"')!;
      // Роль — того, кто отклонил, а не агрегатного этапа плана: при «На согл. с КД»
      // ОД решает параллельно (R28.1), и раньше в журнал уходила роль КД.
      expect(row[header.indexOf('Роль согласующего')]).toBe(ROLES.OD);
    });
  });
});

test.describe('№27 · распределение по категориям / КМ', () => {
  test('27-1 · КД видит распределение на строке плана', async ({ app, page }) => {
    await openPlan(app);
    await app.switchRole(ROLES.KD);
    await distributionBlock(page, '26-1', 4).click();
    // F6: раскрытый блок — <tr>, следующий сразу за строкой плана
    // (PlanApprovalTable.tsx:732-744, DistributionTable :447-465). Заголовки —
    // тот же скоуп, что и контроль отсутствия полей ввода ниже.
    const expanded = planRow(page, '26-1').locator('xpath=following-sibling::tr[1]');
    await expect(expanded.getByText('Дата / период', { exact: true })).toBeVisible();
    await expect(expanded.getByText('Категория', { exact: true })).toBeVisible();
    await expect(expanded.getByText('Ответственный КМ', { exact: true })).toBeVisible();
    await expect(expanded.getByRole('textbox')).toHaveCount(0);
    await expect(expanded.getByRole('combobox')).toHaveCount(0);
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
      const group1105 = dayGroup(sheet, '01.11.2026');
      await group1105.locator('input[list="distribution-categories"]').last().fill(CATEGORIES[1]);
      await app.select(group1105.getByRole('combobox').last(), KM.yusupova);
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
      const group1105 = dayGroup(sheet, '01.11.2026');
      await group1105.locator('input[list="distribution-categories"]').last().fill(CATEGORIES[0].toUpperCase());
      await app.select(group1105.getByRole('combobox').last(), KM.yusupova);
      await expect(sheet.getByText('Категория уже распределена на эту дату — уберите дубль.')).toBeVisible();
      await expect(save).toBeDisabled();
    });

    test('27-7 · без даты периода даты не формируются', async ({ app, page }) => {
      await openPlan(app);
      const sheet = await openDistribution(app, '26-11');
      const generate = sheet.getByRole('button', { name: 'Сформировать даты' });
      await expect(generate).toBeEnabled(); // контроль: период предзаполнен
      await periodTrigger(sheet, 0).click();
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
    // Блок фильтров открыт по умолчанию (ShortCalendarPage.tsx:117, filtersOpen
    // initial state = true) — переключатель здесь нужен, только если фильтры
    // почему-то уже свёрнуты; клик по уже открытому блоку скрыл бы его.
    const filtersToggle = page.getByRole('button', { name: /^Фильтры/ });
    if ((await filtersToggle.getAttribute('aria-expanded')) !== 'true') {
      await filtersToggle.click();
    }
    await page.getByRole('combobox').filter({ hasText: 'Все категории' }).click();
    await expect(page.getByRole('option').first()).toBeVisible(); // F8: дождаться отрисовки списка
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
    const row = await calendarRow(page, '26-1');
    await row.getByText('Переотправлено КМ').first().click();
    await expect(page).toHaveURL(new RegExp(`/full-calendar\\?promo=${PROMO.p1.id}$`));
    await expect(page.getByText(`Показана акция по ссылке из календаря готовности: № ${PROMO.p1.no}`)).toBeVisible();
    await expect(page.getByText('Элемент согласования не найден')).toHaveCount(0);
  });
});
