<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Plus,
  X,
} from 'lucide-vue-next';
import { documentHtml } from '../content/helpers';
import { buildDocument } from '../features/preview';

const emit = defineEmits<{ continue: [] }>();
const themes = [
  {
    name: 'Космос',
    heading: 'Вечір зоряного неба',
    description:
      'Зустрічаємось у п’ятницю, щоб знайти сузір’я та намалювати карту неба.',
    ink: '#38286f',
    background: '#ede6ff',
  },
  {
    name: 'Анімація',
    heading: 'Мультфільм за вечір',
    description:
      'Принось олівець і три ідеї. Знімемо маленьку історію кадр за кадром.',
    ink: '#7a341b',
    background: '#ffeadb',
  },
  {
    name: 'Настільні ігри',
    heading: 'Граймо разом!',
    description:
      'Збираємо команди, знайомимося з правилами й випробовуємо нові ігри.',
    ink: '#215749',
    background: '#dcf5ec',
  },
];
const blocks = [
  { tag: 'p', label: 'Опис' },
  { tag: 'h1', label: 'Заголовок' },
] as const;
type Block = (typeof blocks)[number]['tag'];
const selectedTheme = ref(0);
const theme = computed(() => themes[selectedTheme.value]);
const order = ref<Block[]>([]);
const feedback = ref('');
const passed = ref(false);
const label = (tag: Block) => blocks.find((block) => block.tag === tag)!.label;
const blockText = (tag: Block) =>
  tag === 'h1' ? theme.value.heading : theme.value.description;
const markup = computed(() =>
  order.value.map((tag) => `  <${tag}>${blockText(tag)}</${tag}>`).join('\n'),
);
const preview = computed(() =>
  buildDocument({
    html: documentHtml(markup.value, 'Афіша клубу'),
    css: `body { margin: 0; padding: clamp(16px, 6vw, 34px); background: ${theme.value.background}; color: ${theme.value.ink}; font: 16px/1.5 system-ui; } h1 { font-size: clamp(26px, 8vw, 39px); line-height: 1.15; margin: 0 0 14px; overflow-wrap: anywhere; } p { margin: 0 0 14px; }`,
  }),
);
function clearCheck() {
  feedback.value = '';
  passed.value = false;
}
function add(tag: Block) {
  if (!order.value.includes(tag)) order.value.push(tag);
  clearCheck();
}
function remove(index: number) {
  order.value.splice(index, 1);
  clearCheck();
}
function move(index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= order.value.length) return;
  [order.value[index], order.value[next]] = [
    order.value[next],
    order.value[index],
  ];
  clearCheck();
}
function check() {
  passed.value = order.value[0] === 'h1' && order.value[1] === 'p';
  if (passed.value)
    feedback.value =
      'Афіша готова! Заголовок називає подію, а абзац розповідає про неї.';
  else if (!order.value.includes('h1'))
    feedback.value =
      'Додай заголовок h1, щоб читач одразу побачив назву події.';
  else if (!order.value.includes('p'))
    feedback.value = 'Заголовок уже є. Додай абзац p із подробицями.';
  else
    feedback.value =
      'Обидва блоки на місці. Підніми заголовок над описом, щоб назва події була першою.';
}
</script>

<template>
  <section class="card club-poster" aria-labelledby="club-poster-title">
    <div class="eyebrow">МІСІЯ «АФІША КЛУБУ» · КРОК 1 З 2</div>
    <h2 id="club-poster-title" tabindex="-1">Збери афішу з блоків</h2>
    <p class="muted">
      Обери клуб, додай два блоки й постав назву події над описом. Подивись, як
      кожна зміна впливає на афішу.
    </p>
    <div class="club-poster-grid">
      <div class="club-poster-controls">
        <label class="field"
          >Тема клубу<select v-model.number="selectedTheme">
            <option
              v-for="(item, index) in themes"
              :key="item.name"
              :value="index"
            >
              {{ item.name }}
            </option>
          </select></label
        >
        <h3>Готові блоки</h3>
        <div class="club-poster-blocks">
          <button
            v-for="block in blocks"
            :key="block.tag"
            type="button"
            class="btn btn-secondary"
            :disabled="order.includes(block.tag)"
            @click="add(block.tag)"
          >
            <Plus :size="15" aria-hidden="true" />Додати
            {{ block.label.toLowerCase() }} <code>&lt;{{ block.tag }}&gt;</code>
          </button>
        </div>
        <h3>Порядок у &lt;body&gt;</h3>
        <p v-if="!order.length" class="muted small">
          Додай перший блок, щоб він з’явився на афіші.
        </p>
        <ol v-else class="club-poster-order" aria-label="Блоки афіші">
          <li v-for="(tag, index) in order" :key="tag">
            <span
              >{{ label(tag) }} <code>&lt;{{ tag }}&gt;</code></span
            >
            <div class="club-poster-tools">
              <button
                type="button"
                class="icon-button"
                :disabled="index === 0"
                :aria-label="`Перемістити ${label(tag).toLowerCase()} вгору`"
                @click="move(index, -1)"
              >
                <ArrowUp :size="16" />
              </button>
              <button
                type="button"
                class="icon-button"
                :disabled="index === order.length - 1"
                :aria-label="`Перемістити ${label(tag).toLowerCase()} вниз`"
                @click="move(index, 1)"
              >
                <ArrowDown :size="16" />
              </button>
              <button
                type="button"
                class="icon-button"
                :aria-label="`Прибрати ${label(tag).toLowerCase()}`"
                @click="remove(index)"
              >
                <X :size="16" />
              </button>
            </div>
          </li>
        </ol>
      </div>
      <div class="club-poster-result">
        <div class="club-poster-window">
          <span class="live-dot" /> Вкладка: Афіша клубу
        </div>
        <iframe
          v-if="order.length"
          title="Перегляд афіші клубу"
          sandbox=""
          :srcdoc="preview"
        />
        <div v-else class="club-poster-empty">
          <span aria-hidden="true">✦</span>Тут з’явиться твоя афіша
        </div>
        <p class="muted small">
          <code>&lt;title&gt;</code> називає вкладку, а
          <code>&lt;h1&gt;</code> — головний заголовок на самій сторінці.
        </p>
      </div>
    </div>
    <div class="club-poster-actions">
      <button type="button" class="btn btn-primary" @click="check">
        <Check :size="16" />Перевірити афішу
      </button>
      <button
        v-if="passed"
        type="button"
        class="btn btn-secondary"
        @click="emit('continue')"
      >
        Написати свій HTML<ArrowRight :size="16" />
      </button>
    </div>
    <p
      class="club-poster-feedback"
      :class="{ 'success-text': passed }"
      role="status"
    >
      {{ feedback }}
    </p>
    <details v-if="passed" class="club-poster-code">
      <summary>Подивитися HTML цієї афіші</summary>
      <pre><code>&lt;body&gt;{{ '\n' }}{{ markup }}{{ '\n' }}&lt;/body&gt;</code></pre>
    </details>
  </section>
</template>

<style scoped>
.club-poster h2 {
  margin: 8px 0;
}
.club-poster-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 22px 0;
}
.club-poster-controls,
.club-poster-result {
  min-width: 0;
}
.club-poster-controls h3 {
  font-size: 14px;
  margin: 16px 0 8px;
}
.club-poster-blocks,
.club-poster-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.club-poster-order {
  padding: 0;
  margin: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}
.club-poster-order li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f7f3ff;
  border-radius: 8px;
  font-size: 13px;
}
.club-poster-tools {
  display: flex;
}
.club-poster-tools button {
  min-height: 40px;
  min-width: 35px;
}
.club-poster-window {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3edf8;
  color: #5d4c70;
  padding: 10px 14px;
  border-radius: 9px 9px 0 0;
  font-size: 12px;
}
.club-poster-result iframe {
  display: block;
  border: 0;
  width: 100%;
  height: 248px;
  border-radius: 0 0 9px 9px;
}
.club-poster-result > p {
  margin-top: 8px;
}
.club-poster-empty {
  display: grid;
  place-content: center;
  text-align: center;
  min-height: 248px;
  background: #f7f3ff;
  color: #695784;
  border-radius: 0 0 9px 9px;
}
.club-poster-empty span {
  font-size: 36px;
}
.club-poster-feedback {
  margin-top: 10px;
}
.club-poster-code {
  margin-top: 12px;
}
.club-poster-code summary {
  cursor: pointer;
  font-weight: 600;
}
.club-poster-code pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f5f0ff;
  border-radius: 8px;
  padding: 12px;
}
@media (max-width: 760px) {
  .club-poster-grid {
    grid-template-columns: 1fr;
  }
}
</style>
