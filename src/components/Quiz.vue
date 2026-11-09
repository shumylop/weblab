<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
} from 'lucide-vue-next';
import type { Question } from '../types';
import { answersMatch } from '../features/validation';
const props = defineProps<{ questions: Question[]; best: number }>();
const emit = defineEmits<{ finish: [score: number] }>();
const index = ref(0);
const selected = ref<number[]>([]);
const answered = ref(false);
const score = ref(0);
const done = ref(false);
const showHint = ref(false);
const question = computed(() => props.questions[index.value]);
const correct = computed(() =>
  answersMatch(selected.value, question.value.correct),
);
function toggle(i: number) {
  if (answered.value) return;
  if (question.value.correct.length > 1)
    selected.value = selected.value.includes(i)
      ? selected.value.filter((v) => v !== i)
      : [...selected.value, i];
  else selected.value = [i];
}
function answer() {
  if (!selected.value.length) return;
  answered.value = true;
  if (correct.value) score.value++;
}
function next() {
  if (index.value === props.questions.length - 1) {
    done.value = true;
    emit('finish', Math.round((score.value / props.questions.length) * 100));
  } else {
    index.value++;
    selected.value = [];
    answered.value = false;
    showHint.value = false;
  }
}
function retry() {
  index.value = 0;
  selected.value = [];
  answered.value = false;
  done.value = false;
  score.value = 0;
  showHint.value = false;
}
</script>
<template>
  <section class="quiz card">
    <template v-if="!done">
      <div class="eyebrow">
        ПИТАННЯ {{ index + 1 }} / {{ questions.length }}
        <span>Найкраще: {{ best }}%</span>
      </div>
      <div class="progress-track">
        <i :style="{ width: `${(index / questions.length) * 100}%` }"></i>
      </div>
      <h2>{{ question.text }}</h2>
      <p class="muted">
        {{
          question.correct.length > 1
            ? 'Обери всі правильні варіанти.'
            : 'Обери один варіант.'
        }}
      </p>
      <div class="quiz-options">
        <button
          v-for="(option, i) in question.options"
          :key="i"
          :disabled="answered"
          :aria-pressed="selected.includes(i)"
          :class="{
            selected: selected.includes(i),
            correct: answered && question.correct.includes(i),
            incorrect:
              answered && selected.includes(i) && !question.correct.includes(i),
          }"
          @click="toggle(i)"
        >
          <span class="option-letter">{{ String.fromCharCode(65 + i) }}</span
          >{{ option
          }}<CheckCircle2
            v-if="answered && question.correct.includes(i)"
            :size="18"
          />
        </button>
      </div>
      <div v-if="answered" class="explanation" aria-live="polite">
        <strong>{{
          correct ? 'Так, усе правильно!' : 'Помилятися нормально. Розберімося:'
        }}</strong>
        <p>{{ question.explanation }}</p>
      </div>
      <p v-if="showHint" class="hint-box">
        {{
          question.hint ||
          'Повернися до пояснення уроку. Подумай, яку роль виконує кожен елемент або властивість.'
        }}
      </p>
      <div class="row">
        <button
          v-if="!answered"
          class="btn btn-primary"
          :disabled="!selected.length"
          @click="answer"
        >
          Перевірити відповідь</button
        ><button v-else class="btn btn-primary" @click="next">
          {{
            index === questions.length - 1
              ? 'Побачити результат'
              : 'Наступне питання'
          }}<ArrowRight :size="16" /></button
        ><button
          v-if="!answered"
          class="btn btn-quiet"
          @click="showHint = !showHint"
        >
          <Lightbulb :size="16" />Підказка
        </button>
      </div>
    </template>
    <template v-else
      ><div class="quiz-result">
        <div class="big-icon">
          {{ score / questions.length >= 0.6 ? '✦' : '↻' }}
        </div>
        <h2>
          {{
            score / questions.length >= 0.6
              ? 'Гарна робота!'
              : 'Ще трохи практики — і вийде!'
          }}
        </h2>
        <p>
          Правильних відповідей: {{ score }} із {{ questions.length }} ·
          {{ Math.round((score / questions.length) * 100) }}%
        </p>
        <p class="muted">
          Для завершення етапу потрібно щонайменше 60%. Найкращий результат
          зберігається.
        </p>
        <button class="btn btn-secondary" @click="retry">
          <RotateCcw :size="16" />Пройти ще раз
        </button>
      </div></template
    >
  </section>
</template>
