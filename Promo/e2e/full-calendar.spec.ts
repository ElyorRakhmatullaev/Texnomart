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

/**
 * Заполнить обязательные поля черновика в акции «1+1» (прогноз + подарок) через
 * «Редактировать строку», чтобы его можно было отправить.
 */
async function completeDraft(app: App, line: string) {
  const page = app.page;
  await app.gridRow(line).getByRole('button', { name: 'Изменить строку' }).click();
  const edit = page.getByRole('dialog', { name: 'Редактировать строку' });
  // Field ярлыки в этой панели не связаны с полем (см. editField ниже) — getByLabel
  // не находит инпут; правим кликом по кнопке EditableCell, затем по инпуту.
  const forecast = editField(edit, 'Прогноз продаж');
  await forecast.getByRole('button').click();
  await forecast.locator('input').fill('10');
  await forecast.locator('input').press('Enter');
  await edit.getByRole('button', { name: 'Выбрать подарок' }).first().click();
  const gifts = page.getByRole('dialog', { name: 'Выбор подарочной номенклатуры' });
  await gifts.getByRole('option').first().click();
  await app.toast(/Подарок выбран: /);
  // Escape закрывает не эту панель, а ещё анимирующийся (уже логически закрытый)
  // диалог выбора подарка — кнопка «Готово» в футере надёжнее гонки анимаций.
  await edit.getByRole('button', { name: 'Готово' }).click();
  await expect(edit).toBeHidden();
  await app.dismissToasts();
}

/**
 * Поле в «Редактировать строку» (LineEditSheet.tsx): `<Label>` — обычный `<label>`
 * без `htmlFor`, соседний `<div>` несёт `EditableCell` (кнопка → инпут по клику,
 * EditableCell.tsx:167-201). `getByLabel` тут не работает — нет aria-связи ни
 * через `htmlFor`, ни через оборачивание. Берём подпись, затем следующий `<div>`.
 */
function editField(sheet: Locator, label: string): Locator {
  return sheet.locator('label', { hasText: label }).locator('xpath=following-sibling::div[1]');
}

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
    const submit = page.getByRole('button', { name: 'Отправить выбранные (1)' });
    await expect(submit).toBeDisabled();
    // F6: подсказка недоступной кнопки — Radix Tooltip на span-обёртке
    // (disabled:pointer-events-none у самой кнопки, FullCalendarPage.tsx SubmitButton;
    // packages/ui/src/button.tsx:8) — наводим на обёртку, не на саму кнопку.
    await submit.locator('xpath=..').hover();
    await expect(page.getByRole('tooltip')).toContainText('Среди выбранных не заполнены обязательные поля');
  });

  test('13-4 · отправленная позиция видна КД светло-оранжевой', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    // Несколько тостов подряд («Номенклатура добавлена», «Подарок выбран», «Отправлено
    // на согласование») копятся в стеке sonner быстрее, чем истекают их 5 с — закрытые
    // фоном тосты перекрывают друг друга (см. `switchRole` → `dismissToasts`,
    // fixtures.ts:101-107), поэтому гасим их по одному, а не ждём одной волной в конце.
    await app.dismissToasts();
    await completeDraft(app, LINES.fan);

    await app.gridRow(LINES.fan).getByRole('checkbox', { name: 'Выбрать строку' }).click();
    await page.getByRole('button', { name: 'Отправить выбранные (1)' }).click();
    await app.toast('Отправлено на согласование: 1 строка');
    await expect(app.gridRow(LINES.fan).getByText('Черновик', { exact: true })).toHaveCount(0);

    await app.switchRole(ROLES.KD);
    await expect(app.gridRow(LINES.fan)).toBeVisible();
    await expect(app.gridRow(LINES.fan)).toHaveClass(ORANGE);
    // F6: статус «Изменения на согласовании» — приведённый в задании локатор
    // (scroll-pane row) для него не подходит: строка не рендерит текст статуса
    // напрямую, ни во frozen-, ни в scroll-панели (только оранжевую подсветку и
    // чипы «Черновик»/«Удалено», FullCalendarGrid.tsx:741,789-802,994-999).
    // Единственное место, где строка показывает статус текстом — панель «Детали
    // изменений» (`{status}` в SheetDescription, LineDetailsDrawer.tsx:203-214),
    // открываемая тем же «Просмотр деталей», что и в остальных тестах файла.
    const sheet = await openDetails(app, LINES.fan);
    await expect(sheet).toContainText('Изменения на согласовании');
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
    await openPromo(app, PROMO.p3.id);
    await openDetails(app, LINES.xiaomi);
    await closeDetails(page);
    await requestExclusion(app, LINES.xiaomi, 'Модель снята с производства');
    await app.switchRole(ROLES.KD);
    await kdReject(app, LINES.xiaomi, 'Остатки ещё есть — оставить в акции');
    await app.switchRole(ROLES.KM);
    // «Просмотрено» относится к конкретному отказу (id строки + дата отказа), а не
    // к строке: новый отказ КД по уже просмотренной строке снова зажигает точку.
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
    // F13: убедиться, что сами строки видны старшему КМ — иначе отсутствие кнопки
    // ниже могло быть следствием отсутствующей строки, а не логики isApprovedPosition.
    await expect(app.gridRow(LINES.lgOled)).toBeVisible();
    await expect(app.gridRow(LINES.boschBlender)).toBeVisible();
    await expect(exclusionButton(app.gridRow(LINES.lgOled))).toHaveCount(0); // ожидает добавления
    await expect(exclusionButton(app.gridRow(LINES.boschBlender))).toHaveCount(0); // уже на исключении
  });

  test('13-13 · позиция, добавленная старшим КМ, видна ему и отправляется', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await addNomenclature(app, LINES.fan);
    await app.toast(`Номенклатура добавлена: ${LINES.fan}`);
    // Черновик позиции скрыт от проверяющих, кроме добавившей его роли — иначе
    // старший КМ не мог бы ни увидеть, ни отправить собственную позицию.
    await expect(app.gridRow(LINES.fan)).toBeVisible();
    await expect(app.gridRow(LINES.fan).getByText('Черновик', { exact: true })).toBeVisible();

    // До отправки это по-прежнему черновик для остальных проверяющих.
    await app.switchRole(ROLES.KD);
    await expect(app.gridRow(LINES.delonghi)).toBeVisible(); // контроль
    await expect(app.gridRow(LINES.fan)).toHaveCount(0);

    await app.switchRole(ROLES.SKM);
    await completeDraft(app, LINES.fan);
    await app.gridRow(LINES.fan).getByRole('checkbox', { name: 'Выбрать строку' }).click();
    await page.getByRole('button', { name: 'Отправить выбранные (1)' }).click();
    await app.toast('Отправлено на согласование: 1 строка');
    await expect(app.gridRow(LINES.fan).getByText('Черновик', { exact: true })).toHaveCount(0);

    await app.switchRole(ROLES.KD);
    await expect(app.gridRow(LINES.fan)).toBeVisible();
    await expect(app.gridRow(LINES.fan)).toHaveClass(ORANGE);
  });
});

test.describe('№13–14 · коммерческий директор', () => {
  test.use({ session: { user: 'u-2', role: ROLES.KD } });

  test('13-8 · решения только в панели «Детали изменений»', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    const rows = page.locator('div.group\\/row');
    await expect(rows.first()).toBeVisible();

    // F1: вместо анкера на конкретные имена — весь набор доступных имён кнопок
    // в строках КД должен быть подмножеством {«Просмотр деталей»}. Источник:
    // rowEditable/rowDeletable требуют access.canEditOwnLines
    // (FullCalendarGrid.tsx:684-734, 832-861); LineRowActions.onRequestRemoval
    // приходит только КМ/ст. КМ (canRequestLineRemoval, promo-mock-data.ts:2985-
    // 2987 — FullCalendarPage.tsx:1639-1641); 24.09 убрал построчные
    // «Согласовать»/«Отклонить» из грида вовсе (FullCalendarGrid.tsx:806-823 —
    // там остался только «Просмотр деталей»).
    const buttonNames = await rows.getByRole('button').evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? ''),
    );
    expect(buttonNames.length).toBeGreaterThan(0); // контроль: список не пуст
    expect(buttonNames).toContain('Просмотр деталей'); // контроль
    for (const name of buttonNames) expect(name).toBe('Просмотр деталей');
    // Прокручиваемая панель для КД в остальном read-only (EditableCell.tsx:145-
    // 156 — `editable=false` рендерит `<span>`, не `<button>`) — КРОМЕ «Остаток
    // по складам»: это read-only инфо-попап (не решение и не правка), рендерится
    // независимо от editable для любой роли (FullCalendarGrid.tsx:313,
    // WarehousePopover.tsx:20-43). Подтверждено прогоном — без этого допуска
    // тест находил 5 таких кнопок (по одной на строку акции).
    const scrollRows = page.locator('div.flex.items-stretch.border-b.text-sm');
    await expect(scrollRows.first()).toBeVisible();
    const scrollButtonNames = await scrollRows.getByRole('button').evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? ''),
    );
    expect(scrollButtonNames.length).toBeGreaterThan(0); // контроль: список не пуст
    for (const name of scrollButtonNames) expect(name).toBe('Остаток по складам');
    await expect(rows.getByRole('checkbox')).toHaveCount(0);

    const sheet = await openDetails(app, LINES.delonghi);
    await expect(sheet.getByText('Решение: изменение данных позиции')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Согласовать', exact: true })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Отклонить', exact: true })).toBeVisible();
    await closeDetails(page);

    // F1: контроль тем же локатором `rows.getByRole('checkbox')` — у КМ
    // (editorMode) чекбоксы есть; переключаться обратно не нужно.
    await app.switchRole(ROLES.KM);
    await expect(rows.getByRole('checkbox').first()).toBeVisible();
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

    // F3 (ruling): правка на 22, не на 20 — Xiaomi несёт посевной отклонённый
    // pending {value: 20} (L-0023, promo-mock-data.ts:1079); правка именно до 20
    // совпала бы со значением по совпадению и не отличила бы новую правку КМ от
    // применения устаревшего посевного value.
    await app.switchRole(ROLES.KM);
    await editDiscount(app, LINES.xiaomi, '14', '22');
    await app.toast('Изменение отправлено на повторное согласование — в таблице пока показаны согласованные данные.');
    await expect(await app.gridScrollRow(LINES.xiaomi)).toContainText('14%');
    const sheet = await openDetails(app, LINES.xiaomi);
    await expect(sheet).toContainText('Изменение данных позиции');
    await expect(sheet).toContainText(/Скидка[\s\S]*14%[\s\S]*22%/);
    await expect(sheet).toContainText(/Комментарий[\s\S]*—/);
    await expect(sheet).not.toContainText('Модель снята с производства');
    await closeDetails(app.page);

    await app.switchRole(ROLES.KD);
    await kdApprove(app, LINES.xiaomi, 'Согласовать изменение?');
    await app.toast('Изменение согласовано — новые значения стали актуальными.');
    await expect(app.gridRow(LINES.xiaomi)).toBeVisible();
    // Правка после отклонённого исключения строит запрос с нуля
    // (`isRejectedExclusion` в mergePendingChange) — посевное {value: 20} сюда не
    // доходит. Правка поверх посевного запроса без исключения — ОИ-3.
    await expect(await app.gridScrollRow(LINES.xiaomi)).toContainText('22%');
  });

  test('ОИ-2 · ввод того же значения не создаёт запроса', async ({ app, page }) => {
    await openPromo(app, PROMO.p3.id);
    await app.dismissToasts();
    await editDiscount(app, LINES.xiaomi, '14', '14');
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    await expect(app.gridRow(LINES.xiaomi)).not.toHaveClass(ORANGE);
    await editDiscount(app, LINES.xiaomi, '14', '15'); // контроль: реальная правка даёт запрос
    // F7: доказать, что локатор тоста вообще находит тост для этой же правки —
    // иначе count(0) выше мог бы пройти и при сломанном локаторе, не только при
    // отсутствии тоста.
    await app.toast(/Изменение отправлено на повторное согласование/);
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
    await expect(app.gridRow(LINES.xiaomi)).toHaveClass(ORANGE);
  });

  test('ОИ-3 · на строке с посевным запросом согласование применяет новую правку КМ', async ({ app }) => {
    await openPromo(app, PROMO.p3.id);
    await editDiscount(app, LINES.xiaomi, '14', '18');
    await app.toast(/Изменение отправлено на повторное согласование/);
    await app.switchRole(ROLES.KD);
    await kdApprove(app, LINES.xiaomi, 'Согласовать изменение?');
    // Xiaomi (L-0023) несёт посевной отклонённый запрос {value: 20}: правка КМ
    // обязана заменить и подпись «Стало», и сырое значение, которое применяет
    // согласование (`patchFrom` предпочитает `value`), — иначе встало бы 20%.
    await expect(await app.gridScrollRow(LINES.xiaomi)).toContainText('18%');
  });
});

test.describe('№15 п.3 · доступ к полному календарю', () => {
  test('15-3 · роли без доступа не видят раздел ни в меню, ни по адресу', async ({ app, page }) => {
    await app.open('reports');
    const navItem = page.getByRole('link', { name: 'Полный промо-календарь' });
    await expect(navItem).toBeVisible(); // контроль: у Администратора пункт есть
    // На /reports хлебная крошка текущей страницы тоже рендерится как role=link с тем
    // же именем «Отчёты смежным отделам» — берём именно пункт боковой панели
    // (data-sidebar="menu-button", packages/ui/src/sidebar.tsx:517).
    const reportsNavItem = page
      .locator('[data-sidebar="menu-button"]')
      .filter({ hasText: 'Отчёты смежным отделам' });
    for (const role of [ROLES.MKT, ROLES.DM, ROLES.PUR, ROLES.ANL]) {
      await app.switchRole(role);
      await expect(reportsNavItem, role).toBeVisible();
      await expect(navItem, role).toHaveCount(0);
      await app.open('full-calendar');
      await expect(page.getByText('Нет доступа к полному промо-календарю.'), role).toBeVisible();
      await app.open('reports');
    }
  });
});
