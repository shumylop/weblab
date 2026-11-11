import { expect, test } from '@playwright/test';
import config from '../../src/config/cloud.json' with { type: 'json' };

for (const role of ['teacher', 'student'] as const) {
  test(`${role}: список завершених уроків доступний лише викладачу`, async ({
    page,
  }) => {
    const id = '3aef9598-7ab6-44df-8b5c-d417349c08d6';
    const user = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-11-01T00:00:00Z',
    };
    const expires_at = Math.floor(Date.now() / 1000) + 3600;
    const token = [
      Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
      Buffer.from(JSON.stringify({ sub: id, exp: expires_at })).toString(
        'base64url',
      ),
      'fixture',
    ].join('.');
    await page.addInitScript(
      (session) => {
        sessionStorage.setItem('weblab-auth', JSON.stringify(session));
      },
      {
        access_token: token,
        refresh_token: 'fixture',
        token_type: 'bearer',
        expires_at,
        expires_in: 3600,
        user,
      },
    );
    let listRequests = 0;
    await page.route(`${config.url}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/rest/v1/weblab_accounts') {
        await route.fulfill({
          json: {
            id,
            role,
            enabled: true,
            username: role,
            nickname: 'Тестовий профіль',
          },
        });
      } else if (path === '/rest/v1/weblab_progress') {
        if (route.request().method() === 'POST')
          await route.fulfill({ status: 201, body: '' });
        else await route.fulfill({ json: { payload: null, revision: 0 } });
      } else if (path === '/functions/v1/manage-students') {
        expect(route.request().postDataJSON()).toEqual({ action: 'list' });
        listRequests++;
        await route.fulfill({
          json: {
            students: [
              {
                id: 'a',
                username: 'comet',
                nickname: 'Комета',
                enabled: true,
                completedLessonIds: listRequests === 1 ? [1, 2] : [1, 2, 3],
              },
              {
                id: 'b',
                username: 'orbit',
                nickname: 'Орбіта',
                enabled: true,
                completedLessonIds: [],
              },
            ],
          },
        });
      } else await route.abort();
    });
    await page.goto('/#/account');
    if (role === 'student') {
      await expect(
        page.getByRole('heading', { name: 'Мій обліковий запис', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Прогрес завантажено', { exact: false }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: /Мої учні/ })).toHaveCount(
        0,
      );
      expect(listRequests).toBe(0);
      return;
    }
    const comet = page.locator('.student-row').filter({ hasText: '@comet' });
    const orbit = page.locator('.student-row').filter({ hasText: '@orbit' });
    await expect(
      comet.getByRole('heading', { name: 'Пройдено 2 з 6 уроків' }),
    ).toBeVisible();
    await expect(
      comet.getByRole('list', { name: 'Пройдені уроки' }),
    ).toContainText('Як працює веб?');
    await expect(comet.getByRole('listitem')).toHaveCount(2);
    await expect(orbit).toContainText('Ще немає завершених уроків.');
    await page.getByRole('button', { name: 'Оновити', exact: true }).click();
    await expect(
      comet.getByRole('heading', { name: 'Пройдено 3 з 6 уроків' }),
    ).toBeVisible();
    await expect(comet.getByRole('listitem')).toHaveCount(3);
  });
}
