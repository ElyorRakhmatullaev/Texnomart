/** Проверки мобильной вёрстки (390px): общие для mobile.spec.ts и mobile-full-calendar.spec.ts. */
import { expect, type Locator, type Page } from '@playwright/test';

/** Телефон, на котором снимался мобильный набор 30.09 (iPhone 12–15). */
export const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
} as const;

/**
 * Контент AppShell прокручивается внутри <main>, а не документом: боковая
 * прокрутка страницы = <main> шире своего окна.
 */
export async function expectNoPageOverflow(page: Page) {
  const overflow = await page.locator('main').first().evaluate((m) => m.scrollWidth - m.clientWidth);
  expect(overflow, 'боковая прокрутка <main>').toBeLessThanOrEqual(1);
}

/** Содержимое элемента не вылезает за его рамку по горизонтали (scrollWidth учитывает и overflow: visible). */
export async function expectFits(locator: Locator, label: string) {
  const overflow = await locator.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow, `${label}: содержимое шире рамки`).toBeLessThanOrEqual(1);
}

/** Элемент целиком в пределах окна по горизонтали. */
export async function expectInViewport(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label}: элемента нет на странице`).not.toBeNull();
  const vw = locator.page().viewportSize()?.width ?? 0;
  expect(box!.x, `${label}: левый край за экраном`).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width, `${label}: правый край за экраном`).toBeLessThanOrEqual(vw + 1);
}

/**
 * Рамка поля видна. В светлой теме `--input` прозрачный: поле с `bg-white`
 * на белой поверхности без явной рамки не видно совсем.
 */
export async function expectVisibleBorder(locator: Locator, label: string) {
  const color = await locator.evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(color, `${label}: рамка прозрачная`).not.toBe('rgba(0, 0, 0, 0)');
}
