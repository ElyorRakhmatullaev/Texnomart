import { test, expect } from './fixtures';
import { ROLES } from './data';

/**
 * Карточка согласования (S3) — дефекты вне №12–27 (спецификация e2e §5.2).
 * Повторные заявки по 26-3 (promo-mock-data.ts, buildRepeatReviewItems):
 * КМ-1 — одна строка, добавление LG OLED (L-0022); КМ-4 — две строки,
 * изменение De'Longhi (L-0015) и исключение блендера Bosch (L-0024).
 */
const REPEAT_KM1 = 'PR-2026-003~km-1';
const REPEAT_KM4 = 'PR-2026-003~km-4';
const card = (id: string) => `approvals/${encodeURIComponent(id)}`;

test.describe('§5.2 · карточка согласования', () => {
  test.use({ session: { user: 'u-1', role: ROLES.KD } });

  test('Д-5 · переход между заявкой и несуществующим id не роняет карточку', async ({ app, page }) => {
    await app.open(card(REPEAT_KM1));
    await expect(page.getByText(/Строк с решением: 1/)).toBeVisible();
    // Переход внутри приложения (тот же экземпляр страницы, другой :id) — так
    // меняется число отрисованных хуков, если часть из них стоит после раннего return.
    const go = (id: string) =>
      page.evaluate((next) => {
        history.pushState(null, '', location.pathname.replace(/[^/]+$/, encodeURIComponent(next)));
        dispatchEvent(new PopStateEvent('popstate'));
      }, id);
    await go('NOPE');
    await expect(page.getByText('Заявка не найдена')).toBeVisible();
    await go(REPEAT_KM1);
    await expect(page.getByText(/Строк с решением: 1/)).toBeVisible();
  });

  test('Д-6 · решённая повторная заявка после перезагрузки не возвращается на решение', async ({ app, page }) => {
    await app.open(card(REPEAT_KM1));
    await expect(page.getByText(/Строк с решением: 1/)).toBeVisible();
    await page.getByRole('button', { name: 'Согласовать все изменения' }).click();
    await app.toast(/Изменения согласованы \(1\)/);
    await page.reload();
    await expect(page.getByText('Согласовано КД', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Строк с решением/)).toHaveCount(0);
    // Контроль: вторая повторная заявка той же акции по-прежнему ждёт решения.
    await app.open(card(REPEAT_KM4));
    await expect(page.getByText(/Строк с решением: 2/)).toBeVisible();
  });
});
