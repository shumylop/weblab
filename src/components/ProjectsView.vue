<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Plus,
  ArrowLeft,
  ArrowUpRight,
  Lightbulb,
  Trash2,
  Check,
  Code2,
} from 'lucide-vue-next';
import { profile, addProject, persist } from '../features/storage';
import { documentHtml } from '../content/helpers';
import Playground from './Playground.vue';
const selected = ref('');
const saved = ref(false);
const project = computed(() =>
  profile.value.projects.find((p) => p.id === selected.value),
);
const suggestions = [
  'Сайт про улюблену гру',
  'Персональна сторінка',
  'Сайт музичного гурту',
  'Сторінка спортивної команди',
  'Сайт про домашнього улюбленця',
  'Незвичайне портфоліо',
];
function create(title = 'Моя нова ідея') {
  if (profile.value.projects.length >= 100) {
    alert(
      'У профілі вже 100 ідей. Відредагуй одну з наявних або експортуй прогрес і звільни місце.',
    );
    return;
  }
  const id = crypto.randomUUID();
  addProject({
    id,
    title,
    audience: '',
    type: 'Власна ідея',
    steps: ['', '', ''],
    code: {
      html: documentHtml(
        '  <header><h1>Мій новий сайт</h1></header>\n  <main><p>Кожен великий проєкт починається з маленької ідеї.</p></main>\n  <footer>Створено мною</footer>',
        title,
      ),
      css: 'body {\n  font-family: system-ui;\n  max-width: 900px;\n  margin: auto;\n  padding: 32px;\n  line-height: 1.6;\n  background: #f6f3ff;\n  color: #30264e;\n}\nh1 { font-size: 40px; }',
    },
    completed: false,
  });
  selected.value = id;
}
function remove() {
  if (
    project.value &&
    confirm(`Видалити проєкт «${project.value.title}» разом із кодом?`)
  ) {
    profile.value.projects = profile.value.projects.filter(
      (p) => p.id !== selected.value,
    );
    selected.value = '';
  }
}
function save() {
  persist();
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 2500);
}
</script>
<template>
  <div v-if="!project" class="projects-view">
    <div class="page-heading row space-between">
      <div>
        <div class="eyebrow">ПРОСТІР ДЛЯ ТВОЇХ ЗАДУМІВ</div>
        <h1>Маєш ідею?<br />Спробуй створити!</h1>
        <p class="muted">
          Тут немає неправильних ідей. Є ті, які ти ще не спробував.
        </p>
      </div>
      <button class="btn btn-primary" @click="create()">
        <Plus :size="18" />Нова ідея
      </button>
    </div>
    <div v-if="profile.projects.length" class="project-grid">
      <article
        v-for="p in profile.projects"
        :key="p.id"
        class="project-card card"
      >
        <div class="row space-between">
          <span class="module-icon teal"><Code2 :size="24" /></span
          ><span class="status" :class="{ finished: p.completed }">{{
            p.completed ? 'Завершено' : 'У роботі'
          }}</span>
        </div>
        <h2>{{ p.title || 'Ідея без назви' }}</h2>
        <p>{{ p.audience || 'Твій наступний маленький вебсвіт' }}</p>
        <button class="text-button" @click="selected = p.id">
          Відкрити проєкт<ArrowUpRight :size="17" />
        </button>
      </article>
    </div>
    <section v-else class="empty-project card">
      <div class="big-icon"><Lightbulb :size="36" /></div>
      <h2>Збережи ідею, поки вона не втекла</h2>
      <p>
        Запиши задум, сплануй три кроки та відкрий редактор.<br />Усе залишиться
        в цьому браузері.
      </p>
      <button class="btn btn-secondary" @click="create()">
        <Plus :size="16" />Створити перший проєкт
      </button>
    </section>
    <section class="inspiration">
      <div class="eyebrow">ТРІШКИ НАТХНЕННЯ</div>
      <h2>З чого почнемо?</h2>
      <div class="suggestions">
        <button v-for="(s, i) in suggestions" :key="s" @click="create(s)">
          <span>0{{ i + 1 }}</span
          >{{ s }}<ArrowUpRight :size="16" />
        </button>
      </div>
    </section>
  </div>
  <div v-else class="project-editor">
    <button class="back-link" @click="selected = ''">
      <ArrowLeft :size="16" />До моїх ідей
    </button>
    <div class="row space-between">
      <div>
        <div class="eyebrow">ТВІЙ ВЛАСНИЙ ПРОЄКТ</div>
        <h1>{{ project.title || 'Ідея без назви' }}</h1>
      </div>
      <button
        class="icon-button danger"
        aria-label="Видалити проєкт"
        @click="remove"
      >
        <Trash2 :size="19" />
      </button>
    </div>
    <section class="project-plan card">
      <div class="form-grid">
        <label class="field"
          >Назва ідеї<input
            v-model="project.title"
            maxlength="100"
            required
            @input="saved = false" /></label
        ><label class="field"
          >Для кого цей сайт?<input
            v-model="project.audience"
            maxlength="500"
            placeholder="Наприклад, для тих, хто любить космос" /></label
        ><label class="field"
          >Тип проєкту<select v-model="project.type">
            <option>Власна ідея</option>
            <option>Персональна сторінка</option>
            <option>Хобі</option>
            <option>Гра</option>
            <option>Музика</option>
            <option>Спорт</option>
            <option>Портфоліо</option>
          </select></label
        >
      </div>
      <h3>Три перші кроки</h3>
      <div class="form-grid">
        <label v-for="(_, i) in project.steps" :key="i" class="field"
          >Крок {{ i + 1
          }}<input
            v-model="project.steps[i]"
            maxlength="500"
            :placeholder="
              ['Придумати розділи', 'Написати HTML', 'Додати стиль'][i]
            "
        /></label>
      </div>
      <div class="row space-between">
        <button
          class="btn btn-secondary"
          :disabled="!project.title.trim()"
          @click="save"
        >
          <Check :size="16" />{{
            saved ? 'План збережено' : 'Зберегти план'
          }}</button
        ><label class="checkbox"
          ><input v-model="project.completed" type="checkbox" />Позначити проєкт
          як завершений</label
        >
      </div>
    </section>
    <h2 class="editor-heading">Від ідеї до коду</h2>
    <Playground
      :key="project.id"
      v-model="project.code"
      :filename="`web-lab-${project.id.slice(0, 8)}.html`"
    />
    <p class="muted small">
      План і код зберігаються автоматично. HTML-файл містить твої CSS-стилі;
      зовнішні картинки потребують інтернету.
    </p>
  </div>
</template>
