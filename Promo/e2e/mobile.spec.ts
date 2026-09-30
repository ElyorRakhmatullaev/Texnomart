import type { Locator, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { LINES, ROLES } from './data';
import { PHONE, expectFits, expectInViewport, expectNoPageOverflow, expectVisibleBorder } from './mobile';

/**
 * Мобильная вёрстка Promo на 390×844 (снимки 30.09): поля, вкладки, панели,
 * раскладки — дефекты №3–№16 плана `docs/superpowers/plans/2026-09-30-mobile-layout-fixes.md`.
 * Полный календарь (№1, №2) — в `mobile-full-calendar.spec.ts`.
 */
test.use(PHONE);

/** Высота элемента не больше заданной (одна строка текста / тап-таргет). */
async function heightOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, 'элемента нет на странице').not.toBeNull();
  return box!.height;
}

/**
 * Дождаться веб-шрифта Inter: до его загрузки текст меряется запасным шрифтом
 * (он на ~8% уже), и обрезка «Все статусы согласования» не воспроизводится.
 */
async function fontsReady(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/**
 * Дождаться конца анимации выезда листа/диалога (tw-animate-css, до 500 мс):
 * во время slide-in `boundingBox` возвращает сдвинутые координаты.
 */
async function settled(locator: Locator) {
  await expect(locator).toBeVisible();
  await locator.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished));
  });
}

/** Прокрутить контент AppShell (<main>) до самого низа. */
async function scrollMainToBottom(page: Page) {
  await page.locator('main').first().evaluate((m) => m.scrollTo(0, m.scrollHeight));
}

/** Кнопка-глаз строки карточки согласования — та, что видна на текущей ширине. */
function lineEye(page: Page, name: string) {
  return page
    .locator('tr, li')
    .filter({ hasText: name })
    .filter({ visible: true })
    .getByRole('button', { name: 'Просмотр деталей строки' });
}

test.describe('Аудит (Администратор)', () => {
  test.use({ session: { user: 'u-2' } });

  test('М-П3 /audit — полоса вкладок не уводит страницу вбок, «Аудит-лог» достижим', async ({ app, page }) => {
    await app.open('audit');
    await expect(page.getByRole('tab', { name: 'Сроки по плану' })).toBeVisible();
    await fontsReady(page);
    await expectNoPageOverflow(page);
    const tab = page.getByRole('tab', { name: 'Аудит-лог' });
    await tab.scrollIntoViewIfNeeded();
    await expectInViewport(tab, 'вкладка «Аудит-лог»');
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expectNoPageOverflow(page);
  });

  test('М-П9 «Задачи участника» — заголовок не уходит под «×»', async ({ app, page }) => {
    await app.open('audit');
    await page.getByRole('tab', { name: 'Показатели участников' }).click();
    // Ниже md рейтинг — карточки-кнопки (ParticipantMetricsTab.tsx, `md:hidden`).
    await page.locator('div.md\\:hidden > button').filter({ visible: true }).first().click();
    const drawer = page.getByRole('dialog');
    await settled(drawer);
    const title = drawer.locator('[data-slot="sheet-title"]');
    const close = drawer.getByRole('button', { name: 'Close' });
    const t = await title.boundingBox();
    const c = await close.boundingBox();
    expect(t && c, 'заголовок и «×» на месте').toBeTruthy();
    expect(t!.x + t!.width, 'правый край заголовка заходит под «×»').toBeLessThanOrEqual(c!.x);
  });

  test('М-П11 «Аудит-лог» — пояснение к «Ключевые / Все действия» в пределах экрана', async ({ app, page }) => {
    await app.open('audit');
    await page.getByRole('tab', { name: 'Аудит-лог' }).click();
    const note = page.getByText('черновики, редактирование и автосохранение — только в «Все действия»');
    await expect(note).toBeVisible();
    await fontsReady(page);
    await expectInViewport(note, 'пояснение');
    expect(await heightOf(note), 'пояснение сжато в узкий столбик').toBeLessThanOrEqual(40);
    await expectNoPageOverflow(page);
  });

  for (const tab of ['Сроки по плану', 'Сроки по промо и отчётам']) {
    test(`М-П12 «Фильтры сроков» (${tab}) — поля подписаны и с рамкой`, async ({ app, page }) => {
      await app.open('audit');
      await page.getByRole('tab', { name: tab }).click();
      await page.getByRole('button', { name: 'Фильтры', exact: true }).filter({ visible: true }).click();
      const sheet = page.getByRole('dialog', { name: 'Фильтры сроков' });
      await settled(sheet);
      const labels = ['№ промо', 'Ответственный', 'Контрольная точка', 'Результат'];
      if (tab === 'Сроки по плану') labels.push('Период плана');
      else labels.push('Период акции');
      // first(): у «Период акции» подпись совпадает с плейсхолдером поля.
      for (const l of labels) await expect(sheet.getByText(l, { exact: true }).first(), `подпись «${l}»`).toBeVisible();
      const triggers = sheet.locator('[data-slot="select-trigger"]');
      expect(await triggers.count()).toBeGreaterThanOrEqual(3);
      for (const trg of await triggers.all()) await expectVisibleBorder(trg, `поле «${await trg.textContent()}»`);
      await expect(sheet.locator('[data-slot="select-trigger"]').filter({ hasText: 'Все результаты' })).toBeVisible();
    });
  }

  test('М-П12 «Фильтры аудита» — поля с рамкой', async ({ app, page }) => {
    await app.open('audit');
    await page.getByRole('tab', { name: 'Аудит-лог' }).click();
    await page.getByRole('button', { name: 'Фильтры', exact: true }).filter({ visible: true }).click();
    const sheet = page.getByRole('dialog');
    await settled(sheet);
    for (const l of ['Пользователь', 'Роль', 'Тип действия', 'Объект']) {
      await expect(sheet.getByText(l, { exact: true }), `подпись «${l}»`).toBeVisible();
    }
    const triggers = sheet.locator('[data-slot="select-trigger"]');
    expect(await triggers.count()).toBe(4);
    for (const trg of await triggers.all()) await expectVisibleBorder(trg, `поле «${await trg.textContent()}»`);
  });

  test('М-П4 /users/u-6 — вкладки не шире экрана, «Журнал действий» открывается', async ({ app, page }) => {
    await app.open('users/u-6');
    await expect(page.getByRole('tab', { name: 'Профиль' })).toBeVisible();
    await fontsReady(page);
    await expectNoPageOverflow(page);
    const tab = page.getByRole('tab', { name: 'Журнал действий' });
    await tab.scrollIntoViewIfNeeded();
    await expectInViewport(tab, 'вкладка «Журнал действий»');
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});

test.describe('Аудит · десктоп', () => {
  // На lg вкладки (645px) делили строку с фильтрами дедлайна и обрезались:
  // «Аудит-лог» не был виден ни на 1024, ни на 1280, ни на 1440. Ниже lg контенту
  // меньше 645px (на 800 — 544) — там полоса прокручивается (как на телефоне, М-П3).
  for (const width of [1024, 1280, 1440]) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 900 }, isMobile: false, hasTouch: false, session: { user: 'u-2' } });

      test(`М-П3б /audit ${width}px — все четыре вкладки видны целиком`, async ({ app, page }) => {
        await app.open('audit');
        await expect(page.getByRole('tab', { name: 'Сроки по плану' })).toBeVisible();
        await fontsReady(page);
        await expectFits(page.getByRole('tablist').first(), 'полоса вкладок аудита');
        await expectNoPageOverflow(page);
      });
    });
  }
});

test.describe('Коммерческий директор', () => {
  test.use({ session: { user: 'u-1', role: ROLES.KD } });

  test('М-П10 «История и изменения» — вкладка «История версий» достижима', async ({ app, page }) => {
    await app.open('reports?promo=PR-2026-003');
    await page.getByRole('button', { name: 'История версий' }).filter({ visible: true }).click();
    const sheet = page.getByRole('dialog', { name: 'История и изменения' });
    await settled(sheet);
    await fontsReady(page);
    const tab = sheet.getByRole('tab', { name: 'История версий' });
    await tab.scrollIntoViewIfNeeded();
    await expectInViewport(tab, 'вкладка «История версий»');
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  test('М-П14 карточка согласования — строки карточками, глаз открывает панель', async ({ app, page }) => {
    await app.open('approvals/PR-2026-003~km-4');
    await expect(page.getByText(LINES.delonghi).filter({ visible: true }).first()).toBeVisible();
    await fontsReady(page);
    await expectNoPageOverflow(page);
    const card = page.locator('li').filter({ hasText: LINES.delonghi }).filter({ visible: true });
    await expect(card, 'карточка строки').toHaveCount(1);
    await expectInViewport(card, 'карточка строки');
    const eye = card.getByRole('button', { name: 'Просмотр деталей строки' });
    await expectInViewport(eye, 'кнопка-глаз');
    expect(await heightOf(eye), 'кнопка-глаз ниже 44px').toBeGreaterThanOrEqual(44);
    await eye.click();
    await settled(page.getByRole('dialog'));
    await expect(page.getByRole('dialog').getByText(LINES.delonghi).first()).toBeVisible();
  });

  test('М-П8 «Детали изменений» — обе кнопки решения в пределах экрана', async ({ app, page }) => {
    await app.open('approvals/PR-2026-003~km-4');
    await lineEye(page, LINES.delonghi).click();
    const drawer = page.getByRole('dialog');
    await settled(drawer);
    const approve = drawer.getByRole('button', { name: 'Согласовать строку' });
    const reject = drawer.getByRole('button', { name: 'Отклонить строку' });
    await expectInViewport(approve, '«Согласовать строку»');
    await expectInViewport(reject, '«Отклонить строку»');
  });

  test('М-П5 карточка согласования — нижняя панель не закрывает контент', async ({ app, page }) => {
    await app.open('approvals/PR-2026-002~km-5');
    const bar = page.locator('div.fixed.inset-x-0.bottom-0').filter({ has: page.getByRole('button', { name: /Согласовать/ }) });
    await expect(bar).toBeVisible();
    await scrollMainToBottom(page);
    const content = page.locator('main div.lg\\:sticky').first();
    const contentBox = await content.boundingBox();
    const barBox = await bar.boundingBox();
    expect(contentBox && barBox).toBeTruthy();
    expect(contentBox!.y + contentBox!.height, 'низ последнего блока под панелью').toBeLessThanOrEqual(barBox!.y);
    const buttons = bar.getByRole('button');
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);
    for (const b of await buttons.all()) {
      expect(await heightOf(b), `кнопка «${await b.textContent()}» ниже 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test('М-П6 «Календарные дедлайны» — плашки не сжаты в столбики', async ({ app, page }) => {
    await app.open('short-calendar/PR-2026-001');
    const chips = page.locator('span:has(> span:text-is("(календарные)"))');
    await expect(chips.first()).toBeVisible();
    await fontsReady(page);
    expect(await chips.count()).toBe(3);
    for (const chip of await chips.all()) {
      await expectInViewport(chip, `плашка «${await chip.textContent()}»`);
      for (const part of await chip.locator('> span').all()) {
        expect(await heightOf(part), `«${await part.textContent()}» в несколько строк`).toBeLessThanOrEqual(20);
      }
    }
  });

  test('М-П13 /reports «Фильтры» — поля с рамкой', async ({ app, page }) => {
    await app.open('reports?promo=PR-2026-003');
    await page.getByRole('button', { name: /^Фильтры/ }).filter({ visible: true }).first().click();
    const panel = page.locator('[data-slot="card"]').filter({ hasText: 'Сбросить фильтры' });
    await expect(panel).toBeVisible();
    const text = panel.locator('input[data-slot="input"]:not([type="number"])').first();
    await expectVisibleBorder(text, 'текстовое поле');
    const from = panel.locator('input[placeholder="от"]').first();
    const to = panel.locator('input[placeholder="до"]').first();
    await expectVisibleBorder(from, 'поле «от»');
    await expectVisibleBorder(to, 'поле «до»');
    const selects = panel.locator('[data-slot="select-trigger"]');
    expect(await selects.count()).toBeGreaterThanOrEqual(2);
    for (const s of (await selects.all()).slice(0, 2)) await expectVisibleBorder(s, `Select «${await s.textContent()}»`);
  });

  test('М-П15 редактор правила — без второй прокрутки', async ({ app, page }) => {
    await app.open('promo-types/rule-installment-12');
    const heading = page.getByRole('heading', { level: 2, name: 'Рассрочка 0-0-12' });
    await expect(heading).toBeVisible();
    const inner = await heading.evaluate((h) => {
      const root = h.closest('div.gap-4.pb-6') as HTMLElement | null;
      return root ? root.scrollHeight - root.clientHeight : null;
    });
    expect(inner, 'корень редактора не найден').not.toBeNull();
    expect(inner!, 'у редактора своя вертикальная прокрутка').toBeLessThanOrEqual(1);
  });

  test('М-П16 /approvals — «Все статусы согласования» не обрезано', async ({ app, page }) => {
    await app.open('approvals');
    const trigger = page.locator('[data-slot="select-trigger"]').filter({ hasText: 'Все статусы согласования' });
    await expect(trigger).toBeVisible();
    await fontsReady(page);
    await expectFits(trigger.locator('[data-slot="select-value"]'), 'значение «Статус согласования»');
    await expectInViewport(trigger, 'поле «Статус согласования»');
  });
});

test.describe('Категорийный менеджер', () => {
  test.use({ session: { user: 'u-4' } });

  test('М-П7 «Создать акцию» — переключатель без наезда иконок на текст', async ({ app, page }) => {
    await app.open('full-calendar');
    await page.getByRole('button', { name: 'Создать акцию' }).click();
    const dialog = page.getByRole('dialog');
    await settled(dialog);
    await fontsReady(page);
    for (const name of ['Выбрать плановое промо', 'Новая внеплановая']) {
      const trg = dialog.getByRole('tab', { name });
      await expectFits(trg, `вкладка «${name}»`);
      await expectInViewport(trg, `вкладка «${name}»`);
    }
  });
});
