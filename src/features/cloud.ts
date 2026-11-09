import { createClient } from '@supabase/supabase-js';
import { computed, ref, watch } from 'vue';
import {
  accountMode,
  createProfile,
  db,
  persist,
  profile,
  restoreGuest,
  validateImport,
} from './storage';
import { loginEmail } from './identity';
import type { Database } from '../types';
import config from '../config/cloud.json';
const url = import.meta.env.VITE_SUPABASE_URL || config.url;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey;
export const cloudConfigured = !!(url && key);
export const client = cloudConfigured
  ? createClient(url, key, {
      auth: {
        storage: sessionStorage,
        storageKey: 'weblab-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
interface Account {
  id: string;
  username: string;
  nickname: string;
  role: 'student' | 'teacher';
  enabled: boolean;
}
export const account = ref<Account | null>(null);
export const cloudStatus = ref('');
export const cloudError = ref('');
export const cloudBusy = ref(false);
export const isTeacher = computed(() => account.value?.role === 'teacher');
let revision = 0;
let loading = false;
let dirty = false;
let saving = false;
let conflict = false;
let epoch = 0;
let timer: ReturnType<typeof setTimeout>;
const snapshot = () =>
  JSON.stringify({ version: 1, activeId: db.activeId, profiles: db.profiles });
watch(
  db,
  () => {
    if (!account.value || loading) return;
    dirty = true;
    cloudStatus.value = 'Є незбережені зміни';
    clearTimeout(timer);
    timer = setTimeout(() => void saveCloud(), 1000);
  },
  { deep: true },
);
export async function saveCloud() {
  if (!client || !account.value || loading || saving || conflict || !dirty)
    return;
  const id = account.value.id;
  const generation = epoch;
  const payload = JSON.parse(snapshot());
  const version = revision;
  saving = true;
  cloudStatus.value = 'Зберігаємо онлайн…';
  try {
    const { data, error } = await client
      .from('weblab_progress')
      .update({
        payload,
        revision: version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', id)
      .eq('revision', version)
      .select('revision');
    if (generation !== epoch) return;
    if (error) throw error;
    if (!data?.length) {
      conflict = true;
      throw new Error(
        'Прогрес змінено на іншому пристрої або доступ закрито. Експортуй поточні зміни й натисни «Завантажити онлайн-прогрес».',
      );
    }
    revision = data[0].revision;
    dirty = snapshot() !== JSON.stringify(payload);
    cloudError.value = '';
    cloudStatus.value = dirty ? 'Є нові зміни' : 'Збережено онлайн';
  } catch (error) {
    if (generation === epoch) {
      cloudError.value = conflict
        ? (error as Error).message
        : 'Немає зв’язку зі сховищем. Зміни ще не збережено онлайн: не закривай вкладку, спробуй знову або експортуй JSON.';
      cloudStatus.value = 'Потрібно зберегти зміни';
    }
  } finally {
    saving = false;
    if (generation === epoch && dirty && !conflict && !cloudError.value)
      timer = setTimeout(() => void saveCloud(), 1000);
  }
}
export async function loadCloud() {
  if (!client || !account.value) return;
  if (saving)
    throw new Error('Дочекайся завершення збереження та спробуй ще раз.');
  loading = true;
  clearTimeout(timer);
  cloudError.value = '';
  try {
    const { data, error } = await client
      .from('weblab_progress')
      .select('payload,revision')
      .eq('user_id', account.value.id)
      .single();
    if (error) throw error;
    let value: Database = data.payload;
    if (value === null) {
      const p = createProfile(account.value.nickname);
      p.id = account.value.id;
      value = { version: 1, activeId: p.id, profiles: [p] };
    }
    if (
      !validateImport(value) ||
      value.profiles.length !== 1 ||
      value.activeId !== account.value.id
    )
      throw new Error('invalid');
    db.profiles = value.profiles;
    db.activeId = value.activeId;
    revision = data.revision;
    dirty = false;
    conflict = false;
    cloudStatus.value = 'Прогрес завантажено';
    // Keep the guard through Vue's queued watchers.
    await Promise.resolve();
  } catch {
    cloudError.value =
      'Не вдалося завантажити прогрес або обліковий запис вимкнено. Спробуй пізніше чи звернися до викладача.';
    throw new Error(cloudError.value);
  } finally {
    loading = false;
  }
}
export async function signIn(username: string, password: string) {
  if (!client) throw new Error('Онлайн-вхід ще не налаштований.');
  if (account.value)
    throw new Error('Спочатку вийди з поточного облікового запису.');
  cloudBusy.value = true;
  cloudError.value = '';
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: loginEmail(username),
      password,
    });
    if (error || !data.user)
      throw new Error(
        'Неправильний логін або пароль. Перевір їх або звернися до викладача.',
      );
    await enterAccount(data.user.id);
  } finally {
    cloudBusy.value = false;
  }
}
async function enterAccount(id: string) {
  if (!client) return;
  const { data, error } = await client
    .from('weblab_accounts')
    .select('id,username,nickname,role,enabled')
    .eq('id', id)
    .single();
  if (error || !data?.enabled) {
    await client.auth.signOut();
    throw new Error('Обліковий запис недоступний. Звернися до викладача.');
  }
  persist();
  accountMode.value = true;
  account.value = data;
  epoch++;
  try {
    // Insert only once; never overwrite existing work on a new device.
    const { error: insertError } = await client
      .from('weblab_progress')
      .upsert(
        { user_id: id },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );
    if (insertError) throw insertError;
    await loadCloud();
  } catch (error) {
    account.value = null;
    restoreGuest();
    await client.auth.signOut();
    throw error;
  }
}
export async function signOut() {
  if (saving)
    throw new Error('Дочекайся завершення збереження та спробуй вийти ще раз.');
  if (dirty) {
    await saveCloud();
    if (
      dirty &&
      !confirm(
        'Не всі зміни збережено онлайн. Вийти й втратити незбережені зміни? Перед виходом можна скасувати дію та експортувати JSON.',
      )
    )
      return;
  }
  clearTimeout(timer);
  epoch++;
  loading = true;
  await client?.auth.signOut({ scope: 'local' });
  account.value = null;
  restoreGuest();
  dirty = false;
  conflict = false;
  cloudError.value = '';
  await Promise.resolve();
  loading = false;
}
export async function initCloud() {
  if (!client) return;
  cloudBusy.value = true;
  try {
    const { data } = await client.auth.getSession();
    if (data.session) await enterAccount(data.session.user.id);
  } catch (error) {
    cloudError.value = (error as Error).message;
  } finally {
    cloudBusy.value = false;
  }
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && account.value) {
      epoch++;
      account.value = null;
      clearTimeout(timer);
      restoreGuest();
      cloudError.value = 'Сеанс завершено. Увійди знову.';
    }
  });
}
export async function manageStudents(body: Record<string, unknown>) {
  if (!client) throw new Error('Сервіс не підключений.');
  const { data, error } = await client.functions.invoke('manage-students', {
    body,
  });
  if (error || data?.error)
    throw new Error(
      data?.error || 'Дію не виконано. Перевір з’єднання та доступ викладача.',
    );
  return data;
}
export async function changePassword(password: string) {
  const { error } = await client!.auth.updateUser({ password });
  if (error)
    throw new Error('Не вдалося змінити пароль. Увійди знову та повтори дію.');
}
window.addEventListener('online', () => void saveCloud());
window.addEventListener('beforeunload', (event) => {
  if (account.value && dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});
export function importToAccount(value: Database) {
  const imported = value.profiles.find((p) => p.id === value.activeId)!;
  db.profiles = [
    { ...imported, id: account.value!.id, name: account.value!.nickname },
  ];
  db.activeId = account.value!.id;
}
