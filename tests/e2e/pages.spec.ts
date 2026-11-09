import { test, expect } from '@playwright/test';
test('production під вкладеним шляхом: ресурси, урок, reload і редактор', async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()}: ${response.url()}`);
  });
  await page.goto(baseURL!);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Від першого',
  );
  await expect(page.locator('.module-card')).toHaveCount(6);
  await page.locator('.module-card').nth(2).click();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Робимо сторінку цікавішою',
  );
  await page.locator('.stage-nav button').nth(2).click();
  const iframe = page.locator('iframe[title="Результат HTML та CSS"]');
  await expect(iframe).toHaveAttribute('sandbox', '');
  await expect(
    page
      .frameLocator('iframe[title="Результат HTML та CSS"]')
      .getByRole('heading', { name: 'Мої захоплення' }),
  ).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Результат HTML та CSS"]')
      .getByRole('img', { name: 'Гірські вершини під сонцем' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
