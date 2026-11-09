<script setup lang="ts">
import { ref } from 'vue';
import { account, importToAccount } from '../features/cloud';
import {
  Download,
  Upload,
  Plus,
  RotateCcw,
  HardDrive,
  ShieldCheck,
} from 'lucide-vue-next';
import {
  db,
  profile,
  createProfile,
  exportProgress,
  validateImport,
  replaceDatabase,
  persist,
  storageWarning,
} from '../features/storage';
const nickname = ref('');
const feedback = ref('');
const importing = ref(false);
function add() {
  const name = nickname.value.trim();
  if (!name) return;
  if (db.profiles.length >= 30) {
    feedback.value =
      'На цьому пристрої вже 30 профілів. Використай один із наявних.';
    return;
  }
  const p = createProfile(name);
  db.profiles.push(p);
  db.activeId = p.id;
  nickname.value = '';
  feedback.value = `Створено локальний профіль «${name}».`;
  persist();
}
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    if (file.size > 2_000_000)
      throw new Error('Файл завеликий. Максимальний розмір — 2 МБ.');
    const value: unknown = JSON.parse(await file.text());
    if (!validateImport(value))
      throw new Error(
        'Структура файлу не відповідає формату WEB LAB v1. Обери експортований файл прогресу.',
      );
    if (
      confirm(
        account.value
          ? 'Замінити свій онлайн-прогрес активним профілем із JSON? Інші профілі файлу не імпортуються. Збережи резервну копію поточних змін.'
          : 'Замінити всі локальні профілі даними з файлу? Спочатку експортуй поточні дані, якщо хочеш їх залишити.',
      )
    ) {
      if (account.value) importToAccount(value);
      else replaceDatabase(value);
      feedback.value = 'Прогрес і профілі успішно імпортовано.';
    }
  } catch (error) {
    feedback.value =
      error instanceof SyntaxError
        ? 'Не вдалося прочитати JSON. Перевір, що обрано файл експорту WEB LAB.'
        : (error as Error).message;
  } finally {
    input.value = '';
    importing.value = false;
  }
}
function reset() {
  if (
    confirm(
      `Почати заново для «${profile.value.name}»? Уроки, код, ідеї та досягнення цього профілю буде видалено. Інші профілі залишаться.`,
    )
  ) {
    const old = profile.value;
    const fresh = createProfile(old.name);
    fresh.id = old.id;
    db.profiles.splice(
      db.profiles.findIndex((p) => p.id === old.id),
      1,
      fresh,
    );
    persist();
    feedback.value = 'Профіль очищено. Можна починати з першого кроку.';
  }
}
</script>
<template>
  <div class="settings-view">
    <div class="page-heading">
      <div class="eyebrow">УСЕ ПІД ТВОЇМ КОНТРОЛЕМ</div>
      <h1>Профілі та збереження</h1>
      <p class="muted">Твій прогрес належить тобі. Реєстрація не потрібна.</p>
    </div>
    <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    <div v-if="storageWarning" class="warning">{{ storageWarning }}</div>
    <div class="settings-grid">
      <section v-if="!account" class="card">
        <HardDrive class="section-icon" :size="26" />
        <h2>Локальні профілі</h2>
        <p class="muted">
          Для спільного комп’ютера створи власний псевдонім. Не вказуй справжнє
          ім’я чи електронну пошту.
        </p>
        <label class="field"
          >Поточний профіль<select v-model="db.activeId">
            <option v-for="p in db.profiles" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select></label
        >
        <form @submit.prevent="add">
          <label class="field"
            >Новий псевдонім<input
              v-model="nickname"
              maxlength="40"
              placeholder="Наприклад, Космічний кіт"
              required /></label
          ><button class="btn btn-secondary" :disabled="!nickname.trim()">
            <Plus :size="16" />Створити профіль
          </button>
        </form>
      </section>
      <section class="card">
        <ShieldCheck class="section-icon" :size="26" />
        <h2>Резервна копія</h2>
        <p class="muted">
          {{
            account
              ? 'В обліковому записі прогрес зберігається онлайн.'
              : 'Дані зберігаються лише в поточному браузері.'
          }}
          {{
            account
              ? 'JSON допоможе зберегти окрему резервну копію.'
              : 'Вони не синхронізуються між пристроями та можуть зникнути після очищення даних сайту.'
          }}
        </p>
        <div class="backup-actions">
          <button class="btn btn-primary" @click="exportProgress">
            <Download :size="17" />Експорт прогресу · JSON</button
          ><label class="btn btn-secondary import-label"
            ><Upload :size="17" />{{
              importing ? 'Перевіряємо…' : 'Імпорт прогресу'
            }}<input
              type="file"
              accept="application/json,.json"
              :disabled="importing"
              aria-label="Імпорт прогресу з JSON"
              @change="importFile"
          /></label>
        </div>
        <p class="tiny-note">
          {{
            account
              ? 'Файл містить прогрес поточного облікового запису.'
              : 'Файл містить усі локальні профілі, їхні уроки, код та ідеї.'
          }}
          Імпорт перевіряє структуру й запитує підтвердження заміни.
        </p>
      </section>
      <section class="card reset-card">
        <h2>Новий початок</h2>
        <p class="muted">
          Очистити прогрес, вправи та проєкти поточного профілю. Перед цим
          радимо зберегти резервну копію.
        </p>
        <button class="btn btn-danger" @click="reset">
          <RotateCcw :size="16" />Почати навчання заново
        </button>
      </section>
    </div>
  </div>
</template>
