// Creates synthetic accounts only, removes them in finally, and never prints credentials.
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import config from '../src/config/cloud.json' with { type: 'json' };
const rl = createInterface({ input: process.stdin });
const input = JSON.parse(await rl.question(''));
rl.close();
const make = () =>
  createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const teacher = make(),
  student = make(),
  other = make();
let id;
const invoke = async (body) => {
  const r = await teacher.functions.invoke('manage-students', { body });
  assert.ifError(r.error);
  assert.ok(!r.data.error);
  return r.data;
};
try {
  const login = await teacher.auth.signInWithPassword({
    email: 'teacher@login.weblab.invalid',
    password: input.password,
  });
  assert.ifError(login.error);
  const username = 'qa_' + randomUUID().slice(0, 8),
    password = randomUUID() + '!7',
    replacement = randomUUID() + '!8';
  await invoke({
    action: 'create',
    username,
    nickname: 'Тестова комета',
    password,
    test: true,
  });
  id = (await invoke({ action: 'list' })).students.find(
    (s) => s.username === username,
  ).id;
  assert.ifError(
    (
      await student.auth.signInWithPassword({
        email: username + '@login.weblab.invalid',
        password,
      })
    ).error,
  );
  assert.ifError(
    (
      await student
        .from('weblab_progress')
        .upsert(
          { user_id: id },
          { onConflict: 'user_id', ignoreDuplicates: true },
        )
    ).error,
  );
  const payload = {
    version: 1,
    activeId: id,
    profiles: [
      {
        id,
        name: 'Тестова комета',
        currentLesson: 1,
        lessons: {},
        codes: {},
        projects: [],
        achievements: [],
      },
    ],
  };
  const saved = await student
    .from('weblab_progress')
    .update({ payload, revision: 1 })
    .eq('user_id', id)
    .eq('revision', 0)
    .select('revision');
  assert.ifError(saved.error);
  assert.equal(saved.data.length, 1);
  assert.deepEqual(
    (
      await student
        .from('weblab_progress')
        .update({ payload, revision: 1 })
        .eq('user_id', id)
        .eq('revision', 0)
        .select('revision')
    ).data,
    [],
  );
  assert.ifError(
    (
      await other.auth.signInWithPassword({
        email: username + '@login.weblab.invalid',
        password,
      })
    ).error,
  );
  assert.deepEqual(
    (await other.from('weblab_progress').select('payload').single()).data
      .payload,
    payload,
  );
  assert.ok((await make().from('weblab_progress').select('*')).error);
  assert.deepEqual(
    (
      await student
        .from('weblab_accounts')
        .select('id')
        .eq('id', login.data.user.id)
    ).data,
    [],
  );
  assert.deepEqual(
    (
      await student
        .from('weblab_progress')
        .select('*')
        .eq('user_id', login.data.user.id)
    ).data,
    [],
  );
  assert.ok(
    (
      await student
        .from('weblab_accounts')
        .update({ role: 'teacher' })
        .eq('id', id)
    ).error,
  );
  assert.ok(
    (
      await student.functions.invoke('manage-students', {
        body: { action: 'list' },
      })
    ).error,
  );
  await invoke({ action: 'enabled', id, enabled: false });
  assert.deepEqual(
    (await student.from('weblab_progress').select('*')).data,
    [],
  );
  await invoke({ action: 'enabled', id, enabled: true });
  await invoke({ action: 'password', id, password: replacement });
  assert.deepEqual(
    (await student.from('weblab_progress').select('*')).data,
    [],
  );
  const refreshed = await student.auth.refreshSession();
  if (!refreshed.error)
    assert.deepEqual(
      (await student.from('weblab_progress').select('*')).data,
      [],
    );
  assert.ifError(
    (
      await other.auth.signInWithPassword({
        email: username + '@login.weblab.invalid',
        password: replacement,
      })
    ).error,
  );
  console.log(
    'PASS: teacher provisioning; cross-device save; revision conflict; anonymous/cross-user denial; role protection; admin restriction; disable; password reset.',
  );
} finally {
  if (id) {
    await invoke({ action: 'cleanup-test', id });
    console.log('Synthetic student and its progress removed.');
  }
  await teacher.auth.signOut();
  await student.auth.signOut();
  await other.auth.signOut();
}
