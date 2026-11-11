<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  Play,
  RotateCcw,
  Check,
  Lightbulb,
  Monitor,
  Smartphone,
  Download,
  Code2,
  Eye,
} from 'lucide-vue-next';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import type { Code, Exercise } from '../types';
import { buildDocument } from '../features/preview';
import { validateCode } from '../features/validation';
import { download } from '../features/storage';
const props = defineProps<{
  modelValue: Code;
  exercise?: Exercise;
  filename?: string;
  initialTab?: 'html' | 'css';
}>();
const emit = defineEmits<{ 'update:modelValue': [code: Code]; passed: [] }>();
const tab = ref(props.initialTab ?? 'html');
const view = ref('code');
const mobile = ref(false);
const source = ref('');
const checked = ref(false);
const results = ref<{ message: string; passed: boolean }[]>([]);
const hints = ref(0);
const overlay = ref<HTMLElement>();
const highlighted = computed(() =>
  Prism.highlight(
    props.modelValue[tab.value],
    tab.value === 'html' ? Prism.languages.markup : Prism.languages.css,
    tab.value,
  ),
);
let timer: ReturnType<typeof setTimeout>;
function run() {
  source.value = buildDocument(props.modelValue);
}
watch(
  () => props.modelValue,
  () => {
    clearTimeout(timer);
    timer = setTimeout(run, 300);
    checked.value = false;
  },
  { deep: true, immediate: true },
);
onBeforeUnmount(() => clearTimeout(timer));
function input(value: string) {
  emit('update:modelValue', { ...props.modelValue, [tab.value]: value });
}
function check() {
  if (!props.exercise) return;
  run();
  results.value = validateCode(
    props.modelValue,
    props.exercise.validationRules,
  );
  checked.value = true;
  if (results.value.length && results.value.every((r) => r.passed))
    emit('passed');
}
function reset() {
  if (
    confirm('Скинути код до заготовки? Твої зміни в цій вправі буде втрачено.')
  ) {
    emit('update:modelValue', {
      html: props.exercise?.starterHtml || '<h1>Мій новий сайт</h1>',
      css:
        props.exercise?.starterCss ||
        'body { font-family: system-ui; padding: 32px; }',
    });
  }
}
function syncScroll(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  if (overlay.value) {
    overlay.value.scrollTop = target.scrollTop;
    overlay.value.scrollLeft = target.scrollLeft;
  }
}
function indent(event: KeyboardEvent) {
  if (
    event.key === 'Tab' &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    event.preventDefault();
    const el = event.target as HTMLTextAreaElement;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    input(el.value.slice(0, start) + '  ' + el.value.slice(end));
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  }
}
</script>
<template>
  <div class="playground">
    <div class="mobile-switch">
      <button :class="{ active: view === 'code' }" @click="view = 'code'">
        <Code2 :size="16" />Код</button
      ><button :class="{ active: view === 'result' }" @click="view = 'result'">
        <Eye :size="16" />Результат
      </button>
    </div>
    <div class="playground-grid">
      <section
        class="editor-pane"
        :class="{ 'mobile-hidden': view !== 'code' }"
        aria-label="Редактор коду"
      >
        <div class="editor-toolbar">
          <div class="code-tabs">
            <button :class="{ active: tab === 'html' }" @click="tab = 'html'">
              HTML</button
            ><button :class="{ active: tab === 'css' }" @click="tab = 'css'">
              CSS
            </button>
          </div>
          <span>Змінюй. Експериментуй.</span>
        </div>
        <div class="code-input">
          <pre
            ref="overlay"
            aria-hidden="true"
          ><code v-html="highlighted + '\n'"></code></pre>
          <textarea
            :aria-label="`${tab.toUpperCase()}-редактор`"
            :value="modelValue[tab]"
            maxlength="200000"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            @input="input(($event.target as HTMLTextAreaElement).value)"
            @scroll="syncScroll"
            @keydown="indent"
          ></textarea>
        </div>
        <div class="editor-footer">
          <button class="btn btn-small btn-primary" @click="run">
            <Play :size="14" />Оновити</button
          ><button
            class="icon-button"
            aria-label="Скинути код"
            title="Скинути до заготовки"
            @click="reset"
          >
            <RotateCcw :size="17" /></button
          ><span>HTML + CSS · без JavaScript</span>
        </div>
      </section>
      <section
        class="preview-pane"
        :class="{ 'mobile-hidden': view !== 'result' }"
        aria-label="Результат коду"
      >
        <div class="preview-toolbar">
          <span><i class="live-dot"></i>Живий результат</span>
          <div class="device-switch">
            <button
              :class="{ active: !mobile }"
              aria-label="Ширина комп’ютера"
              :aria-pressed="!mobile"
              @click="mobile = false"
            >
              <Monitor :size="16" /></button
            ><button
              :class="{ active: mobile }"
              aria-label="Ширина телефона"
              :aria-pressed="mobile"
              @click="mobile = true"
            >
              <Smartphone :size="16" />
            </button>
          </div>
        </div>
        <div class="preview-surface">
          <iframe
            title="Результат HTML та CSS"
            sandbox=""
            referrerpolicy="no-referrer"
            :srcdoc="source"
            :class="{ phone: mobile }"
          ></iframe>
        </div>
        <div class="preview-footer">
          <span>{{
            mobile ? 'Телефон · до 375 px' : 'Комп’ютер · на всю ширину'
          }}</span
          ><span>Ізольований перегляд</span>
        </div>
      </section>
    </div>
    <div class="playground-actions">
      <button v-if="exercise" class="btn btn-primary" @click="check">
        <Check :size="17" />Перевірити завдання</button
      ><button
        v-if="exercise"
        class="btn btn-quiet"
        @click="hints = Math.min(hints + 1, exercise.hints.length)"
      >
        <Lightbulb :size="17" />Підказка</button
      ><button
        class="btn btn-quiet download-button"
        @click="
          download(
            buildDocument(modelValue, false),
            filename || 'my-website.html',
            'text/html',
          )
        "
      >
        <Download :size="17" />Завантажити HTML
      </button>
    </div>
    <div v-if="exercise && hints" class="hint-box">
      <p v-for="hint in exercise.hints.slice(0, hints)" :key="hint">
        {{ hint }}
      </p>
    </div>
    <div v-if="checked" class="check-results" aria-live="polite">
      <p v-if="results.every((r) => r.passed)" class="success-text">
        {{ exercise?.successMessage }}
      </p>
      <p v-else>Майже! Перевір пункти нижче та спробуй ще раз.</p>
      <ul>
        <li
          v-for="(result, i) in results"
          :key="i"
          :class="{ passed: result.passed }"
        >
          <span>{{ result.passed ? '✓' : '○' }}</span
          >{{ result.message }}
        </li>
      </ul>
    </div>
  </div>
</template>
