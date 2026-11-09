import { test, expect } from '@playwright/test';
const key = 'web-lab:v1';
async function openPractice(page: import('@playwright/test').Page, id: number) {
  await page.goto(`/#/lesson/${id}`);
  await page.locator('.stage-nav button').nth(2).click();
}
async function edit(
  page: import('@playwright/test').Page,
  html: string,
  css = '',
) {
  await page.getByRole('textbox', { name: 'HTML-редактор' }).fill(html);
  await page.getByRole('button', { name: 'CSS', exact: true }).click();
  await page.getByRole('textbox', { name: 'CSS-редактор' }).fill(css);
  await page
    .getByRole('button', { name: 'Перевірити завдання', exact: true })
    .click();
}
test('головна та шість модулів без помилок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Від першого',
  );
  await expect(page.locator('.module-card')).toHaveCount(6);
  for (let id = 1; id <= 6; id++) {
    await page.goto(`/#/lesson/${id}`);
    await expect(page.locator('.theory-block')).toHaveCount(id === 1 ? 4 : 3);
    await expect(page.locator('.stage-nav button')).toHaveCount(5);
  }
  expect(errors).toEqual([]);
});
test('URL-вправа та збереження поточного етапу', async ({ page }) => {
  await openPractice(page, 1);
  const labels = ['Протокол', 'Домен', 'Шлях', 'Параметри'];
  const parts = ['https:', 'web-lab.example', '/lessons', '?topic=html'];
  for (let i = 0; i < 4; i++)
    await page
      .getByLabel(`Тип частини ${parts[i]}`, { exact: true })
      .selectOption(labels[i]);
  const selects = page.locator('.url-parts').nth(1).locator('select');
  for (const [i, value] of [
    'https://',
    'web-lab.example',
    '/lessons',
    '?topic=html',
  ].entries())
    await selects.nth(i).selectOption(value);
  await page.getByLabel('Навіщо потрібен браузер?').selectOption('render');
  await page
    .getByRole('button', { name: 'Перевірити завдання', exact: true })
    .click();
  await expect(page.locator('.feedback.success')).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).profiles[0].lessons['1']
            ?.practice,
        key,
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Розбери URL' }),
  ).toBeVisible();
});
test('реальна перевірка HTML, preview і перезавантаження', async ({ page }) => {
  await openPractice(page, 2);
  await page
    .getByRole('button', { name: 'Перевірити завдання', exact: true })
    .click();
  await expect(page.locator('.check-results .success-text')).toHaveCount(0);
  await edit(
    page,
    '<!doctype html><html lang="uk"><head><meta charset="UTF-8"><title>Космічна майстерня</title></head><body><h1>Мій космос</h1><p>Я люблю зорі.</p></body></html>',
    'h1 {color: purple}',
  );
  await expect(page.locator('.check-results .success-text')).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Результат HTML та CSS"]')
      .getByRole('heading', { name: 'Мій космос' }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).profiles[0].codes.html?.html,
        key,
      ),
    )
    .toContain('Мій космос');
  await page.reload();
  await page.getByRole('button', { name: 'HTML', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'HTML-редактор' }),
  ).toHaveValue(/Мій космос/);
});
test('усі CSS та HTML вправи мають робочі перевірки', async ({ page }) => {
  const content =
    '<h1>Мої гори</h1><p>Мрію</p><p>Мандрую</p><ul><li>Карпати</li><li>Альпи</li></ul><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E" alt="Гори"><a href="https://example.org">Далі</a>';
  await openPractice(page, 3);
  await edit(page, content);
  await expect(page.locator('.check-results .success-text')).toBeVisible();
  await openPractice(page, 4);
  await edit(
    page,
    '<h1 class="title">Моя тема</h1><button>Привіт</button>',
    '.title{color:rebeccapurple}body{background:lightblue}button{padding:12px;border-radius:8px}',
  );
  await expect(page.locator('.check-results .success-text')).toBeVisible();
  await openPractice(page, 5);
  await page.getByRole('button', { name: 'CSS', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'CSS-редактор' })
    .fill('.cards{display:flex;gap:16px;flex-wrap:wrap}.card{flex:1 1 180px}');
  await page
    .getByRole('button', { name: 'Перевірити завдання', exact: true })
    .click();
  await expect(page.locator('.check-results .success-text')).toBeVisible();
  await openPractice(page, 6);
  await edit(
    page,
    `<header>Сайт</header><main><section class="cards"><article>${content}</article><article>Друга картка</article></section></main><footer>Моя робота</footer>`,
    'body{color:#333;background:#eee}.cards{display:flex;flex-wrap:wrap}',
  );
  await expect(page.locator('.check-results .success-text')).toBeVisible();
});
test('некоректний CSS не зараховується', async ({ page }) => {
  await openPractice(page, 4);
  await edit(
    page,
    '<h1>Текст</h1><button>Кнопка</button>',
    'h1{color:potato}body{background:potato}button{padding:potato;border-radius:potato}',
  );
  await expect(page.locator('.check-results .success-text')).toHaveCount(0);
});
test('preview блокує скрипти та доступ до основного застосунку', async ({
  page,
}) => {
  await page.goto('/#/playground');
  await page
    .getByRole('textbox', { name: 'HTML-редактор' })
    .fill(
      '<h1>Безпечний заголовок</h1><script>parent.document.body.innerHTML="BROKEN"</script><img src="x" onerror="parent.alert(1)">',
    );
  await page.getByRole('button', { name: 'Оновити', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Пісочниця коду' }),
  ).toBeVisible();
  const frame = page.locator('iframe[title="Результат HTML та CSS"]');
  await expect(frame).toHaveAttribute('sandbox', '');
  await expect(
    page
      .frameLocator('iframe[title="Результат HTML та CSS"]')
      .getByRole('heading', { name: 'Безпечний заголовок' }),
  ).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Результат HTML та CSS"]')
      .locator('script'),
  ).toHaveCount(0);
});
test('повний перший урок, результат тесту та досягнення', async ({ page }) => {
  await page.goto('/#/lesson/1');
  await page.getByRole('button', { name: 'Зрозуміло, спробуймо' }).click();
  await page.getByRole('button', { name: 'До практики', exact: true }).click();
  const labels = ['Протокол', 'Домен', 'Шлях', 'Параметри'];
  for (const [i, part] of [
    'https:',
    'web-lab.example',
    '/lessons',
    '?topic=html',
  ].entries())
    await page
      .getByLabel(`Тип частини ${part}`, { exact: true })
      .selectOption(labels[i]);
  const selects = page.locator('.url-parts').nth(1).locator('select');
  for (const [i, v] of [
    'https://',
    'web-lab.example',
    '/lessons',
    '?topic=html',
  ].entries())
    await selects.nth(i).selectOption(v);
  await page.getByLabel('Навіщо потрібен браузер?').selectOption('render');
  await page
    .getByRole('button', { name: 'Перевірити завдання', exact: true })
    .click();
  await page.getByRole('button', { name: 'До мінітесту' }).click();
  const correct = [[1], [0], [0, 1], [0], [1]];
  for (let i = 0; i < 5; i++) {
    for (const idx of correct[i])
      await page.locator('.quiz-options button').nth(idx).click();
    await page.getByRole('button', { name: 'Перевірити відповідь' }).click();
    await expect(page.locator('.explanation')).toBeVisible();
    await page
      .getByRole('button', {
        name: i === 4 ? 'Побачити результат' : 'Наступне питання',
        exact: true,
      })
      .click();
  }
  await expect(page.locator('.quiz-result')).toContainText('100%');
  await page.getByRole('button', { name: 'До підсумку' }).click();
  await page
    .getByRole('button', { name: 'Завершити модуль', exact: true })
    .click();
  await expect(page.locator('.feedback.success')).toContainText(
    'Модуль завершено',
  );
  await page.goto('/#/achievements');
  await expect(page.locator('.achievement-card.unlocked')).toContainText(
    'Перший крок',
  );
  await page.reload();
  await expect(page.locator('.achievement-card.unlocked')).toHaveCount(1);
});
test('власна ідея, редагування коду та HTML-завантаження', async ({ page }) => {
  await page.goto('/#/ideas');
  await page.getByRole('button', { name: 'Нова ідея', exact: true }).click();
  await page.getByLabel('Назва ідеї').fill('Мій клуб');
  await page.getByLabel('Для кого цей сайт?').fill('Для друзів');
  await page.getByLabel('Крок 1').fill('Зібрати ідеї');
  await page.getByRole('button', { name: 'Зберегти план' }).click();
  await page
    .getByRole('textbox', { name: 'HTML-редактор' })
    .fill('<h1>Мій клуб</h1>');
  await page.getByRole('button', { name: 'CSS', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'CSS-редактор' })
    .fill('h1 { color: blue; }');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Завантажити HTML' }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toMatch(/\.html$/);
  const path = await download.path();
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path!, 'utf8');
  expect(html).toContain('Мій клуб');
  expect(html).toContain('color: blue');
  await page.getByLabel('Позначити проєкт як завершений').check();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).profiles[0].projects[0].code
            .css,
        key,
      ),
    )
    .toContain('blue');
  await page.reload();
  await expect(page.locator('.project-card')).toContainText('Мій клуб');
  await expect(page.locator('.project-card')).toContainText('Завершено');
});
test('експорт, відхилення невірного імпорту, імпорт і профілі', async ({
  page,
}) => {
  await page.goto('/#/settings');
  await page.getByLabel('Новий псевдонім').fill('Тестова комета');
  await page
    .getByRole('button', { name: 'Створити профіль', exact: true })
    .click();
  await expect(page.getByLabel('Поточний профіль')).toHaveValue(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).activeId,
      key,
    ),
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Експорт прогресу · JSON' }).click();
  const download = await downloadPromise;
  const fs = await import('node:fs/promises');
  const content = await fs.readFile((await download.path())!, 'utf8');
  expect(JSON.parse(content).profiles).toHaveLength(2);
  await page.getByLabel('Імпорт прогресу з JSON').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":7}'),
  });
  await expect(page.locator('[role="status"]')).toContainText(
    'Структура файлу',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Імпорт прогресу з JSON').setInputFiles({
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  });
  await expect(page.locator('[role="status"]')).toContainText(
    'успішно імпортовано',
  );
});
test('відмова localStorage має зрозуміле попередження', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
  });
  await page.goto('/');
  await expect(page.locator('[role="alert"]')).toContainText(
    'Браузер заборонив збереження',
  );
});
test('мобільний інтерфейс і вкладки редактора', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Відкрити меню' }).click();
  await page.getByRole('link', { name: 'Пісочниця коду', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'HTML-редактор' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Результат', exact: true }).click();
  await expect(
    page.locator('iframe[title="Результат HTML та CSS"]'),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'HTML-редактор' }),
  ).toBeHidden();
  await expect(
    page
      .frameLocator('iframe[title="Результат HTML та CSS"]')
      .getByRole('heading', { name: 'Привіт, світе!' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});
test('головна не має горизонтального скролу на планшеті та десктопі', async ({
  page,
}) => {
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `width=${width}`,
    ).toBeLessThanOrEqual(width);
  }
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: false });
});
