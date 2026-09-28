import { test, expect, parseCsv, readXlsx } from './fixtures';
import { ROLES } from './data';

test.describe('Обвязка', () => {
  test('время и пояс зафиксированы', async ({ app, page }) => {
    await app.open('short-calendar');
    const [iso, tz] = await page.evaluate(() => [
      new Date().toISOString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ]);
    expect(iso).toBe('2026-09-28T07:00:00.000Z');
    expect(tz).toBe('Asia/Tashkent');
  });

  test('вход из фикстуры и смена роли без перезагрузки', async ({ app, page }) => {
    await app.open('short-calendar');
    await expect(page).toHaveURL(/\/short-calendar/);
    await app.switchRole(ROLES.KM);
    await app.openUserMenu();
    await expect(page.getByRole('menuitem', { name: ROLES.KM, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => sessionStorage.getItem('promo:current-role'))).toBe(ROLES.KM);
    await page.reload();
    expect(await page.evaluate(() => sessionStorage.getItem('promo:current-role'))).toBe(ROLES.KM);
  });

  test('pickDate выбирает дату в DatePickerField', async ({ app, page }) => {
    await app.open('audit');
    await page.getByRole('tab', { name: 'Аудит-лог' }).click();
    // «Дата, с» — плашка-подпись (<span>), не связанная с кнопкой через aria/htmlFor
    // (AuditLogFilters.tsx:157,191-205: Field рендерит <span>{label}</span> рядом с полем,
    // DatePickerField.tsx:48 не получает id) — доступное имя кнопки лишь «Выберите дату».
    const from = page.getByText('Дата, с', { exact: true }).locator('xpath=..').getByRole('button');
    await app.pickDate(from, '15.08.2026');
    await expect(page.getByRole('button', { name: /15\.08\.2026/ })).toBeVisible();
  });

  test('CSV скачивается и разбирается', async ({ app, page }) => {
    await app.open('short-calendar');
    const file = await app.download(() => app.menu(page.getByRole('button', { name: 'Экспорт' }), 'CSV'));
    const rows = parseCsv(file.text);
    expect(rows[0][0]).toBe('№ промо');
    expect(rows.length).toBeGreaterThan(1);
  });

  test('XLSX скачивается и читается', async ({ app, page }) => {
    await app.open('users');
    const file = await app.download(() => page.getByRole('button', { name: 'Экспорт' }).click());
    expect(file.name).toBe('Пользователи_2026-09-28.xlsx');
    const xlsx = readXlsx(file.buffer);
    expect(xlsx.rows(xlsx.sheetNames[0]).length).toBeGreaterThan(1);
  });
});
