<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { LogIn, LogOut, Plus, RefreshCw, ShieldCheck } from 'lucide-vue-next';
import {
  account,
  client,
  cloudConfigured,
  cloudBusy,
  signIn,
  signOut,
  isTeacher,
  manageStudents,
  changePassword,
  loadCloud,
  saveCloud,
} from '../features/cloud';
import { validPassword } from '../features/identity';
const confirm = window.confirm.bind(window);
const username = ref('');
const password = ref('');
const message = ref('');
const busy = ref(false);
const newPassword = ref('');
const studentLogin = ref('');
const nickname = ref('');
const studentPassword = ref('');
interface Student {
  id: string;
  username: string;
  nickname: string;
  enabled: boolean;
}
const students = ref<Student[]>([]);
const resetId = ref('');
const resetPassword = ref('');
async function action(fn: () => Promise<void>) {
  busy.value = true;
  message.value = '';
  try {
    await fn();
  } catch (error) {
    message.value = (error as Error).message;
  } finally {
    busy.value = false;
  }
}
async function list() {
  students.value = (await manageStudents({ action: 'list' })).students;
}
async function login() {
  await action(async () => {
    await signIn(username.value, password.value);
    password.value = '';
    message.value = 'Вітаємо! Твій прогрес завантажено.';
    if (isTeacher.value) await list();
  });
}
async function create() {
  await action(async () => {
    if (!validPassword(studentPassword.value))
      throw new Error('Пароль має містити 12–128 символів.');
    await manageStudents({
      action: 'create',
      username: studentLogin.value,
      nickname: nickname.value,
      password: studentPassword.value,
    });
    message.value = `Учня «${nickname.value}» створено. Передай йому логін і введений пароль особисто. Пароль повторно не відображатиметься.`;
    studentPassword.value = '';
    studentLogin.value = '';
    nickname.value = '';
    await list();
  });
}
function generate() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!-';
  studentPassword.value = Array.from(
    bytes,
    (b) => alphabet[b % alphabet.length],
  ).join('');
}
async function reset() {
  await action(async () => {
    if (!validPassword(resetPassword.value))
      throw new Error('Пароль має містити 12–128 символів.');
    await manageStudents({
      action: 'password',
      id: resetId.value,
      password: resetPassword.value,
    });
    resetPassword.value = '';
    resetId.value = '';
    message.value = 'Новий пароль установлено. Передай його учню особисто.';
  });
}
onMounted(() => {
  if (isTeacher.value) void action(list);
});
</script>
<template>
  <div class="page-heading">
    <div class="eyebrow">ТВІЙ ОСОБИСТИЙ WEB LAB</div>
    <h1>
      {{
        account
          ? isTeacher
            ? 'Кабінет викладача'
            : 'Мій обліковий запис'
          : 'Увійти до WEB LAB'
      }}
    </h1>
    <p class="muted">
      Логін і пароль видає викладач. Справжнє ім’я та електронна пошта учня не
      потрібні.
    </p>
  </div>
  <p v-if="message" class="feedback" role="status">{{ message }}</p>
  <div v-if="!account" class="card auth-card">
    <LogIn :size="28" />
    <h2>Твій прогрес — з тобою</h2>
    <p class="muted">
      Увійди, щоб продовжити навчання з іншого комп’ютера. На спільному пристрої
      виходь після заняття.
    </p>
    <form @submit.prevent="login">
      <label class="field"
        >Логін<input
          v-model="username"
          autocomplete="username"
          maxlength="32"
          required
          autocapitalize="off"
          spellcheck="false" /></label
      ><label class="field"
        >Пароль<input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          maxlength="128" /></label
      ><button
        class="btn btn-primary"
        :disabled="busy || cloudBusy || !cloudConfigured"
      >
        {{ busy || cloudBusy ? 'Входимо…' : 'Увійти' }}<LogIn :size="16" />
      </button>
    </form>
    <p v-if="!cloudConfigured" class="warning">
      Онлайн-вхід ще не налаштований.
    </p>
    <p class="tiny-note">
      Забув пароль? Викладач зможе видати новий. Гостьовий прогрес залишається
      окремо в цьому браузері; після входу його можна перенести через JSON.
    </p>
  </div>
  <template v-else
    ><section class="card account-summary">
      <div>
        <h2>
          {{ account.nickname }} <small>@{{ account.username }}</small>
        </h2>
        <p class="muted">
          {{ isTeacher ? 'Викладач' : 'Учень' }} · онлайн-збереження · сеанс
          лише в цій вкладці
        </p>
      </div>
      <button
        class="btn btn-secondary"
        :disabled="busy"
        @click="
          action(async () => {
            await signOut();
            students = [];
          })
        "
      >
        <LogOut :size="16" />Вийти
      </button>
    </section>
    <div class="settings-grid account-settings">
      <section class="card">
        <ShieldCheck :size="24" />
        <h2>Змінити свій пароль</h2>
        <form
          @submit.prevent="
            action(async () => {
              if (!validPassword(newPassword))
                throw new Error('Потрібно 12–128 символів.');
              await changePassword(newPassword);
              newPassword = '';
              message = 'Твій пароль змінено.';
            })
          "
        >
          <label class="field"
            >Новий пароль<input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              minlength="12"
              maxlength="128"
              required /></label
          ><button class="btn btn-secondary" :disabled="busy">
            Змінити пароль
          </button>
        </form>
      </section>
      <section class="card">
        <h2>Збереження прогресу</h2>
        <p class="muted">
          Зміни автоматично надсилаються в захищене сховище. Якщо працюєш на
          кількох пристроях, заверши збереження перед переходом на інший.
        </p>
        <div class="row">
          <button class="btn btn-secondary" @click="action(saveCloud)">
            Зберегти зараз</button
          ><button
            class="btn btn-quiet"
            @click="
              action(async () => {
                if (
                  confirm(
                    'Замінити поточний прогрес версією зі сховища? Спочатку експортуй незбережені зміни, якщо вони потрібні.',
                  )
                )
                  await loadCloud();
              })
            "
          >
            <RefreshCw :size="16" />Завантажити онлайн-прогрес
          </button>
        </div>
      </section>
    </div>
    <template v-if="isTeacher"
      ><section class="card teacher-create">
        <h2>Видати доступ учню</h2>
        <p class="muted">
          Використовуй псевдонім. Передай логін і пароль особисто — вони не
          надсилаються поштою.
        </p>
        <form @submit.prevent="create">
          <div class="form-grid">
            <label class="field"
              >Логін учня<input
                v-model="studentLogin"
                placeholder="Наприклад, comet01"
                pattern="[a-z0-9][a-z0-9._\-]{2,31}"
                minlength="3"
                maxlength="32"
                required
                autocomplete="off" /></label
            ><label class="field"
              >Псевдонім<input
                v-model="nickname"
                maxlength="40"
                required /></label
            ><label class="field"
              >Початковий пароль<input
                v-model="studentPassword"
                minlength="12"
                maxlength="128"
                required
                autocomplete="off"
            /></label>
          </div>
          <div class="row">
            <button class="btn btn-primary" :disabled="busy">
              <Plus :size="16" />Створити учня</button
            ><button type="button" class="btn btn-quiet" @click="generate">
              Згенерувати пароль
            </button>
          </div>
        </form>
      </section>
      <section class="card student-list">
        <div class="row space-between">
          <h2>Мої учні · {{ students.length }}</h2>
          <button class="btn btn-quiet" :disabled="busy" @click="action(list)">
            <RefreshCw :size="16" />Оновити
          </button>
        </div>
        <p v-if="!students.length" class="muted">
          Ще немає учнів. Створи перший доступ вище.
        </p>
        <article
          v-for="student in students"
          :key="student.id"
          class="student-row"
        >
          <div>
            <strong>{{ student.nickname }}</strong>
            <p>
              @{{ student.username }} ·
              {{ student.enabled ? 'Доступ відкрито' : 'Доступ вимкнено' }}
            </p>
          </div>
          <div class="row">
            <button
              class="btn btn-quiet"
              :disabled="busy"
              @click="resetId = student.id"
            >
              Новий пароль</button
            ><button
              class="btn btn-secondary"
              :disabled="busy"
              @click="
                action(async () => {
                  await manageStudents({
                    action: 'enabled',
                    id: student.id,
                    enabled: !student.enabled,
                  });
                  await list();
                })
              "
            >
              {{ student.enabled ? 'Вимкнути доступ' : 'Увімкнути доступ' }}
            </button>
          </div>
          <form
            v-if="resetId === student.id"
            class="password-reset"
            @submit.prevent="reset"
          >
            <label class="field"
              >Новий пароль для {{ student.nickname
              }}<input
                v-model="resetPassword"
                type="password"
                minlength="12"
                maxlength="128"
                required
                autocomplete="new-password" /></label
            ><button class="btn btn-primary" :disabled="busy">
              Установити пароль</button
            ><button
              type="button"
              class="btn btn-quiet"
              @click="
                resetId = '';
                resetPassword = '';
              "
            >
              Скасувати
            </button>
          </form>
        </article>
      </section></template
    ></template
  >
</template>
