import { test, expect, type Page } from '@playwright/test';

/** «Сейчас» режима кадра — FILM_NOW в src/film/frame-mode.ts (= FIXED_NOW e2e). */
const FILM_NOW = Date.parse('2026-09-28T12:00:00+05:00');

function frameUrl(path: string, q: Record<string, string> = {}) {
  const query = new URLSearchParams({
    'film-frame': '1',
    role: 'Коммерческий директор',
    user: 'u-1',
    theme: 'light',
    ...q,
  });
  return `${path}?${query}`;
}

test.describe('режим кадра', () => {
  test('вход из адреса, зафиксированная дата, анимации выключены', async ({ page }) => {
    await page.goto(frameUrl('short-calendar'));
    await expect(page.getByRole('heading', { name: 'Краткий промо-календарь' })).toBeVisible();
    expect(await page.evaluate(() => Date.now())).toBe(FILM_NOW);
    expect(await page.evaluate(() => new Date().getTime())).toBe(FILM_NOW);
    expect(await page.evaluate(() => new Date(2026, 0, 15).getDate())).toBe(15);
    const toggle = page.getByRole('button', { name: 'Переключить тему' });
    expect(await toggle.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  });

  test('роль, пользователь и тема берутся из адреса', async ({ page }) => {
    await page.goto(frameUrl('audit', { role: 'Администратор', user: 'u-2', theme: 'dark' }));
    await expect(page.getByRole('heading', { name: 'Аудит-лог и контроль сроков' })).toBeVisible();
    await expect(page.getByText('Администратор', { exact: true }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('экран открывается от корня по film-path', async ({ page }) => {
    await page.goto(`?${new URLSearchParams({ 'film-frame': '1', 'film-path': 'audit', role: 'Коммерческий директор', user: 'u-1', theme: 'light' })}`);
    await expect(page.getByRole('heading', { name: 'Аудит-лог и контроль сроков' })).toBeVisible();
    expect(new URL(page.url()).pathname).toMatch(/\/audit$/); // и под базой GitHub Pages /…/promo/
  });

  test('кадр не пишет в хранилища вкладки', async ({ page, context }) => {
    await page.goto(frameUrl('short-calendar'));
    await expect(page.getByRole('heading', { name: 'Краткий промо-календарь' })).toBeVisible();
    await page.evaluate(() => localStorage.setItem('film-probe', '1'));
    // Контроль: в памяти кадра запись есть.
    expect(await page.evaluate(() => localStorage.getItem('film-probe'))).toBe('1');
    const other = await context.newPage();
    await other.goto('login');
    expect(await other.evaluate(() => localStorage.getItem('film-probe'))).toBeNull();
  });

  test('без film-frame приложение прежнее', async ({ page }) => {
    await page.goto('short-calendar');
    await expect(page).toHaveURL(/\/login/);
    const drift = Math.abs((await page.evaluate(() => Date.now())) - Date.now());
    expect(drift).toBeLessThan(60_000);
    const submit = page.getByRole('button', { name: 'Войти' });
    expect(await submit.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
  });
});

type Capture = {
  duration: number;
  chapters: { key: string; at: number; end: number }[];
  seek(t: number): Promise<void>;
};
declare global {
  interface Window {
    __capture?: Capture;
  }
}

async function openFilm(page: Page, query = '') {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`embed/film?capture=1${query}`);
  await page.waitForFunction(() => !!window.__capture);
}
const seek = (page: Page, t: number) => page.evaluate((t) => window.__capture!.seek(t), t);
const chapters = (page: Page) => page.evaluate(() => window.__capture!.chapters);
async function shotAt(page: Page, t: number) {
  await seek(page, t);
  return page.screenshot();
}
const at = async (page: Page, key: string) => (await chapters(page)).find((c) => c.key === key)!;

/**
 * Сравнение двух PNG с допуском спецификации («Уточнено при реализации
 * 30.09», docs/superpowers/specs/2026-09-30-promo-motion-film-v2-design.md
 * §«done when» №3): «до пикселя» недостижимо для живых вложенных экранов —
 * Chrome растрирует их по-разному в зависимости от истории отрисовки
 * страницы (FilmPage.tsx, комментарий у seekTo). Декодирует оба PNG прямо в
 * браузере (data-URL → Image → canvas.getImageData) — без новых npm-пакетов.
 */
async function frameDiff(
  page: Page,
  a: Buffer,
  b: Buffer,
): Promise<{ maxDelta: number; diffPixels: number }> {
  return page.evaluate(
    async ({ aB64, bB64 }) => {
      const load = (b64: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = `data:image/png;base64,${b64}`;
        });
      const [imgA, imgB] = await Promise.all([load(aB64), load(bB64)]);
      const w = imgA.width;
      const h = imgA.height;
      const toPixels = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, w, h).data;
      };
      const da = toPixels(imgA);
      const db = toPixels(imgB);
      let maxDelta = 0;
      let diffPixels = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(
          Math.abs(da[i] - db[i]),
          Math.abs(da[i + 1] - db[i + 1]),
          Math.abs(da[i + 2] - db[i + 2]),
          Math.abs(da[i + 3] - db[i + 3]),
        );
        if (d > 0) {
          diffPixels++;
          if (d > maxDelta) maxDelta = d;
        }
      }
      return { maxDelta, diffPixels };
    },
    { aB64: a.toString('base64'), bB64: b.toString('base64') },
  );
}

/** Канал ≤ 2 уровня из 255, отличающихся пикселей ≤ 0,1 % кадра (≤ 2 073 при 1920×1080). */
function expectSameFrame(diff: { maxDelta: number; diffPixels: number }) {
  expect(diff.maxDelta).toBeLessThanOrEqual(2);
  expect(diff.diffPixels).toBeLessThanOrEqual(2073);
}

test.describe('фильм: запись', () => {
  test('__capture: главы подряд от «before-files», длительность — конец последней', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      chapters: window.__capture!.chapters,
    }));
    expect(cap.chapters[0]).toMatchObject({ key: 'before-files', at: 0 });
    for (let i = 1; i < cap.chapters.length; i++) {
      expect(cap.chapters[i].at).toBe(cap.chapters[i - 1].end);
    }
    expect(cap.chapters.at(-1)!.end).toBe(cap.duration);
  });

  test('кадр фрагмента не зависит от пути перемотки', async ({ page }) => {
    await openFilm(page);
    const a = await shotAt(page, 1.2);
    await seek(page, 4);
    await seek(page, 0.2);
    const b = await shotAt(page, 1.2);
    expectSameFrame(await frameDiff(page, a, b));
    const c = await shotAt(page, 1.5);
    const diffAC = await frameDiff(page, a, c);
    expect(diffAC.maxDelta > 2 || diffAC.diffPixels > 2073).toBe(true); // контроль: кадр меняется во времени
  });

  test('фильм всегда светлый, даже при тёмной теме вкладки', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('promo:pref-theme', 'dark'));
    await page.goto('login');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/); // контроль: тема вкладки тёмная
    await openFilm(page);
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });

  test('без capture фильм играет сам и не отдаёт __capture', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('embed/film');
    await expect(page.getByText('План акций — в десяти файлах.')).toBeVisible();
    expect(await page.evaluate(() => window.__capture)).toBeUndefined();
    await expect(page.getByText('Кто согласовал? Никто не знает.')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('фильм: сценарий', () => {
  test.setTimeout(120_000);

  test('48 с, тринадцать глав по порядку', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      keys: window.__capture!.chapters.map((c) => c.key),
    }));
    expect(cap).toEqual({
      duration: 48,
      keys: [
        'before-files', 'before-chat', 'before-deadlines', 'before-depts', 'before-pile',
        'logo', 'plan', 'fullcal', 'approval', 'deadlines', 'report', 'recap', 'final',
      ],
    });
  });

  test('первый акт: боли по очереди, цена на макете — из посева 26-3', async ({ page }) => {
    await openFilm(page);
    await seek(page, (await at(page, 'before-chat')).at + 2.5);
    await expect(page.getByText('Кто согласовал? Никто не знает.')).toBeVisible();
    await expect(page.getByText('А кто согласовал? В макете 16%')).toBeVisible();
    await seek(page, (await at(page, 'before-depts')).at + 2.5);
    await expect(page.getByText('Маркетинг узнаёт последним.')).toBeVisible();
    await expect(page.getByText('4 990 000 сум')).toBeVisible();
    await expect(page.getByText('4 440 000 сум')).toBeVisible();
    await expect(page.getByText('Цена устарела')).toBeVisible();
  });

  test('куча обрывается в чёрное на последний удар', async ({ page }) => {
    await openFilm(page);
    const pile = await at(page, 'before-pile');
    await seek(page, pile.at + 1);
    await expect(page.getByText('И так — каждую акцию.')).toBeVisible();
    await expect(page.getByText('Цена устарела')).toBeVisible(); // контроль: иллюстрации в куче
    await seek(page, pile.at + 1.9);
    await expect(page.getByText('И так — каждую акцию.')).toHaveCount(0);
    await expect(page.getByText('Цена устарела')).toHaveCount(0);
  });

  test('список болей: пуст в начале второго акта, перечёркивается по сценам, гаснет к итогу', async ({ page }) => {
    await openFilm(page);
    const tracker = page.locator('[data-film="pain-tracker"]');
    const struck = tracker.locator('[data-struck="true"]');
    await seek(page, (await at(page, 'before-pile')).at + 1);
    await expect(tracker).toHaveCount(0);
    await seek(page, (await at(page, 'plan')).at + 1);
    await expect(tracker.locator('[data-pain]')).toHaveCount(4);
    await expect(struck).toHaveCount(0);
    await seek(page, (await at(page, 'approval')).at + 0.5);
    await expect(struck).toHaveCount(1);
    await expect(tracker.locator('[data-pain="files"]')).toHaveAttribute('data-struck', 'true');
    await seek(page, (await at(page, 'report')).at + 5.5);
    await expect(struck).toHaveCount(4);
    await seek(page, (await at(page, 'recap')).at + 1);
    await expect(tracker).toHaveCount(0);
  });

  test('итог: гарантии на месте болей', async ({ page }) => {
    await openFilm(page);
    const recap = await at(page, 'recap');
    await seek(page, recap.at + 0.4);
    await expect(page.getByText('План в десяти файлах')).toBeVisible(); // контроль: сначала — боли
    await seek(page, recap.at + 3.5);
    for (const fix of [
      'Один план. Одна версия.',
      'Каждая правка — с решением директора',
      'У каждого срока — ответственный',
      'Маркетинг видит изменения сразу',
    ]) {
      await expect(page.getByText(fix)).toBeVisible();
    }
    await expect(page.getByText('План в десяти файлах')).toHaveCount(0);
  });

  test('фрагменты детерминированы', async ({ page }) => {
    await openFilm(page);
    const depts = await at(page, 'before-depts');
    const recap = await at(page, 'recap');
    const a = await shotAt(page, depts.at + 2);
    await seek(page, recap.at + 2);
    const b = await shotAt(page, depts.at + 2);
    expectSameFrame(await frameDiff(page, a, b));
  });

  test('узбекская версия: переводятся титры, интерфейс и иллюстрации — русские', async ({ page }) => {
    await openFilm(page, '&lang=uz');
    await seek(page, (await at(page, 'before-files')).at + 1);
    await expect(page.getByText("Aksiyalar rejasi — o'nta faylda.")).toBeVisible();
    await expect(page.getByText('План_акций_октябрь.xlsx')).toBeVisible();
    await seek(page, (await at(page, 'plan')).at + 1.5);
    await expect(page.getByText("Bitta reja. Bitta versiya.")).toBeVisible();
    await expect(page.locator('[data-film="pain-tracker"]')).toContainText("Reja o'nta faylda");
  });
});

test.describe('фильм: сцены-экраны', () => {
  test.setTimeout(120_000);

  test('plan: живой экран, кадр детерминирован, хранилища вкладки чистые', async ({ page }) => {
    await openFilm(page);
    const plan = await at(page, 'plan');
    const a = await shotAt(page, plan.at + 2.5);
    await seek(page, plan.at + 2.9);
    await seek(page, plan.at + 0.5);
    const b = await shotAt(page, plan.at + 2.5);
    expectSameFrame(await frameDiff(page, a, b));
    const c = await shotAt(page, plan.at + 1.5);
    const diffAC = await frameDiff(page, a, c);
    expect(diffAC.maxDelta > 2 || diffAC.diffPixels > 2073).toBe(true); // контроль: камера движется
    await expect(
      page.frameLocator('iframe[title="plan"]').getByRole('heading', { name: 'Краткий промо-календарь' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => [sessionStorage.getItem('auth'), sessionStorage.getItem('promo:current-role')]),
    ).toEqual([null, null]);
    // Контроль: внутри кадра вход есть — в его памяти.
    const inner = page.frames().find((f) => f.url().includes('film-frame=1'))!;
    expect(await inner.evaluate(() => sessionStorage.getItem('auth'))).toBe('true');
  });

  test('fullcal: только акция 26-3, панорама прокручивает таблицу, кадр детерминирован', async ({ page }) => {
    await openFilm(page);
    const fc = await at(page, 'fullcal');
    const a = await shotAt(page, fc.at + 3);
    await seek(page, fc.at + 3.8);
    await seek(page, fc.at + 1.5);
    const b = await shotAt(page, fc.at + 3);
    expectSameFrame(await frameDiff(page, a, b));
    await expect(page.frameLocator('iframe[title="fullcal"]').getByText(/Показано: 1 промо/)).toBeVisible();
    // Сцена-экран с прокруткой перематывается назад пересборкой окна (канонический
    // повтор пути записи, FilmPage.tsx) — берём текущий <iframe> заново на каждое
    // обращение, а не один раз: после seek(page, fc.at + 0.5) ниже прежний узел уже
    // отсоединён.
    const currentFrame = () => page.frames().find((f) => f.url().includes('/full-calendar?'))!;
    expect(currentFrame().url()).toContain('promo=PR-2026-003');
    const maxScroll = () =>
      currentFrame().evaluate(() =>
        Math.max(...[...document.querySelectorAll('div.overflow-x-auto')].map((el) => el.scrollLeft)),
      );
    expect(await maxScroll()).toBeGreaterThan(0);
    await seek(page, fc.at + 0.5); // до начала прокрутки — сцена началась заново
    expect(await maxScroll()).toBe(0);
  });

  test('fullcal: прыжок воспроизводит путь настоящей покадровой записи', async ({ page }) => {
    await openFilm(page);
    const fc = await at(page, 'fullcal');
    // Такт за тактом, как настоящая запись: из «плана» (за секунду до конца
    // fullcal) в fullcal — вход в сцену-экран из другой сцены-экрана тем же
    // механизмом (смена sceneKey → новый заход), что и назад внутри сцены.
    let atStart: Buffer | undefined;
    let atHalf: Buffer | undefined;
    let atThree: Buffer | undefined;
    const startI = Math.round((fc.at - 1) * 60);
    const endI = Math.round((fc.at + 3) * 60);
    for (let i = startI; i <= endI; i++) {
      await seek(page, i / 60);
      if (i === Math.round(fc.at * 60)) atStart = await page.screenshot();
      if (i === Math.round((fc.at + 0.5) * 60)) atHalf = await page.screenshot();
      if (i === endI) atThree = await page.screenshot();
    }
    await seek(page, fc.at + 3.8);
    await seek(page, fc.at + 1.5);
    const backAndForth = await shotAt(page, fc.at + 3); // прыжок назад-вперёд к тому же моменту

    // Прямые снимки — каждый со своего свежего захода (сцена-фрагмент между
    // ними закрывает предыдущий, см. «ушли со сцены-экрана» в seekTo).
    const freshAt = (await at(page, 'before-files')).at;
    await seek(page, freshAt);
    const directStart = await shotAt(page, fc.at);
    await seek(page, freshAt);
    const directHalf = await shotAt(page, fc.at + 0.5);
    await seek(page, freshAt);
    const directThree = await shotAt(page, fc.at + 3);

    expectSameFrame(await frameDiff(page, atStart!, directStart));
    expectSameFrame(await frameDiff(page, atHalf!, directHalf));
    expectSameFrame(await frameDiff(page, atThree!, directThree));
    expectSameFrame(await frameDiff(page, backAndForth, directThree));
  });
});
