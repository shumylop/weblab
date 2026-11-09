<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Sparkles,
  Trophy,
  ExternalLink,
} from 'lucide-vue-next';
import type { Lesson } from '../types';
import { lessons } from '../content';
import {
  profile,
  progress,
  completeLesson,
  refreshAchievements,
} from '../features/storage';
import Playground from './Playground.vue';
import Quiz from './Quiz.vue';
import WebDemo from './WebDemo.vue';
import ConceptDemo from './ConceptDemo.vue';
import UrlExercise from './UrlExercise.vue';
const props = defineProps<{ lesson: Lesson }>();
const p = computed(() => progress(props.lesson.id));
const stage = computed({
  get: () => p.value.stage,
  set: (v) => {
    p.value.stage = v;
  },
});
const exercise = computed(() => props.lesson.interactiveExercises[0]);
const code = computed({
  get: () =>
    profile.value.codes[exercise.value.id] ?? {
      html: exercise.value.starterHtml,
      css: exercise.value.starterCss,
    },
  set: (v) => {
    profile.value.codes[exercise.value.id] = v;
  },
});
const steps = ['Знайомство', 'Експеримент', 'Практика', 'Мінітест', 'Підсумок'];
const completionMessage = ref('');
const nextLesson = computed(
  () => lessons[lessons.findIndex((l) => l.id === props.lesson.id) + 1],
);
function passed() {
  p.value.practice = true;
  refreshAchievements();
}
function finishQuiz(score: number) {
  p.value.quiz = Math.max(p.value.quiz, score);
  p.value.quizPassed ||= score >= 60;
}
function finish() {
  if (completeLesson(props.lesson.id))
    completionMessage.value =
      props.lesson.id === 6
        ? 'Ти створив свій перший сайт!'
        : 'Модуль завершено. Ще один крок до власного сайту!';
  else
    completionMessage.value =
      'Заверши знайомство, експеримент, практику й мінітест (від 60%), щоб отримати позначку модуля.';
}
</script>
<template>
  <div class="lesson-view">
    <a class="back-link" href="#/roadmap"
      ><ArrowLeft :size="16" />До навчального маршруту</a
    >
    <div class="lesson-heading">
      <div class="eyebrow">
        МОДУЛЬ 0{{ lesson.id }}
        <span
          ><Clock3 :size="14" />{{ lesson.estimatedDuration }} хв · у власному
          темпі</span
        >
      </div>
      <h1>{{ lesson.title }}</h1>
      <p>{{ lesson.description }}</p>
    </div>
    <nav class="stage-nav" aria-label="Етапи уроку">
      <button
        v-for="(step, i) in steps"
        :key="step"
        :class="{
          active: stage === i,
          done: [p.theory, p.demo, p.practice, p.quizPassed, p.completed][i],
        }"
        :aria-current="stage === i ? 'step' : undefined"
        @click="stage = i"
      >
        <span
          ><Check
            v-if="[p.theory, p.demo, p.practice, p.quizPassed, p.completed][i]"
            :size="14"
          /><template v-else>{{ i + 1 }}</template></span
        >{{ step }}<small>{{ ['10', '5–10', '10–15', '5', '5'][i] }} хв</small>
      </button>
    </nav>
    <div v-if="stage === 0" class="theory-layout">
      <aside class="objectives card">
        <div class="eyebrow">СЬОГОДНІ ТИ ЗМОЖЕШ</div>
        <p v-for="item in lesson.objectives" :key="item">
          <Check :size="17" />{{ item }}
        </p>
        <div class="tiny-note">
          Можеш зупинитися будь-коли. Код і поточний етап збережуться в цьому
          браузері.
        </div>
      </aside>
      <div>
        <article
          v-for="(block, i) in lesson.theoryBlocks"
          :key="block.title"
          class="theory-block"
        >
          <div class="eyebrow">0{{ i + 1 }} / РОЗБИРАЄМОСЯ</div>
          <h2>{{ block.title }}</h2>
          <p>{{ block.text }}</p>
          <pre v-if="block.code"><code>{{ block.code }}</code></pre>
        </article>
        <button
          class="btn btn-primary"
          @click="
            p.theory = true;
            stage = 1;
          "
        >
          Зрозуміло, спробуймо<ArrowRight :size="17" />
        </button>
      </div>
    </div>
    <div v-else-if="stage === 1">
      <WebDemo v-if="lesson.id === 1" /><ConceptDemo
        v-else
        :lesson-id="lesson.id"
      />
      <div class="stage-bottom">
        <p>Спробуй кілька варіантів. Що змінилося і чому?</p>
        <button
          class="btn btn-primary"
          @click="
            p.demo = true;
            stage = 2;
          "
        >
          До практики<ArrowRight :size="17" />
        </button>
      </div>
    </div>
    <div v-else-if="stage === 2">
      <UrlExercise v-if="lesson.id === 1" @passed="passed" /><template v-else
        ><section class="practice-brief">
          <div>
            <div class="eyebrow">ТВОЄ ЗАВДАННЯ · 10–15 ХВ</div>
            <h2>
              {{
                lesson.id === 6
                  ? 'Створи сайт на власну тему'
                  : 'Час написати свій код'
              }}
            </h2>
          </div>
          <ol>
            <li v-for="item in exercise.instructions" :key="item">
              {{ item }}
            </li>
          </ol>
        </section>
        <Playground
          :key="exercise.id"
          v-model="code"
          :exercise="exercise"
          @passed="passed"
      /></template>
      <div class="stage-bottom">
        <p :class="{ 'success-text': p.practice }">
          {{
            p.practice
              ? '✓ Практику зараховано. Можна рухатися далі!'
              : 'Завдання можна перевіряти скільки завгодно разів.'
          }}
        </p>
        <button class="btn btn-primary" @click="stage = 3">
          До мінітесту<ArrowRight :size="17" />
        </button>
      </div>
    </div>
    <div v-else-if="stage === 3">
      <Quiz
        :key="lesson.id"
        :questions="lesson.quizQuestions"
        :best="p.quiz"
        @finish="finishQuiz"
      />
      <div class="stage-bottom">
        <p>Твій найкращий результат: {{ p.quiz }}%</p>
        <button class="btn btn-primary" @click="stage = 4">
          До підсумку<ArrowRight :size="17" />
        </button>
      </div>
    </div>
    <div v-else class="summary-grid">
      <section class="card">
        <div class="summary-symbol"><Trophy :size="38" /></div>
        <div class="eyebrow">ТВОЇ НОВІ СУПЕРСИЛИ</div>
        <h2>Подивись, скільки ти вже вмієш</h2>
        <p v-for="item in lesson.summary" :key="item" class="summary-item">
          <Check :size="18" />{{ item }}
        </p>
        <div class="completion-checklist">
          <span :class="{ passed: p.theory }"
            >{{ p.theory ? '✓' : '○' }} Знайомство</span
          ><span :class="{ passed: p.demo }"
            >{{ p.demo ? '✓' : '○' }} Експеримент</span
          ><span :class="{ passed: p.practice }"
            >{{ p.practice ? '✓' : '○' }} Практика</span
          ><span :class="{ passed: p.quizPassed }"
            >{{ p.quizPassed ? '✓' : '○' }} Мінітест</span
          >
        </div>
        <button class="btn btn-primary" @click="finish">
          <Check :size="17" />{{
            p.completed ? 'Модуль завершено' : 'Завершити модуль'
          }}
        </button>
        <p
          v-if="completionMessage"
          class="feedback"
          :class="{ success: p.completed }"
          aria-live="polite"
        >
          {{ completionMessage }}
        </p>
        <a
          v-if="p.completed && nextLesson"
          class="btn btn-secondary next-module"
          :href="`#/lesson/${nextLesson.id}`"
          >Наступний модуль<ArrowRight :size="16" /></a
        ><a
          v-if="p.completed && !nextLesson"
          class="btn btn-secondary next-module"
          href="#/ideas"
          >До власних проєктів<ArrowRight :size="16"
        /></a>
      </section>
      <aside>
        <section class="challenge card">
          <Sparkles :size="24" />
          <div class="eyebrow">ЯКЩО ХОЧЕТЬСЯ БІЛЬШЕ</div>
          <h3>Додатковий челендж</h3>
          <p>{{ lesson.optionalChallenge }}</p>
          <button class="btn btn-secondary" @click="stage = 2">
            Повернутися до практики
          </button>
        </section>
        <section class="references">
          <h3>Досліджуй далі</h3>
          <a
            v-for="link in lesson.references"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noreferrer"
            >{{ link.title }}<ExternalLink :size="14"
          /></a>
        </section>
      </aside>
    </div>
  </div>
</template>
