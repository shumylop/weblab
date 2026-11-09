// Live smoke test; test fixture cleanup is guaranteed and secrets stay in memory.
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import config from '../src/config/cloud.json' with { type: 'json' };
const rl = createInterface({ input: process.stdin });
const input = JSON.parse(await rl.question(''));
rl.close();
const api = createClient(config.url, config.publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
assert.ifError(
  (
    await api.auth.signInWithPassword({
      email: 'teacher@login.weblab.invalid',
      password: input.password,
    })
  ).error,
);
const invoke = async (body) => {
  const r = await api.functions.invoke('manage-students', { body });
  assert.ifError(r.error);
  return r.data;
};
const username = 'qa_' + randomUUID().slice(0, 8),
  password = randomUUID() + '!7';
let id;
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext();
  const teacher = await ctx.newPage();
  await teacher.route('**/functions/v1/manage-students', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const data = req.postDataJSON();
      if (data.action === 'create' && data.username === username) {
        await route.continue({
          postData: JSON.stringify({ ...data, test: true }),
        });
        return;
      }
    }
    await route.continue();
  });
  await teacher.goto('https://shumylop.github.io/weblab/#/account');
  await teacher.getByLabel('Логін', { exact: true }).fill('teacher');
  await teacher.getByLabel('Пароль', { exact: true }).fill(input.password);
  await teacher.getByRole('button', { name: 'Увійти', exact: true }).click();
  await teacher
    .getByRole('heading', { name: 'Кабінет викладача', exact: true })
    .waitFor();
  await teacher.getByLabel('Логін учня', { exact: true }).fill(username);
  await teacher
    .getByLabel('Псевдонім', { exact: true })
    .fill('Перевірка WEB LAB');
  await teacher.getByLabel('Початковий пароль (від 6 символів)', { exact: true }).fill(password);
  await teacher
    .getByRole('button', { name: 'Створити учня', exact: true })
    .click();
  try {
    await teacher
      .getByRole('status')
      .filter({ hasText: 'створено' })
      .waitFor({ timeout: 10000 });
  } catch (error) {
    console.log(
      'Form feedback:',
      await teacher.getByRole('status').allTextContents(),
    );
    console.log(
      'Validation:',
      await teacher.locator('input').evaluateAll((inputs) =>
        inputs.map((input) => ({
          label: input.closest('label')?.textContent?.trim(),
          valid: input.validity.valid,
          message: input.validationMessage,
        })),
      ),
    );
    throw error;
  }
  id = (await invoke({ action: 'list' })).students.find(
    (s) => s.username === username,
  ).id;
  const studentCtx = await browser.newContext();
  const page = await studentCtx.newPage();
  await page.goto('https://shumylop.github.io/weblab/#/account');
  await page.getByLabel('Логін', { exact: true }).fill(username);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Увійти', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Мій обліковий запис', exact: true })
    .waitFor();
  await page.goto('https://shumylop.github.io/weblab/#/playground');
  await page
    .getByRole('textbox', { name: 'HTML-редактор' })
    .fill('<h1>Прогрес із хмари</h1>');
  await page
    .getByRole('status')
    .filter({ hasText: 'Збережено онлайн' })
    .waitFor();
  const newDevice = await browser.newContext();
  const restored = await newDevice.newPage();
  await restored.goto('https://shumylop.github.io/weblab/#/account');
  await restored.getByLabel('Логін', { exact: true }).fill(username);
  await restored.getByLabel('Пароль', { exact: true }).fill(password);
  await restored.getByRole('button', { name: 'Увійти', exact: true }).click();
  await restored
    .getByRole('heading', { name: 'Мій обліковий запис', exact: true })
    .waitFor();
  await restored.goto('https://shumylop.github.io/weblab/#/playground');
  assert.equal(
    await restored.getByRole('textbox', { name: 'HTML-редактор' }).inputValue(),
    '<h1>Прогрес із хмари</h1>',
  );
  await teacher.screenshot({
    path: '/private/tmp/weblab-teacher-verified.png',
    fullPage: false,
  });
  console.log(
    'PASS: live teacher login, UI student provisioning, student login, autosave and new-device restore.',
  );
} finally {
  if (!id) {
    const data = await invoke({ action: 'list' });
    id = data.students.find((s) => s.username === username)?.id;
  }
  if (id) await invoke({ action: 'cleanup-test', id });
  await api.auth.signOut();
  await browser.close();
  console.log('Test fixture removed.');
}
