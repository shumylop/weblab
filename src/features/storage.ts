import { computed, reactive, ref, watch } from 'vue';
import { lessons } from '../content';
const lessonIds = new Set(lessons.map((l) => l.id));
import type {
  Database,
  Profile,
  LessonProgress,
  Code,
  Project,
} from '../types';
const KEY = 'web-lab:v1';
export const accountMode = ref(false);
export const emptyProgress = (): LessonProgress => ({
  stage: 0,
  theory: false,
  demo: false,
  practice: false,
  quiz: 0,
  quizPassed: false,
  completed: false,
});
export const createProfile = (name = 'Дослідник'): Profile => ({
  id: crypto.randomUUID(),
  name,
  currentLesson: 1,
  lessons: {},
  codes: {},
  projects: [],
  achievements: [],
});
export const freshDatabase = (): Database => {
  const profile = createProfile();
  return { version: 1, activeId: profile.id, profiles: [profile] };
};
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = 200000): v is string =>
  typeof v === 'string' && v.length <= max;
const code = (v: unknown): v is Code => record(v) && str(v.html) && str(v.css);
export function validateImport(value: unknown): value is Database {
  if (
    !record(value) ||
    value.version !== 1 ||
    !str(value.activeId, 100) ||
    !Array.isArray(value.profiles) ||
    !value.profiles.length ||
    value.profiles.length > 30
  )
    return false;
  const ids = new Set<string>();
  for (const p of value.profiles) {
    if (
      !record(p) ||
      !str(p.id, 100) ||
      !p.id ||
      ids.has(p.id) ||
      !str(p.name, 40) ||
      !p.name.trim() ||
      !Number.isInteger(p.currentLesson) ||
      !lessonIds.has(Number(p.currentLesson)) ||
      !record(p.lessons) ||
      !record(p.codes) ||
      !Array.isArray(p.projects) ||
      p.projects.length > 100 ||
      !Array.isArray(p.achievements) ||
      !p.achievements.every((a) =>
        ['first', 'html', 'css', 'builder'].includes(a),
      )
    )
      return false;
    ids.add(p.id);
    for (const [id, l] of Object.entries(p.lessons)) {
      if (
        !lessonIds.has(Number(id)) ||
        !record(l) ||
        !Number.isInteger(l.stage) ||
        Number(l.stage) < 0 ||
        Number(l.stage) > 4 ||
        typeof l.quiz !== 'number' ||
        !Number.isFinite(l.quiz) ||
        l.quiz < 0 ||
        l.quiz > 100 ||
        !['theory', 'demo', 'practice', 'quizPassed', 'completed'].every(
          (k) => typeof l[k] === 'boolean',
        )
      )
        return false;
    }
    if (
      Object.keys(p.codes).length > 120 ||
      !Object.entries(p.codes).every(
        ([key, v]) =>
          str(key, 100) &&
          !['__proto__', 'constructor', 'prototype'].includes(key) &&
          code(v),
      )
    )
      return false;
    const projects = new Set();
    for (const x of p.projects) {
      if (
        !record(x) ||
        !str(x.id, 100) ||
        !x.id ||
        projects.has(x.id) ||
        !str(x.title, 100) ||
        !str(x.audience, 500) ||
        !str(x.type, 100) ||
        !Array.isArray(x.steps) ||
        x.steps.length !== 3 ||
        !x.steps.every((s) => str(s, 500)) ||
        !code(x.code) ||
        typeof x.completed !== 'boolean'
      )
        return false;
      projects.add(x.id);
    }
  }
  return ids.has(value.activeId);
}
export const storageWarning = ref('');
export const saveState = ref('Збережено на пристрої');
let initial: Database;
try {
  const raw = localStorage.getItem(KEY);
  initial = raw ? JSON.parse(raw) : freshDatabase();
  if (!validateImport(initial)) throw new Error('structure');
} catch {
  initial = freshDatabase();
  storageWarning.value =
    'Не вдалося прочитати локальні дані. Експортуй прогрес перед закриттям і перевір дозволи браузера.';
}
export const db = reactive<Database>(initial);
export const profile = computed(
  () => db.profiles.find((p) => p.id === db.activeId)!,
);
let timer: ReturnType<typeof setTimeout>;
export function persist() {
  clearTimeout(timer);
  try {
    if (accountMode.value) {
      saveState.value = 'Зміни в обліковому записі';
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(db));
    saveState.value = 'Збережено на пристрої';
  } catch {
    storageWarning.value =
      'Браузер заборонив збереження або сховище заповнене. Прогрес працює лише до закриття вкладки. Завантаж резервну копію JSON.';
    saveState.value = 'Потрібна резервна копія';
  }
}
watch(
  db,
  () => {
    saveState.value = 'Зберігаємо…';
    clearTimeout(timer);
    timer = setTimeout(persist, 450);
  },
  { deep: true },
);
window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist();
});
// Probe even before the first edit, so blocked storage is visible immediately.
persist();
export function progress(id: number) {
  if (!profile.value.lessons[id]) profile.value.lessons[id] = emptyProgress();
  return profile.value.lessons[id];
}
export function lessonPercent(id: number) {
  const p = profile.value.lessons[id];
  return p
    ? Math.round(
        ([p.theory, p.demo, p.practice, p.quizPassed].filter(Boolean).length /
          4) *
          100,
      )
    : 0;
}
export function refreshAchievements() {
  const p = profile.value;
  const awards = [
    p.lessons[1]?.completed && 'first',
    p.lessons[2]?.practice && p.lessons[3]?.practice && 'html',
    p.lessons[4]?.practice && 'css',
    p.lessons[6]?.completed && 'builder',
  ].filter(Boolean) as string[];
  p.achievements = [...new Set([...p.achievements, ...awards])];
}
export function completeLesson(id: number) {
  const p = progress(id);
  if (p.theory && p.demo && p.practice && p.quizPassed) {
    p.completed = true;
    refreshAchievements();
    return true;
  }
  return false;
}
export const achievements = [
  { id: 'first', title: 'Перший крок', text: 'Заверши перший модуль' },
  { id: 'html', title: 'HTML Explorer', text: 'Виконай обидві HTML-вправи' },
  { id: 'css', title: 'CSS Creator', text: 'Виконай CSS-вправу' },
  { id: 'builder', title: 'Web Builder', text: 'Заверши перший сайт' },
];
export function download(
  content: string,
  filename: string,
  type = 'application/json',
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportProgress() {
  persist();
  download(JSON.stringify(db, null, 2), 'web-lab-progress.json');
}
export function replaceDatabase(value: Database) {
  db.profiles = JSON.parse(JSON.stringify(value.profiles));
  db.activeId = value.activeId;
  persist();
}
export function addProject(project: Project) {
  profile.value.projects.unshift(project);
}

// Account data stays in memory on shared school computers; guest data is separate.
export function restoreGuest() {
  let guest: Database;
  try {
    guest = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!validateImport(guest)) guest = freshDatabase();
  } catch {
    guest = freshDatabase();
  }
  db.profiles = guest.profiles;
  db.activeId = guest.activeId;
  accountMode.value = false;
}
