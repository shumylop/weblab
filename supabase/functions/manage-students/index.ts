import { validPassword } from './password-policy.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.100.0';
const cors = {
  'Access-Control-Allow-Origin': 'https://shumylop.github.io',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')
    return respond({ error: 'Метод не підтримується.' }, 405);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  try {
    const body = await req.json();
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token)
      return respond({ error: 'Увійди у свій обліковий запис.' }, 401);
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !user)
      return respond({ error: 'Сеанс завершено. Увійди знову.' }, 401);
    const { data: actor } = await admin
      .from('weblab_accounts')
      .select('role,enabled')
      .eq('id', user.id)
      .single();
    if (!actor?.enabled || actor.role !== 'teacher')
      return respond({ error: 'Потрібен доступ викладача.' }, 403);
    if (Number(req.headers.get('content-length') || 0) > 10000)
      return respond({ error: 'Запит завеликий.' }, 413);
    if (body.action === 'list') {
      const { data, error } = await admin
        .from('weblab_accounts')
        .select('id,username,nickname,enabled,created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return respond({ students: data });
    }
    if (body.action === 'create') {
      const username = String(body.username || '')
        .trim()
        .toLowerCase();
      const nickname = String(body.nickname || '').trim();
      const password = body.password;
      if (
        !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) ||
        !nickname ||
        nickname.length > 40 ||
        typeof password !== 'string' ||
        !validPassword(password, 'student')
      )
        return respond(
          { error: 'Перевір логін, псевдонім і пароль (6–128 символів).' },
          400,
        );
      const { data, error } = await admin.auth.admin.createUser({
        email: `${username}@login.weblab.invalid`,
        password,
        email_confirm: true,
        app_metadata: body.test === true ? { weblab_test: true } : {},
      });
      if (error || !data.user)
        return respond(
          { error: 'Не вдалося створити учня. Можливо, логін уже зайнятий.' },
          400,
        );
      const { error: insertError } = await admin
        .from('weblab_accounts')
        .insert({ id: data.user.id, username, nickname, role: 'student' });
      if (insertError) {
        await admin.auth.admin.deleteUser(data.user.id);
        return respond(
          {
            error:
              'Логін уже зайнятий або обліковий запис не вдалося зберегти.',
          },
          400,
        );
      }
      return respond({ ok: true });
    }
    if (body.action === 'cleanup-test') {
      const {
        data: { user: testUser },
      } = await admin.auth.admin.getUserById(String(body.id));
      if (
        !testUser?.app_metadata?.weblab_test ||
        !testUser.email?.startsWith('qa_')
      )
        return respond({ error: 'Це не тестовий обліковий запис.' }, 403);
      const { error } = await admin.auth.admin.deleteUser(testUser.id);
      if (error) throw error;
      return respond({ ok: true });
    }
    const { data: student } = await admin
      .from('weblab_accounts')
      .select('id')
      .eq('id', body.id)
      .eq('role', 'student')
      .single();
    if (!student) return respond({ error: 'Учня не знайдено.' }, 404);
    if (body.action === 'password') {
      if (
        typeof body.password !== 'string' ||
        !validPassword(body.password, 'student')
      )
        return respond(
          { error: 'Пароль учня має містити 6–128 символів.' },
          400,
        );
      const { error } = await admin.auth.admin.updateUserById(student.id, {
        password: body.password,
      });
      if (error) throw error;
      const { error: revokeError } = await admin
        .from('weblab_accounts')
        .update({ valid_after: Math.floor(Date.now() / 1000) + 1 })
        .eq('id', student.id);
      if (revokeError) throw revokeError;
      await new Promise((resolve) => setTimeout(resolve, 1100));
      return respond({ ok: true });
    }
    if (body.action === 'enabled' && typeof body.enabled === 'boolean') {
      const { error } = await admin
        .from('weblab_accounts')
        .update({ enabled: body.enabled })
        .eq('id', student.id);
      if (error) throw error;
      return respond({ ok: true });
    }
    return respond({ error: 'Невідома дія.' }, 400);
  } catch {
    return respond({ error: 'Не вдалося виконати дію. Спробуй пізніше.' }, 500);
  }
});
