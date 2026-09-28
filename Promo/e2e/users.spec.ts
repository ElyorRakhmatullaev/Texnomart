import type { Page } from '@playwright/test';
import { test, expect, type App } from './fixtures';
import { FIXED_NOW, ROLES, USERS } from './data';

const tableScroller = (page: Page) =>
  page.locator('div.overflow-x-auto').filter({ has: page.getByRole('table') }).first();
const stickyTrack = (page: Page) => page.locator('div[aria-hidden="true"].sticky.bottom-0');

async function editUser(app: App, userId: string) {
  await app.open(`users/${userId}`);
  await app.page.getByRole('button', { name: 'Редактировать' }).click();
  const dialog = app.page.getByRole('dialog', { name: 'Редактировать пользователя' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openAudit(app: App) {
  await app.open('audit');
  await app.page.getByRole('tab', { name: 'Аудит-лог' }).click();
}

async function assignSubstitute(app: App, who: RegExp, from: string, to: string, reason: string) {
  const page = app.page;
  await page.getByRole('button', { name: /Назначить (замещение|другого)/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Назначить замещение КД' });
  await app.select(dialog.getByRole('combobox').first(), who);
  const [fromBtn, toBtn] = [dialog.getByLabel('С даты'), dialog.getByLabel('По дату')];
  await app.pickDate(fromBtn, from);
  await app.pickDate(toBtn, to);
  await dialog.getByLabel(/Причина/).fill(reason);
  await dialog.getByRole('button', { name: 'Назначить', exact: true }).click();
  await app.toast('Замещение назначено');
}

async function slaTexts(app: App) {
  await app.switchRole(ROLES.KD);
  await app.open('approvals');
  const text = (await app.page.locator('main').textContent()) ?? '';
  await app.switchRole(ROLES.ADMIN);
  return text.match(/\d+ раб\. дн\. \(до \d{2}\.\d{2}\.\d{4}\)|\+\d+ дн\./g) ?? [];
}

test.describe('№21 / №24 п.1 · таблица по ширине экрана', () => {
  test('21-1 · на 1440 без горизонтальной прокрутки', async ({ app, page }) => {
    await app.open('users');
    await expect(app.userRow(USERS['u-2'].name)).toBeVisible();
    const [scroll, client] = await tableScroller(page).evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(scroll).toBeLessThanOrEqual(client);
    await expect(stickyTrack(page)).toHaveCount(0);
  });

  test.describe('узкий экран', () => {
    test.use({ viewport: { width: 1000, height: 800 } });

    test('21-2 · закреплённая полоса прокрутки видна и двигает таблицу', async ({ app, page }) => {
      await app.open('users');
      const track = stickyTrack(page);
      await expect(track).toBeVisible();
      const box = await track.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(800);
      await track.evaluate((el) => {
        el.scrollLeft = 200;
        el.dispatchEvent(new Event('scroll'));
      });
      await expect.poll(() => tableScroller(page).evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });

    test('21-3 · «ФИО · email» остаётся слева при прокрутке', async ({ app, page }) => {
      await app.open('users');
      const row = app.userRow(USERS['u-4'].name);
      const first = row.locator('td').first();
      const other = row.locator('td').nth(3);
      const before = { first: (await first.boundingBox())!.x, other: (await other.boundingBox())!.x };
      await tableScroller(page).evaluate((el) => {
        el.scrollLeft = 300;
      });
      await expect.poll(async () => (await other.boundingBox())!.x).toBeLessThan(before.other); // контроль
      expect(Math.abs((await first.boundingBox())!.x - before.first)).toBeLessThanOrEqual(1);
    });
  });

  test.describe('телефон', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('21-4 · карточки вместо таблицы', async ({ app, page }) => {
      await app.open('users');
      await expect(page.getByText(/Создал\(а\): /).first()).toBeVisible();
      await expect(page.getByRole('table')).toBeHidden();
    });
  });
});

test.describe('№22 · учётные записи и роли', () => {
  test('22-1 · «Создана · кем» заполнена у всех', async ({ app, page }) => {
    await app.open('users');
    const rows = page.getByRole('row').filter({ has: page.locator('td') });
    await expect(rows).toHaveCount(8);
    for (const text of await rows.locator('td:nth-child(6)').allTextContents()) {
      expect(text).toMatch(/\d{2}\.\d{2}\.\d{4}\s*\S+/);
    }
    await expect(app.userRow(USERS['u-2'].name)).toContainText('Первичная настройка системы');
    await expect(app.userRow(USERS['u-7'].name)).toContainText('Алиева Нигора');
  });

  test('22-2 · роли разделены по типам, истёкшая помечена', async ({ app, page }) => {
    await app.open('users/u-4');
    await page.getByRole('tab', { name: 'Роли и доступ' }).click();
    // u-4 (users-store.ts SEED_USERS) несёт только primary + temporary —
    // «Дополнительные роли» рендерится лишь когда items.length > 0
    // (UserDetailPage.tsx:414-420), а у u-4 дополнительных ролей нет. Проверяем
    // обе группы, которые реально присутствуют, и тем же локатором подтверждаем,
    // что пустая группа корректно не показывается (план ошибочно ждал все три).
    for (const g of ['Основная роль', 'Временные роли']) {
      await expect(page.getByText(g, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Дополнительные роли', { exact: true })).toHaveCount(0);
    const temp = page.getByText(/с 01\.05\.2026 по 31\.05\.2026/);
    await expect(temp).toBeVisible();
    await expect(page.getByText('срок истёк').first()).toBeVisible();
  });

  test('22-3 · истёкшая временная роль не действует', async ({ app, page }) => {
    await app.open('users');
    await app.select(page.getByRole('combobox').filter({ hasText: 'Все роли' }), ROLES.SKM);
    await expect(page.getByText('Показано: 1')).toBeVisible();
    await expect(app.userRow(USERS['u-5'].name)).toBeVisible(); // контроль
    await expect(app.userRow(USERS['u-4'].name)).toHaveCount(0);
  });

  test('22-4 · деактивация и активация', async ({ app }) => {
    await app.open('users');
    const row = app.userRow(USERS['u-4'].name);
    await expect(row).toContainText('Активен');
    await app.userAction(USERS['u-4'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await expect(row).toContainText('Деактивирован');
    await app.userAction(USERS['u-4'].name, 'Активировать');
    await app.toast('Пользователь активирован');
    await expect(row).toContainText('Активен');
  });

  test('22-5 · статус «Деактивирован» сохраняется', async ({ app, page }) => {
    await app.open('users');
    await app.userAction(USERS['u-4'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await page.reload();
    await expect(app.userRow(USERS['u-4'].name)).toContainText('Деактивирован');
  });

  test('22-6 · должно остаться не менее двух администраторов', async ({ app, page }) => {
    await app.open('users');
    await app.userRow(USERS['u-2'].name).getByRole('button', { name: 'Действия' }).click();
    for (const item of ['Отозвать права администратора', 'Деактивировать']) {
      const mi = page.getByRole('menuitem', { name: item, exact: true });
      await expect(mi).toHaveAttribute('aria-disabled', 'true');
      await expect(mi).toHaveAttribute('title', 'Должно остаться не менее двух администраторов');
    }
    await page.keyboard.press('Escape');
    await app.userRow(USERS['u-4'].name).getByRole('button', { name: 'Действия' }).click();
    await expect(page.getByRole('menuitem', { name: 'Деактивировать', exact: true })).not.toHaveAttribute('aria-disabled', 'true'); // контроль
    await page.keyboard.press('Escape');

    const dialog = await editUser(app, 'u-2');
    await dialog.getByRole('button', { name: ROLES.ADMIN, exact: true }).first().click();
    // u-2 несёт ровно одну постоянную роль — сняв её, форма сама блокирует
    // «Сохранить» через `roles.length === 0` (UserFormDialog.tsx:219-222) раньше,
    // чем дойдёт до гварда ≥2 администраторов. Добавляем вторую роль, чтобы форма
    // осталась валидной и сработала проверка в UserDetailPage.tsx:213-225.
    await dialog.getByRole('button', { name: ROLES.KM, exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Должно остаться не менее двух администраторов.');
  });

  test.describe('администратор подразделения', () => {
    test.use({ session: { user: 'u-6' } });

    test('22-7 · видит только своё подразделение, не выдаёт глобальные роли', async ({ app, page }) => {
      await app.open('users');
      await expect(page.getByText('Вы — администратор подразделения «Маркетинг»: управление ограничено вашим подразделением.')).toBeVisible();
      await expect(page.getByText('Показано: 1')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Создать пользователя' })).toHaveCount(0);
      const dialog = await editUser(app, 'u-6');
      for (const role of [ROLES.ADMIN, ROLES.KD]) {
        const chip = dialog.getByRole('button', { name: role, exact: true }).first();
        await expect(chip, role).toBeDisabled();
        await expect(chip, role).toHaveAttribute('title', 'Изменять эту роль может только глобальный администратор');
      }
      await expect(dialog.getByRole('button', { name: ROLES.KM, exact: true }).first()).toBeEnabled(); // контроль
    });
  });

  test.describe('не администратор', () => {
    // UsersPage.tsx:72 — `effectiveAdminScope(currentUser) ?? (currentRole === "Администратор"
    // ? "global" : null)` reads the LOGGED-IN identity's own stored roles via
    // `rolesOf()` (users-store.ts:433-438), independent of the god-mode role
    // switcher (current-user-context.tsx:22-26 keys `currentUser` only by
    // `promo:current-user-id`). u-2 is a real admin, so switching the
    // DISPLAYED role to KM (as the plan's original session did) does NOT gate
    // `/users` — the admin UI still renders. Use a genuinely non-admin identity.
    test.use({ session: { user: 'u-4' } });

    test('22-8 · экран закрыт', async ({ app, page }) => {
      await app.open('users');
      await expect(page.getByText('Доступ только для администраторов')).toBeVisible();
      await expect(page.getByRole('table')).toHaveCount(0);
      // Контроль тем же локатором: у реального администратора в отдельной
      // вкладке та же таблица есть.
      const admin = await app.newTabAs('u-2');
      await admin.open('users');
      await expect(admin.page.getByRole('table')).toBeVisible();
    });
  });

  test('22-9 · проверки формы создания', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: 'Создать пользователя' }).click();
    const form = page.getByRole('dialog', { name: 'Новый пользователь' });
    await form.getByLabel('ФИО').fill('Тест Проверок');
    await form.getByLabel('Email (логин)').fill('not-an-email');
    // UserFormDialog.tsx:404 — «Создать» несёт `disabled={!isValid}`, так что клик
    // по невалидной форме (план так и делал) просто висит до таймаута. Сообщение
    // реактивно и уже видно после ввода — отдельного клика не нужно.
    await expect(form.getByText('Введите корректный email.')).toBeVisible();
    await form.getByLabel('Email (логин)').fill('check@texnomart.uz');

    await form.getByRole('button', { name: /Добавить временную роль/ }).click();
    await expect(form.getByText('У временной роли укажите обе даты периода.')).toBeVisible();
    // UserFormDialog.tsx:292-305 — «По дату» несёт `minDate=«С даты»`: если сперва
    // выставить «С даты», календарь «По дату» блокирует более ранние дни, и
    // обратный порядок через сам календарь не достижим. Обе подписи — plain
    // <Label> без htmlFor/id, находим поля через родительский блок подписи и
    // сначала ставим «По дату» (пока она ничем не ограничена), потом «С даты» позже неё.
    const fromField = form.getByText('С даты', { exact: true }).locator('xpath=..').getByRole('button');
    const toField = form.getByText('По дату', { exact: true }).locator('xpath=..').getByRole('button');
    await app.pickDate(toField, '05.10.2026');
    await app.pickDate(fromField, '10.10.2026');
    await expect(form.getByText('Дата окончания временной роли раньше даты начала.')).toBeVisible();

    await app.pickDate(toField, '20.10.2026');
    await expect(form.getByText('Дата окончания временной роли раньше даты начала.')).toBeHidden();

    // UserFormDialog.tsx:231-398 — комбобоксы идут в DOM-порядке [временная роль,
    // Подразделение, Руководитель]; ни одна из 9 ролей не содержит подстроку
    // «роль» (проверено — «Выберите роль» нигде в исходниках нет), поэтому
    // исходный фильтр `hasText: /Выберите роль|роль/i` не находил ничего.
    await app.select(form.getByRole('combobox').first(), ROLES.KM);
    await expect(form.getByText(`Роль «${ROLES.KM}» уже назначена постоянно — временная не нужна.`)).toBeVisible();
  });
});

test.describe('№24 · роли в журнале', () => {
  test('24-1 · временная роль с периодом и основанием', async ({ app, page }) => {
    // Дефект: временная роль, добавленная через UserFormDialog, не получает
    // assignedBy/assignedAt (UserFormDialog.tsx:319-340 создаёт запись только с
    // role/kind/from/to; UserDetailPage.tsx:249-256 передаёт её в
    // setRoleAssignments как есть, не восполняя поля — в отличие от неиспользуемого
    // users-store.ts:274-297 `addTemporaryRole`, который их проставляет, но нигде
    // не вызывается). Из-за этого «назначил(а): …» в «Роли и доступ» не появляется.
    test.fail(true, 'Дефект: временная роль без assignedBy/assignedAt — «назначил(а)» не отображается (UserFormDialog.tsx:319-340)');

    const dialog = await editUser(app, 'u-8');
    await dialog.getByRole('button', { name: /Добавить временную роль/ }).click();
    // UserFormDialog.tsx:231-398 — временная роль всегда первый комбобокс.
    await app.select(dialog.getByRole('combobox').first(), ROLES.SKM);
    await app.pickDate(dialog.getByRole('button', { name: /Выберите дату/ }).first(), '01.10.2026');
    await app.pickDate(dialog.getByRole('button', { name: /Выберите дату/ }).first(), '15.10.2026');
    // UserFormDialog.tsx:307-308 — «Основание» — Input без <Label>, только placeholder.
    await dialog.getByPlaceholder('Основание (необязательно)').fill('Отпуск старшего КМ');
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');

    await page.getByRole('tab', { name: 'Роли и доступ' }).click();
    await expect(page.getByText(/с 01\.10\.2026 по 15\.10\.2026/)).toBeVisible();

    await page.getByRole('tab', { name: 'Журнал действий' }).click();
    const journal = page.getByRole('tabpanel');
    await expect(journal.getByText('изменение ролей', { exact: true })).toBeVisible();
    await expect(journal).toContainText('(временно 01.10.2026–15.10.2026)');
    await expect(journal).toContainText('Основание: Отпуск старшего КМ');
    await expect(journal).toContainText('Администратор Системы');
    await expect(journal).toContainText('28.09.2026 12:00');

    // Известный дефект (см. test.fail выше) — проверяется последней.
    await page.getByRole('tab', { name: 'Роли и доступ' }).click();
    await expect(page.getByText(/назначил\(а\): Администратор Системы/).first()).toBeVisible();
  });

  test('24-2 · запись в аудите — только в «Все действия»', async ({ app, page }) => {
    const dialog = await editUser(app, 'u-5');
    await dialog.getByRole('button', { name: ROLES.KM, exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');
    await openAudit(app);
    const roleChange = page.getByRole('row').filter({ hasText: 'изменение ролей' });
    // AuditLogTable.tsx:251,282 — «Записей: N» рендерится дважды (десктоп/мобильная
    // копии сосуществуют в DOM); на дефолтном 1440×900 видна только десктопная,
    // она же первая (тот же приём, что в fixtures.ts `expectPasswordsNotLeaked`).
    await expect(page.getByText(/Записей: \d+/).first()).toBeVisible();
    await expect(roleChange).toHaveCount(0);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    await expect(roleChange.first()).toBeVisible();
    await expect(roleChange.first()).toContainText('Пользователь');
  });

  test('24-3 · снятие дополнительной роли — «было → стало»', async ({ app, page }) => {
    const dialog = await editUser(app, 'u-5');
    await dialog.getByRole('button', { name: ROLES.KM, exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');
    const journal = await app.openJournal('u-5');
    await expect(journal.getByText('изменение ролей', { exact: true })).toBeVisible();
    await expect(journal).toContainText('Роли');
    await expect(journal).toContainText(ROLES.KM);
    await expect(journal).toContainText('→');
  });
});

test.describe('№25 · временное замещение КД', () => {
  test('25-1 · досрочное снятие пишется в историю и аудит', async ({ app, page }) => {
    await app.open('users');
    // UsersTable.tsx:82-90 — `{badge.label}` заканчивается на «КД», а следующий
    // <span>до …</span> начинается сразу с новой строки JSX рядом с тегом — такой
    // перенос убирается компилятором целиком (не схлопывается в пробел), поэтому
    // в разметке «…КДдо 31.12» без пробела; план ожидал пробел, которого нет в исходнике.
    await expect(app.userRow(USERS['u-8'].name)).toContainText(/Уполномоченное лицо КД\s*до 31\.12/);
    await expect(page.getByText('c 15.06.2026 по 31.12.2026').first()).toBeVisible(); // латинская «c» — как в коде
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Снять замещение?' });
    await confirm.getByRole('button', { name: 'Снять', exact: true }).click();
    await app.toast('Замещение снято');
    await expect(page.getByText('Замещение не назначено')).toBeVisible();
    await page.getByRole('button', { name: /История замещений/ }).click();
    await expect(page.getByText(/Снято досрочно 28\.09\.2026/)).toBeVisible();

    await openAudit(app);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: 'снятие замещения' });
    await expect(row.first()).toContainText('c 15.06.2026 по 31.12.2026');
    await expect(row.first()).toContainText('Отпуск коммерческого директора');
  });

  test('25-2 · назначение пишется в аудит', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Снять', exact: true }).click();
    await app.toast('Замещение снято');
    await assignSubstitute(app, /^Исмаилов Жасур/, '28.09.2026', '10.10.2026', 'Командировка КД');
    await expect(page.getByText('c 28.09.2026 по 10.10.2026').first()).toBeVisible();

    await openAudit(app);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: 'назначение замещения' });
    await expect(row.first()).toContainText('Замещение КД: c 28.09.2026 по 10.10.2026');
    await expect(row.first()).toContainText('Командировка КД');
    await expect(row.first()).toContainText('Администратор Системы');
  });

  test('25-3 · без причины и с обратным периодом не назначается', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: /Назначить (замещение|другого)/ }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Назначить замещение КД' });
    const submit = dialog.getByRole('button', { name: 'Назначить', exact: true });
    await app.select(dialog.getByRole('combobox').first(), /^Исмаилов Жасур/);
    // KdSubstitutionPanel.tsx:306-314 — «По дату» несёт `minDate=«С даты»`: если
    // сперва выставить «С даты», календарь «По дату» блокирует более ранние дни
    // (план так и делал, день 5 оказывается disabled). Ставим «По дату» первой —
    // она ничем не ограничена, пока «С даты» пуста, — а «С даты» позже неё.
    await app.pickDate(dialog.getByLabel('По дату'), '05.10.2026');
    await app.pickDate(dialog.getByLabel('С даты'), '10.10.2026');
    await expect(dialog.getByText('Дата окончания раньше даты начала.')).toBeVisible();
    await expect(submit).toBeDisabled();
    await app.pickDate(dialog.getByLabel('По дату'), '20.10.2026');
    await expect(submit).toBeDisabled(); // причины ещё нет
    await dialog.getByLabel(/Причина/).fill('Командировка');
    await expect(submit).toBeEnabled();
  });

  test('25-4 · история замещений свёрнута и показывает истёкшие', async ({ app, page }) => {
    await app.open('users');
    const toggle = page.getByRole('button', { name: 'История замещений (2)' });
    await expect(page.getByText('Срок истёк 31.03.2026')).toBeHidden();
    await toggle.click();
    await expect(page.getByText('Срок истёк 31.03.2026')).toBeVisible();
  });

  test('25-5 · назначение и снятие не меняют сроки согласования', async ({ app, page }) => {
    await app.open('users');
    const before = await slaTexts(app);
    expect(before.length).toBeGreaterThan(0);
    await app.open('users');
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Снять', exact: true }).click();
    await app.toast('Замещение снято');
    expect(await slaTexts(app)).toEqual(before);
    await app.open('users');
    await assignSubstitute(app, /^Исмаилов Жасур/, '28.09.2026', '10.10.2026', 'Командировка КД');
    expect(await slaTexts(app)).toEqual(before);
  });

  test('25-6 · замещение с будущей даты — запланировано', async ({ app, page }) => {
    await app.open('users');
    await page.getByRole('button', { name: 'Снять замещение' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Снять', exact: true }).click();
    await assignSubstitute(app, /^Исмаилов Жасур/, '05.10.2026', '10.10.2026', 'Отпуск КД');
    await expect(page.getByText('Замещение не назначено')).toBeVisible();
    // KdSubstitutionPanel.tsx:73,202-218 — «История замещений» свёрнута по
    // умолчанию (Collapsible), а «Запланировано …» рендерится только внутри неё.
    await page.getByRole('button', { name: /История замещений/ }).click();
    await expect(page.getByText(/Запланировано с 05\.10\.2026/)).toBeVisible();
  });

  test.describe('после окончания срока', () => {
    test.use({ now: new Date('2027-01-02T12:00:00+05:00') });

    test('25-7 · замещение истекает само', async ({ app, page }) => {
      await app.open('users');
      await expect(app.userRow(USERS['u-8'].name)).toBeVisible();
      await expect(app.userRow(USERS['u-8'].name)).not.toContainText('Уполномоченное лицо КД');
      await expect(page.getByText('Замещение не назначено')).toBeVisible();
      await page.getByRole('button', { name: /История замещений/ }).click();
      await expect(page.getByText('Срок истёк 31.12.2026')).toBeVisible();
    });
  });

  test('25-8 · новое замещение при действующем пишет снятие предыдущего', async ({ app, page }) => {
    test.fail(true, 'Дефект: предыдущее замещение снимается без записи в аудит (KdSubstitutionPanel.tsx:131-154)');
    await app.open('users');
    await assignSubstitute(app, /^Исмаилов Жасур/, '28.09.2026', '10.10.2026', 'Командировка КД');
    await openAudit(app);
    await page.getByRole('button', { name: 'Все действия', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'назначение замещения' }).first()).toBeVisible(); // контроль
    await expect(page.getByRole('row').filter({ hasText: 'снятие замещения' }).first()).toBeVisible();
  });
});

test.describe('№26 · журнал действий по пользователю', () => {
  test('26-1 · подразделение, должность, руководитель — «было → стало»', async ({ app }) => {
    const dialog = await editUser(app, 'u-4');
    await app.select(dialog.getByRole('combobox').filter({ hasText: 'Категорийный менеджмент' }), 'Маркетинг');
    await dialog.getByLabel('Должность').fill('Ведущий категорийный менеджер');
    await app.select(dialog.getByRole('combobox').filter({ hasText: USERS['u-5'].name }), USERS['u-1'].name);
    await dialog.getByRole('button', { name: 'Сохранить' }).click();
    await app.toast('Пользователь обновлён');
    const journal = await app.openJournal('u-4');
    await expect(journal.getByText('изменение профиля', { exact: true })).toBeVisible();
    await expect(journal).toContainText(/Подразделение[\s\S]*Категорийный менеджмент[\s\S]*Маркетинг/);
    await expect(journal).toContainText(/Должность[\s\S]*Категорийный менеджер[\s\S]*Ведущий категорийный менеджер/);
    await expect(journal).toContainText(/Руководитель[\s\S]*Исмаилов Жасур[\s\S]*Сардор Мавлянов/);
  });

  test('26-2 · деактивация, активация, сброс пароля — без пароля', async ({ app }) => {
    await app.open('users');
    await app.userAction(USERS['u-4'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await app.userAction(USERS['u-4'].name, 'Активировать');
    await app.toast('Пользователь активирован');
    await app.userAction(USERS['u-4'].name, 'Сбросить пароль');
    await app.toast('Пароль сброшен');
    const done = app.page.getByRole('button', { name: 'Готово' });
    if (await done.isVisible()) await done.click();
    const users = JSON.parse((await app.storage('promo:users')) ?? '[]') as { id: string; password: string }[];
    const temp = users.find((u) => u.id === 'u-4')!.password;

    const journal = await app.openJournal('u-4');
    for (const [action, comment] of [
      ['деактивация', 'Учётная запись деактивирована'],
      ['восстановление', 'Учётная запись активирована'],
      ['сброс пароля', 'Сброшен пароль, выдан новый временный'],
    ]) {
      await expect(journal.getByText(action, { exact: true }), action).toBeVisible();
      await expect(journal.getByText(comment), comment).toBeVisible();
    }
    await app.expectPasswordsNotLeaked([temp]);
  });

  test('26-3 · права администратора — назначение и отзыв', async ({ app }) => {
    await app.open('users');
    await app.userAction(USERS['u-5'].name, 'Назначить администратором');
    await app.toast('Назначены права администратора');
    await app.userAction(USERS['u-5'].name, 'Отозвать права администратора');
    await app.toast('Права администратора отозваны');
    const journal = await app.openJournal('u-5');
    await expect(journal.getByText('назначение прав', { exact: true })).toBeVisible();
    await expect(journal.getByText('отзыв прав', { exact: true })).toBeVisible();
  });

  test('26-4 · журнал — от новых к старым', async ({ app, page }) => {
    await app.open('users');
    await app.userAction(USERS['u-5'].name, 'Назначить администратором');
    await app.toast('Назначены права администратора');
    await page.clock.setFixedTime(new Date(FIXED_NOW.getTime() + 60_000));
    await app.userAction(USERS['u-5'].name, 'Отозвать права администратора');
    await app.toast('Права администратора отозваны');
    const journal = await app.openJournal('u-5');
    const text = (await journal.textContent()) ?? '';
    expect(text.indexOf('отзыв прав')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('отзыв прав')).toBeLessThan(text.indexOf('назначение прав'));
    await expect(journal).toContainText('28.09.2026 12:01');
  });
});
