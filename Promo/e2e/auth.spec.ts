import { test, expect } from './fixtures';
import { PROMO, USERS } from './data';

const admin = USERS['u-2'];

// Все тесты файла входят и выходят сами.
test.use({ session: null });

test.describe('Вход', () => {
  test('ВХ-1 · обычный вход ведёт на краткий календарь', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await expect(page).toHaveURL(/\/short-calendar$/);
    await app.toast('Добро пожаловать в систему!');
  });

  test('ВХ-2 · неверный пароль и неизвестный email дают одно сообщение', async ({ app, page }) => {
    await app.openLogin();
    await app.submitLogin(admin.email, 'wrong-password');
    await expect(page.getByText('Неверный email или пароль.')).toBeVisible();
    await app.submitLogin('nobody@texnomart.uz', admin.password);
    await expect(page.getByText('Неверный email или пароль.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('ВХ-3 · пять неудач блокируют вход', async ({ app, page }) => {
    await app.openLogin();
    for (let i = 1; i <= 3; i++) {
      await app.submitLogin(admin.email, `wrong-${i}`);
      await expect(page.getByRole('button', { name: 'Войти' })).toBeEnabled();
    }
    await expect(page.getByText('Осталось 2 попытки. После блокировка на 15 минут.')).toBeVisible();
    await app.submitLogin(admin.email, 'wrong-4');
    await expect(page.getByText('Осталось 1 попытка. После блокировка на 15 минут.')).toBeVisible();
    await app.submitLogin(admin.email, 'wrong-5');
    await expect(page.getByText(/Заблокировано\. Повторите через \d+:\d{2}/)).toBeVisible();
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeDisabled();
  });

  test('ВХ-4 · деактивированный пользователь не входит', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await app.open('users');
    await app.userAction(USERS['u-8'].name, 'Деактивировать');
    await app.toast('Пользователь деактивирован');
    await app.logout();
    await app.submitLogin(USERS['u-8'].email, USERS['u-8'].password);
    await expect(page.getByText('Учётная запись заблокирована. Обратитесь к администратору.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Прямая ссылка (25.09)', () => {
  test('ПС-1 · после входа открывается отчёт из ссылки', async ({ app, page }) => {
    await app.open(`reports?promo=${PROMO.u15.id}`);
    await expect(page).toHaveURL(/\/login/);
    await app.submitLogin(admin.email, admin.password);
    await expect(page).toHaveURL(new RegExp(`/reports\\?promo=${PROMO.u15.id}$`));
    // 26-15 — не отчёт по умолчанию (по умолчанию 26-3): счётчики только у 26-15.
    await expect(page.getByText('Добавлено: 1')).toBeVisible();
    await expect(page.getByText('Исключено: 1')).toBeVisible();
  });

  test('ПС-2 · после входа открывается полный календарь с акцией из ссылки', async ({ app, page }) => {
    await app.open(`full-calendar?promo=${PROMO.p1.id}`);
    await expect(page).toHaveURL(/\/login/);
    await app.submitLogin(admin.email, admin.password);
    await expect(page).toHaveURL(new RegExp(`/full-calendar\\?promo=${PROMO.p1.id}$`));
    await expect(
      page.getByText(`Показана акция по ссылке из календаря готовности: № ${PROMO.p1.no}`),
    ).toBeVisible();
  });
});

test.describe('№23 · пароли в журнале', () => {
  const NEW_PASSWORD = 'NewPass2026!x';

  test('23-1 · первый вход требует сменить временный пароль', async ({ app, page }) => {
    const user = USERS['u-7'];
    await app.login(user.email, user.password);
    await expect(page).toHaveURL(/\/change-password$/);
    await app.open('users');
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByText('Это первый вход — задайте постоянный пароль, чтобы продолжить.')).toBeVisible();
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Сохранить и войти' }).click();
    await app.toast('Пароль изменён. Добро пожаловать!');
    await expect(page).toHaveURL(/\/short-calendar$/);

    await app.logout();
    await app.login(admin.email, admin.password);
    const journal = await app.openJournal('u-7');
    await expect(journal.getByText('смена пароля', { exact: true })).toBeVisible();
    await expect(journal.getByText('Временный пароль заменён постоянным при первом входе')).toBeVisible();
    await app.expectPasswordsNotLeaked([user.password, NEW_PASSWORD]);
  });

  test('23-2 · форма смены пароля не пропускает слабый или несовпадающий пароль', async ({ app, page }) => {
    const user = USERS['u-7'];
    await app.login(user.email, user.password);
    const save = page.getByRole('button', { name: 'Сохранить и войти' });
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill('Other2026!xyz');
    await expect(page.getByText('Пароли не совпадают')).toBeVisible();
    await expect(save).toBeDisabled();
    for (const weak of ['Ab1!short', 'Abcdefgh1234']) {
      await page.locator('#password').fill(weak);
      await page.locator('#confirmPassword').fill(weak);
      await expect(page.getByText('Пароли совпадают')).toBeVisible();
      await expect(save).toBeDisabled();
    }
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_PASSWORD);
    await expect(save).toBeEnabled();
  });

  test('23-3 · сброс пароля пишется в журнал без пароля', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await app.open('users');
    await app.userAction(USERS['u-4'].name, 'Сбросить пароль');
    await app.toast('Пароль сброшен');
    const users = JSON.parse((await app.storage('promo:users')) ?? '[]') as { id: string; password: string }[];
    const temp = users.find((u) => u.id === 'u-4')!.password;
    expect(temp).not.toBe(USERS['u-4'].password);
    const done = page.getByRole('button', { name: 'Готово' });
    if (await done.isVisible()) await done.click();

    const journal = await app.openJournal('u-4');
    await expect(journal.getByText('сброс пароля', { exact: true })).toBeVisible();
    await expect(journal.getByText('Сброшен пароль, выдан новый временный')).toBeVisible();
    await app.expectPasswordsNotLeaked([temp]);
  });

  test('23-4 · создание пользователя пишется в журнал, первый вход — со сменой пароля', async ({ app, page }) => {
    await app.login(admin.email, admin.password);
    await app.open('users');
    await page.getByRole('button', { name: 'Создать пользователя' }).click();
    const form = page.getByRole('dialog', { name: 'Новый пользователь' });
    await form.getByLabel('ФИО').fill('Тестовый Пользователь');
    await form.getByLabel('Email (логин)').fill('e2e.user@texnomart.uz');
    await form.getByRole('button', { name: 'Создать' }).click();
    const tempDialog = page.getByRole('dialog', { name: 'Временный пароль' });
    await expect(tempDialog).toBeVisible();
    const temp = ((await tempDialog.locator('code').textContent()) ?? '').trim();
    expect(temp).toHaveLength(12);
    await tempDialog.getByRole('button', { name: 'Готово' }).click();
    await app.toast('Пользователь создан');

    await app.userAction('Тестовый Пользователь', 'Открыть');
    await page.getByRole('tab', { name: 'Журнал действий' }).click();
    const journal = page.getByRole('tabpanel');
    await expect(journal.getByText('создание', { exact: true })).toBeVisible();
    await expect(journal.getByText(/выдан временный пароль/)).toBeVisible();
    await app.expectPasswordsNotLeaked([temp]);

    await app.logout();
    await app.openLogin();
    await app.submitLogin('e2e.user@texnomart.uz', temp);
    await expect(page).toHaveURL(/\/change-password$/);
  });

  test('23-5 · смена пароля в профиле пишется в журнал', async ({ app, page }) => {
    const user = USERS['u-4'];
    await app.login(user.email, user.password);
    await app.openUserMenu();
    await page.getByRole('menuitem', { name: 'Профиль' }).click();
    await page.getByRole('tab', { name: 'Безопасность' }).click();
    await page.locator('#currentPassword').fill('Wrong2026!pass');
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();
    await expect(page.getByText('Текущий пароль неверён')).toBeVisible();
    await page.locator('#currentPassword').fill(user.password);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();
    await app.toast('Пароль изменён');

    await app.logout();
    await app.login(admin.email, admin.password);
    const journal = await app.openJournal('u-4');
    await expect(journal.getByText('Пароль изменён владельцем учётной записи')).toBeVisible();
    // F5: каждый пароль, введённый/показанный в этом тесте — старый (u-4),
    // неверный текущий и новый — не должен утечь в журнал/аудит.
    await app.expectPasswordsNotLeaked([user.password, 'Wrong2026!pass', NEW_PASSWORD]);
  });
});
