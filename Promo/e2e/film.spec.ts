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

/** Порог «та же картинка» — спецификация v2, §1 п. 3. */
const SAME_FRAME_PSNR = 40;

type FrameDiff = { psnr: number; maxDelta: number; diffPixels: number };

/**
 * Сравнение двух PNG по PSNR (docs/superpowers/specs/2026-09-30-promo-motion-film-v2-design.md,
 * §1 п. 3): кадры — «та же картинка», если PSNR по каналам RGB ≥ 40 дБ.
 * Совпадение «до пикселя» и поканальный допуск недостижимы: Chrome растрирует
 * вложенное окно и его края по-разному в зависимости от истории отрисовки
 * страницы и нагрузки на видеокарту (до 50 уровней в одном столбце у края
 * окна, до 5 — на тексте под нагрузкой; PSNR ≈ 46–60 дБ). Другое содержимое
 * (иной экран, неприменённый клик, другая прокрутка) даёт PSNR заметно ниже 40.
 *
 * MSE — по R, G и B всех пикселей, PSNR = 10·log10(255² / MSE); одинаковые
 * кадры — +∞. maxDelta и diffPixels (по RGB) — только для сообщения об ошибке.
 * Кадры разного размера не сравниваются (исключение, а не сравнение
 * перекрытия). Декодирование — прямо в браузере (data-URL → Image →
 * canvas.getImageData), без новых npm-пакетов.
 */
async function frameDiff(page: Page, a: Buffer, b: Buffer): Promise<FrameDiff> {
  return page.evaluate(
    async ({ aB64, bB64 }) => {
      const load = (b64: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('frameDiff: PNG не декодируется'));
          img.src = `data:image/png;base64,${b64}`;
        });
      const [imgA, imgB] = await Promise.all([load(aB64), load(bB64)]);
      if (imgA.naturalWidth !== imgB.naturalWidth || imgA.naturalHeight !== imgB.naturalHeight) {
        throw new Error(
          `frameDiff: разный размер кадров — ${imgA.naturalWidth}×${imgA.naturalHeight} и ${imgB.naturalWidth}×${imgB.naturalHeight}`,
        );
      }
      const w = imgA.naturalWidth;
      const h = imgA.naturalHeight;
      const toPixels = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, w, h).data;
      };
      const pa = toPixels(imgA);
      const pb = toPixels(imgB);
      let sumSq = 0;
      let maxDelta = 0;
      let diffPixels = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const dr = pa[i] - pb[i];
        const dg = pa[i + 1] - pb[i + 1];
        const db = pa[i + 2] - pb[i + 2];
        sumSq += dr * dr + dg * dg + db * db;
        const d = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
        if (d > 0) {
          diffPixels++;
          if (d > maxDelta) maxDelta = d;
        }
      }
      const mse = sumSq / (w * h * 3);
      const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
      return { psnr, maxDelta, diffPixels };
    },
    { aB64: a.toString('base64'), bB64: b.toString('base64') },
  );
}

const describeDiff = (d: FrameDiff) =>
  `PSNR ${d.psnr.toFixed(2)} дБ, max |Δ| ${d.maxDelta}, отличающихся пикселей ${d.diffPixels}`;

/** Та же картинка: PSNR ≥ 40 дБ. */
function expectSameFrame(diff: FrameDiff) {
  expect(diff.psnr, describeDiff(diff)).toBeGreaterThanOrEqual(SAME_FRAME_PSNR);
}

/** Контроль «кадр меняется»: PSNR < 40 дБ — другая картинка, а не шум растра. */
function expectDifferentFrame(diff: FrameDiff) {
  expect(diff.psnr, describeDiff(diff)).toBeLessThan(SAME_FRAME_PSNR);
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
    // Контроль: кадр меняется во времени (1,2 → 1,5 с — въезжает окно-таблица; замер ≈ 14,6 дБ).
    expectDifferentFrame(await frameDiff(page, a, await shotAt(page, 1.5)));
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

  test('просмотр без записи доигрывает сигналы: директор согласует набор', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('embed/film');
    await expect(
      page.frameLocator('iframe[title="approval"]').getByText('Набор согласован коммерческим директором.'),
    ).toBeVisible({ timeout: 90_000 });
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
    await expect(page.getByText('А кто согласовал? В макете другая цена')).toBeVisible();
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
  // Каждый прямой переход в сцену-экран повторяет её с начала тактами 1/60
  // (канонический повтор, FilmPage.tsx) — под нагрузкой полного набора на это
  // уходят десятки секунд на тест.
  test.setTimeout(180_000);

  test('plan: живой экран, кадр детерминирован, хранилища вкладки чистые', async ({ page }) => {
    await openFilm(page);
    const plan = await at(page, 'plan');
    const a = await shotAt(page, plan.at + 2.5);
    await seek(page, plan.at + 2.9);
    await seek(page, plan.at + 0.5);
    const b = await shotAt(page, plan.at + 2.5);
    expectSameFrame(await frameDiff(page, a, b));
    // Контроль: камера движется (2,5 → 1,5 с сцены — другая поза; замер ≈ 14,1 дБ).
    expectDifferentFrame(await frameDiff(page, a, await shotAt(page, plan.at + 1.5)));
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

  test('повтор после ошибки начинает заход заново — окно пересобирается', async ({ page }) => {
    await openFilm(page);
    const plan = await at(page, 'plan');
    // Сбой посреди первого захода (прямой переход в сцену): после первого шага
    // seekTo ждёт document.fonts.ready верхней страницы — пусть он отвергнется.
    await page.evaluate(() => {
      Object.defineProperty(document, 'fonts', {
        configurable: true,
        get: () => ({ ready: Promise.reject(new Error('проба: сбой шага')) }),
      });
    });
    await expect(seek(page, plan.at + 0.5)).rejects.toThrow('проба: сбой шага');
    await page.evaluate(() => delete (document as { fonts?: unknown }).fonts);
    const planFrame = page.locator('iframe[title="plan"]');
    await expect(planFrame).toHaveCount(1); // окно недошедшего захода в кадре
    await planFrame.evaluate((el) => (el.dataset.probe = 'failed'));
    await seek(page, plan.at + 0.5); // повтор
    await expect(planFrame).toHaveCount(1);
    await expect(page.locator('iframe[title="plan"][data-probe]')).toHaveCount(0);
    // Контроль: продолжение вперёд окно не пересобирает — метка на нём выживает.
    await planFrame.evaluate((el) => (el.dataset.probe = 'kept'));
    await seek(page, plan.at + 0.8);
    await expect(page.locator('iframe[title="plan"][data-probe="kept"]')).toHaveCount(1);
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

  test('plan: страница прокручивается к таблице, рамка — на строке 26-3', async ({ page }) => {
    await openFilm(page);
    const plan = await at(page, 'plan');
    const frame = () => page.frames().find((f) => f.url().includes('/short-calendar?'))!;
    const scrollTop = () => frame().evaluate(() => document.querySelector('main')!.scrollTop);
    const highlight = page.locator('[data-film="highlight"]');
    await seek(page, plan.at + 0.5);
    expect(await scrollTop()).toBe(0);
    await expect(highlight).toHaveCount(0);
    await seek(page, plan.at + 2.6);
    expect(await scrollTop()).toBeCloseTo(300, 0);
    await expect(highlight).toHaveCount(1);
    const box = (await highlight.boundingBox())!;
    expect(box.width).toBeGreaterThan(1500); // строка — во всю ширину таблицы (1151 px окна × 1,55)
  });

  test('approval: панель «Было / Стало», директор согласует набор, перемотка назад отменяет', async ({ page }) => {
    await openFilm(page);
    const ap = await at(page, 'approval');
    const frame = page.frameLocator('iframe[title="approval"]');
    await seek(page, ap.at + 2.5);
    await expect(frame.getByRole('dialog')).toContainText(/Было\s*\/\s*Стало/i);
    const box = (await page.locator('[data-film="highlight"]').boundingBox())!;
    // Рамка — вокруг всего раздела (~99 px окна × 4,571 ≈ 506), не одного заголовка
    // (~28 px окна × 4,571 ≈ 128 — порог 300 разделяет их с запасом).
    expect(box.height).toBeGreaterThan(300);
    const a = await shotAt(page, ap.at + 5.5);
    await expect(frame.getByRole('dialog')).toHaveCount(0);
    await expect(frame.getByText('Набор согласован коммерческим директором.')).toBeVisible();
    await expect(frame.getByRole('row', { name: /De'Longhi/ })).toContainText('Согласовано ранее');
    await seek(page, ap.at + 2.5); // до решения (4,6 с): сцена монтируется заново (канонический повтор), клики до 2,5 с — заново
    await expect(frame.getByRole('dialog')).toHaveCount(1);
    // Пока открыта модальная панель, Radix прячет остальную страницу из дерева
    // доступности (проверено ariaSnapshot: фон отсутствует целиком) — обычная
    // getByRole не находит кнопку позади неё. includeHidden возвращает и скрытую
    // кнопку мобильной нижней панели (lg:hidden) — берём первую (десктопную, она
    // же видна на холсте на этом вьюпорте 1440×900).
    await expect(
      frame.getByRole('button', { name: 'Согласовать все изменения', includeHidden: true }).first(),
    ).toBeVisible();
    const b = await shotAt(page, ap.at + 5.5);
    expectSameFrame(await frameDiff(page, a, b));
  });

  test('deadlines: фильтр по ответственному — строки менеджера 26-3, без «раб. дн.»', async ({ page }) => {
    await openFilm(page);
    const dl = await at(page, 'deadlines');
    const frame = page.frameLocator('iframe[title="deadlines"]');
    await seek(page, dl.at + 1); // до фильтра
    await expect(frame.getByRole('tab', { name: 'Сроки по промо и отчётам' })).toHaveAttribute('aria-selected', 'true');
    await expect(frame.locator('tbody')).toContainText('раб. дн.'); // контроль: без фильтра такие строки есть
    const a = await shotAt(page, dl.at + 4.5);
    await expect(frame.getByRole('combobox').filter({ hasText: 'Рашидова Дилноза' })).toBeVisible();
    await expect(frame.locator('tbody tr')).toHaveCount(3);
    await expect(frame.locator('tbody')).toContainText('+8 кал. дн.');
    await expect(frame.locator('tbody')).not.toContainText('раб. дн.');
    await expect(page.locator('[data-film="highlight"]')).toHaveCount(1);
    await seek(page, dl.at + 1); // до фильтра — сцена монтируется заново (канонический повтор)
    await expect(frame.getByRole('combobox').filter({ hasText: 'Все ответственные' })).toBeVisible();
    const b = await shotAt(page, dl.at + 4.5);
    expectSameFrame(await frameDiff(page, a, b));
  });

  test('report: маркетинг видит изменения — «Только изменения», цены, рамка на новой цене', async ({ page }) => {
    await openFilm(page);
    const rp = await at(page, 'report');
    const frame = page.frameLocator('iframe[title="report"]');
    const toggle = frame.getByRole('switch', { name: 'Только изменения' });
    await seek(page, rp.at + 1);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('[data-film="highlight"]')).toHaveCount(1); // «Изменено: 2»
    const a = await shotAt(page, rp.at + 4.5);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(frame.getByText('Сотрудник маркетинга').first()).toBeVisible();
    const inner = page.frames().find((f) => f.url().includes('/reports?'))!;
    expect(
      await inner.evaluate(() =>
        Math.max(...[...document.querySelectorAll('div.overflow-x-auto')].map((el) => el.scrollLeft)),
      ),
    ).toBeGreaterThan(0);
    const highlight = page.locator('[data-film="highlight"]');
    await expect(highlight).toHaveCount(1); // новая цена
    // Рамка — над изменённой ячейкой «Новая цена», а не над случайным дублем
    // «4 440 000 сум» в колонке рассрочки той же строки; следующая колонка
    // «Скидка, %» — за правым краем видимой части тела таблицы.
    const cells = await inner.evaluate(() => {
      const norm = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();
      const rect = (el: Element) => {
        const b = el.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      };
      const body = [...document.querySelectorAll<HTMLElement>('div.overflow-x-auto')]
        .filter((el) => el.scrollWidth > el.clientWidth && el.clientHeight > 50)
        .sort((a, b) => b.clientHeight - a.clientHeight)[0];
      const help = [...body.querySelectorAll('.cursor-help')].find(
        (e) => e.getClientRects().length > 0 && norm(e.textContent) === '4 440 000 сум',
      )!;
      const cell = help.parentElement!;
      const discount = cell.nextElementSibling!;
      return {
        pane: rect(body),
        help: rect(help),
        cell: rect(cell),
        discount: { ...rect(discount), text: norm(discount.textContent) },
        duplicates: [...cell.parentElement!.children]
          .filter((c) => c !== cell && norm(c.textContent) === '4 440 000 сум')
          .map(rect),
      };
    });
    // Координаты окна → холст: окно сцены в этой позе только масштабировано и сдвинуто.
    const win = (await page.locator('iframe[title="report"]').boundingBox())!;
    const k = win.width / 1440;
    const mapX = (x: number) => win.x + x * k;
    const mapY = (y: number) => win.y + y * k;
    const box = (await highlight.boundingBox())!;
    const centerX = box.x + box.width / 2;
    expect(box.x).toBeLessThanOrEqual(mapX(cells.help.left));
    expect(box.x + box.width).toBeGreaterThanOrEqual(mapX(cells.help.right));
    expect(box.y).toBeLessThanOrEqual(mapY(cells.help.top));
    expect(box.y + box.height).toBeGreaterThanOrEqual(mapY(cells.help.bottom));
    expect(centerX).toBeGreaterThan(mapX(cells.cell.left));
    expect(centerX).toBeLessThan(mapX(cells.cell.right));
    // Контроль: дубль в строке есть — и рамка не над ним.
    expect(cells.duplicates).toHaveLength(1);
    expect(centerX < mapX(cells.duplicates[0].left) || centerX > mapX(cells.duplicates[0].right)).toBe(true);
    // Цена — целиком в видимой части, «Скидка, %» (16%) — за её правым краем.
    expect(cells.cell.left).toBeGreaterThanOrEqual(cells.pane.left);
    expect(cells.cell.right).toBeLessThanOrEqual(cells.pane.right + 0.5);
    expect(cells.discount.text).toBe('16%');
    expect(cells.discount.left).toBeGreaterThanOrEqual(cells.pane.right - 0.5);
    await seek(page, rp.at + 1); // до переключателя (1,6 с) — сцена монтируется заново (канонический повтор)
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    const b = await shotAt(page, rp.at + 4.5);
    expectSameFrame(await frameDiff(page, a, b));
  });
});
