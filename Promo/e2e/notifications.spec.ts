import type { Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { PROMO, ROLES } from './data';

const CARD = 'div.flex.gap-3.rounded-lg.border';
const cards = (page: Page) => page.locator(CARD);

type Seed = [type: string, promoNo: string];

async function expectExactly(app: App, expected: Seed[]) {
  await app.open('notifications');
  for (const [type, no] of expected) await expect(app.notification(type, no), `${type} ${no}`).toHaveCount(1);
  await expect(cards(app.page)).toHaveCount(expected.length);
}

async function expectYouAs(page: Page, role: string) {
  await expect(page.getByText('Вам как:').first()).toBeVisible();
  await expect(cards(page).filter({ hasText: 'Вам как:' }).first()).toContainText(role);
  await expect(page.getByText('Получают роли:')).toHaveCount(0);
}

test.describe('№17 · КМ', () => {
  test.use({ session: { user: 'u-4' } });

  test('17-1 · только события схемы КМ', async ({ app, page }) => {
    await expectExactly(app, [
      ['Назначение КМ', '26-2'],
      ['Возврат на корректировку', '26-1'],
      ['Согласовано КД', '26-3'],
      ['Заявка о неучастии', '26-6'],
    ]);
    await expect(page.getByText('2 непрочит.')).toBeVisible();
    await expect(cards(page).filter({ hasText: 'Повторная отправка' })).toHaveCount(0);
    await expect(cards(page).filter({ hasText: 'Акция отменена' })).toHaveCount(0);
    await expectYouAs(page, ROLES.KM);
  });

  test('17-8 · «Отметить прочитанным» сохраняется и не трогает других пользователей', async ({ app, page }) => {
    await app.open('notifications');
    const card = app.notification('Назначение КМ', '26-2');
    await expect(page.getByText('2 непрочит.')).toBeVisible();
    await card.getByRole('button', { name: 'Отметить прочитанным' }).click();
    await expect(page.getByText('1 непрочит.')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Отметить прочитанным' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('1 непрочит.')).toBeVisible();
    await expect(app.notification('Назначение КМ', '26-2').getByRole('button', { name: 'Отметить прочитанным' })).toHaveCount(0);

    const other = await app.newTabAs('u-8', ROLES.KM);
    await other.open('notifications');
    await expect(
      other.notification('Назначение КМ', '26-2').getByRole('button', { name: 'Отметить прочитанным' }),
    ).toBeVisible();
  });

  test('17-9 · настройки уведомлений закрыты не-администратору', async ({ app, page }) => {
    await app.open('notification-settings');
    await expect(page.getByText('Недостаточно прав. Экран доступен только роли «Администратор».')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Уведомления' })).toBeVisible(); // контроль
    // На /notification-settings хлебная крошка текущей страницы тоже рендерится
    // как role=link с тем же именем «Настройки уведомлений» — берём именно пункт
    // боковой панели (data-sidebar="menu-button", packages/ui/src/sidebar.tsx:517),
    // как в full-calendar.spec.ts:414-417.
    await expect(
      page.locator('[data-sidebar="menu-button"]').filter({ hasText: 'Настройки уведомлений' }),
    ).toHaveCount(0);
  });
});

test.describe('№17 · старший КМ', () => {
  test.use({ session: { user: 'u-5' } });

  test('17-2 · повторная отправка по 26-2 есть, по 26-1 — нет', async ({ app, page }) => {
    await expectExactly(app, [
      ['Новое промо на согласование', '26-1'],
      ['Повторная отправка', '26-2'],
      ['Срок истекает сегодня', '26-9'],
      ['Автопередача КД', '26-2'],
    ]);
    await expect(app.notification('Повторная отправка', '26-1')).toHaveCount(0);
    await expect(page.getByText('4 непрочит.')).toBeVisible();
    await expectYouAs(page, ROLES.SKM);
  });
});

test.describe('№17 · коммерческий директор', () => {
  test.use({ session: { user: 'u-1' } });

  test('17-3 · повторная отправка по 26-1 есть, события этапа старшего КМ — нет', async ({ app, page }) => {
    await expectExactly(app, [
      ['Новое промо на согласование', '26-8'],
      ['Повторная отправка', '26-1'],
      ['Автопередача КД', '26-2'],
      ['Просрочка срока согласования', '26-6'],
    ]);
    await expect(app.notification('Повторная отправка', '26-2')).toHaveCount(0);
    await expect(app.notification('Новое промо на согласование', '26-1')).toHaveCount(0);
    await expect(app.notification('Срок истекает сегодня', '26-9')).toHaveCount(0);
    await expect(page.getByText('4 непрочит.')).toBeVisible();
    await expectYouAs(page, ROLES.KD);
  });
});

test.describe('№17 · смежные отделы', () => {
  test.use({ session: { user: 'u-6' } });

  const REPORT_EVENTS: Seed[] = [
    ['Новая версия отчёта', '26-3'],
    ['Новая версия отчёта', '26-15'],
    ['Новый отчёт по акции', '26-7'],
  ];

  test('17-4 · только отчётные события, у каждого «Открыть отчёт»', async ({ app, page }) => {
    await expectExactly(app, REPORT_EVENTS);
    for (const [type, no] of REPORT_EVENTS) {
      await expect(app.notification(type, no).getByRole('link', { name: 'Открыть отчёт' })).toBeVisible();
    }
    await app.notification('Новая версия отчёта', '26-15').getByRole('link', { name: 'Открыть отчёт' }).click();
    await expect(page).toHaveURL(new RegExp(`/reports\\?promo=${PROMO.u15.id}$`));
    await expect(page.getByText('Добавлено: 1')).toBeVisible();
  });

  test('17-5 · закупу и аналитике — тот же набор', async ({ app }) => {
    await app.open('notifications');
    for (const role of [ROLES.PUR, ROLES.ANL]) {
      await app.switchRole(role);
      await expectExactly(app, REPORT_EVENTS);
    }
  });

  test('17-6 · в карточке — роль, в которой пришло уведомление', async ({ app, page }) => {
    await app.open('notifications');
    await expectYouAs(page, ROLES.MKT);
  });
});

test.describe('№17 · администратор и настройки (25.09)', () => {
  const kmCancelled = (page: Page) =>
    page.getByRole('switch', { name: `${ROLES.KM}: Акция отменена` });

  test('17-7 · компактные блоки по ролям', async ({ app, page }) => {
    await app.open('notifications');
    for (const title of ['КМ', 'Старший КМ', 'Коммерческий директор', 'Смежные отделы', 'Директор маркетинга и операционный директор']) {
      await expect(page.getByText(title, { exact: true }).first(), title).toBeVisible();
    }
    await page.getByRole('button', { name: 'Показать все (8)' }).click();
    // Боковая панель тоже даёт кнопку-тултип «Свернуть» (сворачивание сайдбара) —
    // берём кнопку блока внутри контентной области (<main>, app-shell.tsx:545).
    await expect(page.getByRole('main').getByRole('button', { name: 'Свернуть' })).toBeVisible();
  });

  test('НУ-1 · включённый тип появляется у роли', async ({ app, page }) => {
    await app.open('notifications');
    await app.switchRole(ROLES.KM);
    await expect(app.notification('Возврат на корректировку', '26-1')).toHaveCount(1); // контроль
    await expect(app.notification('Акция отменена', PROMO.p4.no)).toHaveCount(0);
    await app.switchRole(ROLES.ADMIN);
    await app.open('notification-settings');
    await kmCancelled(page).click();
    await expect(kmCancelled(page)).toBeChecked();
    await app.switchRole(ROLES.KM);
    await app.open('notifications');
    await expect(app.notification('Акция отменена', PROMO.p4.no)).toHaveCount(1);
  });

  test('НУ-2 · настройка сохраняется, «Сбросить к умолчаниям» её снимает', async ({ app, page }) => {
    await app.open('notification-settings');
    await kmCancelled(page).click();
    await page.reload();
    await expect(kmCancelled(page)).toBeChecked();
    await page.getByRole('button', { name: 'Сбросить к умолчаниям' }).click();
    await expect(kmCancelled(page)).not.toBeChecked();
    await app.switchRole(ROLES.KM);
    await app.open('notifications');
    await expect(app.notification('Возврат на корректировку', '26-1')).toHaveCount(1); // контроль
    await expect(app.notification('Акция отменена', PROMO.p4.no)).toHaveCount(0);
  });

  test('НУ-3 · выключенный тип пропадает у роли', async ({ app, page }) => {
    await app.open('notifications');
    await app.switchRole(ROLES.KD);
    await expect(app.notification('Просрочка срока согласования', '26-6')).toHaveCount(1);
    await app.switchRole(ROLES.ADMIN);
    await app.open('notification-settings');
    const sw = page.getByRole('switch', { name: `${ROLES.KD}: Просрочка срока согласования` });
    await expect(sw).toBeChecked();
    await sw.click();
    await app.switchRole(ROLES.KD);
    await app.open('notifications');
    await expect(app.notification('Автопередача КД', '26-2')).toHaveCount(1); // контроль
    await expect(app.notification('Просрочка срока согласования', '26-6')).toHaveCount(0);
  });

  test('НУ-4 · настройка не расширяет адресата события этапа', async ({ app, page }) => {
    await app.open('notification-settings');
    await expect(page.getByRole('switch', { name: `${ROLES.KD}: Повторная отправка` })).toBeChecked();
    await app.switchRole(ROLES.KD);
    await app.open('notifications');
    await expect(app.notification('Повторная отправка', '26-1')).toHaveCount(1);
    await expect(app.notification('Повторная отправка', '26-2')).toHaveCount(0);
  });
});
