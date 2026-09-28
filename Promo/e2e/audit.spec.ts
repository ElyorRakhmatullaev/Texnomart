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

/**
 * Открывает панель «Задачи участника». Отклонение от брифа: бриф ищет
 * `getByRole('button', { name, exact: true })`, но ФИО в таблице рейтинга —
 * обычный `<td>` внутри строки с `onClick` (ParticipantMetricsTab.tsx:270,272:
 * `<tr onClick={() => onDrill("all")}>` … `<td className={...}>{r.name}</td>`);
 * настоящие `<button>` в строке — только у ячеек-метрик (dueCount/onTime/overdue,
 * ParticipantMetricsTab.tsx:257-267), их доступное имя — число, а не ФИО. Клик
 * по ячейке ФИО (role=cell) не задевает эти кнопки и всплывает до `onClick` строки.
 */
async function openParticipant(page: Page, name: string) {
  await page.getByRole('cell', { name, exact: true }).first().click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe('№18 · «Сроки по плану»', () => {
  test('18-1 · «Период плана» — диапазоны дат по возрастанию', async ({ app, page }) => {
    await openTab(app, 'Сроки по плану');
    await combo(page, 'Все периоды плана').click();
    await expect(page.getByRole('option').first()).toBeVisible(); // F8: дождаться отрисовки списка
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
    await expect(bodyRows(page).first()).toBeVisible(); // F8: дождаться отрисовки строк
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
    // ControlDeadlinesFilters.tsx:232 (desktop, `hidden md:flex`) и :241 (mobile,
    // `md:hidden`) рендерят «Показано: N» одновременно — оба в DOM на 1440×900,
    // виден только первый (desktop). `.filter({ visible: true })` (F12) отбирает
    // по фактической видимости, а не по порядку в DOM.
    await expect(page.getByText('Показано: 1').filter({ visible: true })).toBeVisible();
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
    // Положительный контроль (тот же локатор `drawer.getByText`, что и в проверке
    // отсутствия ниже): без периода все задачи — с наступившим дедлайном, поэтому
    // каждая карточка обязана нести либо «В срок», либо «+N … дн.» — то есть
    // отсутствие «Дедлайн не наступил» не может оказаться следствием пустой панели.
    await expect(drawer.getByText(/^(В срок|\+\d+ (раб|кал)\. дн\.)$/).first()).toBeVisible();
    await expect(drawer.getByText('Дедлайн не наступил')).toHaveCount(0);
    const text = (await drawer.textContent()) ?? '';
    const m = text.match(/Задачи с наступившим дедлайном: (\d+)/);
    expect(m, text).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThan(0);
  });

  test('20-2 · с периодом — будущие задачи помечены', async ({ app, page }) => {
    await openTab(app, 'Показатели участников');
    // Отклонение от брифа: оба поля «Период дедлайна» вкладки передают явный
    // `placeholder` («с» / «по»), а не подпись по умолчанию «Выберите дату»
    // (ParticipantMetricsTab.tsx:106 «с», :115 «по»; дефолт — DatePickerField.tsx:33 —
    // применяется только когда `placeholder` не передан). Поля различимы по
    // имени, `.first()` не нужен.
    await app.pickDate(page.getByRole('button', { name: 'с', exact: true }), '01.11.2026');
    await app.pickDate(page.getByRole('button', { name: 'по', exact: true }), '30.11.2026');
    const drawer = await openParticipant(page, KM.karimov);
    await expect(drawer).toContainText(/Все задачи: \d+/);
    await expect(drawer.getByText('Дедлайн не наступил').first()).toBeVisible();
  });

  test('20-3 · клик по числу открывает задачи одной метрики', async ({ app, page }) => {
    await openTab(app, 'Показатели участников');
    const row = bodyRows(page).filter({ hasText: KM.karimov });
    // Столбцы строки в DOM-порядке: №, ФИО, «Промо с дедлайном» (due), «Вовремя»
    // (onTime), «С просрочкой» (overdue), … — только эти три ячейки-числа содержат
    // кнопку (ParticipantMetricsTab.tsx:271-275, num(r.dueCount,"due") →
    // num(r.onTime,"onTime") → num(r.overdue,"overdue")). Берём именно 4-ю ячейку
    // (индекс 3), а не «первую попавшуюся кнопку»: без этого клик по `.first()`
    // всегда открывал бы «due», и регекс-ИЛИ по всем трём подписям маскировал бы
    // баг «открылась не та метрика». Для Каримова Шерзода (без фильтров) «Вовремя» = 1
    // (проверено по факт. DOM: cell "1" → button "1", 3-я числовая ячейка) — кнопка
    // кликабельна.
    const onTime = row.getByRole('cell').nth(3).getByRole('button');
    await onTime.click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    // Заголовок — единственный h2 в шторке (SheetTitle → Radix Primitive.h2).
    const title = drawer.getByRole('heading');
    // Положительный контроль в ТОМ ЖЕ локаторе `title`, что и обе проверки
    // отсутствия ниже: подпись метрики «Вовремя» (METRIC_LABEL.onTime,
    // lib/audit-control.ts:606) обязана присутствовать, а подписи двух других
    // метрик («Промо с дедлайном» — due, «С просрочкой» — overdue) — отсутствовать.
    await expect(title).toContainText('Вовремя');
    await expect(title).not.toContainText('Промо с дедлайном');
    await expect(title).not.toContainText('С просрочкой');
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
      // Отклонение от брифа: статус выводится через общий `PromoStatusBadge`,
      // который сокращает подпись бейджа (PromoStatusBadge.tsx:16 — «Переотправлено
      // на корректировку КМ» → «Переотправлено КМ»); строка сама по себе полная,
      // это единственный текст, который реально виден в бейдже статуса «после».
      await expect(row.first()).toContainText('Переотправлено КМ');
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
    // AuditLogTable.tsx:250-252 (desktop, `hidden md:block`) и :281-283 (mobile,
    // `md:hidden`) рендерят «Записей: N» одновременно — оба в DOM на 1440×900,
    // виден только первый (desktop). `.filter({ visible: true })` (F12) отбирает
    // по фактической видимости, а не по порядку в DOM — тот же приём, что в
    // `fixtures.ts:expectPasswordsNotLeaked` (см. комментарий там).
    await expect(page.getByText('Записей: 20').filter({ visible: true })).toBeVisible();
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    await expect(page.getByText('Записей: 25').filter({ visible: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ключевые действия' })).toBeVisible();
    await app.switchRole(ROLES.KD);
    await openTab(app, 'Аудит-лог');
    await expect(page.getByText(/Записей: \d+/).filter({ visible: true })).toBeVisible(); // контроль
    await expect(page.getByRole('button', { name: 'Ключевые действия' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Все действия', exact: true })).toHaveCount(0);
  });
});
