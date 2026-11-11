<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { ArrowRight } from 'lucide-vue-next';
import { documentHtml } from '../content/helpers';
import { buildDocument } from '../features/preview';

const emit = defineEmits<{ continue: [] }>();
const clues = [
  {
    title: 'Куди зникла назва?',
    context: 'Назва події має бути головним заголовком у тілі сторінки.',
    file: 'html',
    broken: '<!-- Тут має бути назва -->',
    choices: [
      '<title>Ніч у горах</title>',
      '<h1>Ніч у горах</h1>',
      '<p>Ніч у горах</p>',
    ],
    answer: 1,
    hint: 'Згадай, який тег позначає головний заголовок, видимий на сторінці.',
    explanation: 'Назву повернуто. Браузер відображає h1 як головний заголовок афіші.',
  },
  {
    title: 'Де зображення?',
    context: 'У папці є файл hobby.svg. Звір його назву з адресою в src.',
    file: 'html',
    broken: 'src="hoby.svg"',
    choices: ['src="hobby.png"', 'src="hoby.svg"', 'src="hobby.svg"'],
    answer: 2,
    hint: 'Перевір обидві літери b і розширення після крапки.',
    explanation: 'Зображення з’явилося. Тепер адреса в src збігається з назвою файлу.',
  },
  {
    title: 'Чому плашка втратила колір?',
    context: 'На плашці «Субота» в HTML записано class="poster-badge".',
    file: 'css',
    broken: '.poster-bagde',
    choices: ['.poster-badge', '#poster-badge', '.poster-bagde'],
    answer: 0,
    hint: 'Звір порядок літер та пригадай, з якого знака починається селектор класу.',
    explanation: 'Колір повернувся. Селектор .poster-badge тепер знаходить плашку з цим класом.',
  },
] as const;
const starter = {
  html: documentHtml(
    `<article>
  <!-- Тут має бути назва -->
  <img src="hoby.svg" alt="Гірські вершини під сонцем">
  <p>Вечір спостережень</p>
  <span class="poster-badge">Субота</span>
</article>`,
    'Афіша події',
  ),
  css: `* { box-sizing: border-box; }
body { margin: 0; padding: 12px; background: #f1eaff; color: #35254f; font: 14px/1.35 system-ui; }
article { margin: auto; max-width: 320px; }
h1 { font-size: clamp(19px, 6vw, 26px); margin: 0 0 8px; }
img { display: block; width: 100%; height: 76px; object-fit: cover; border: 1px solid #b7a8c7; border-radius: 8px; }
p { margin: 8px 0; }
article span { display: inline-block; padding: 4px 8px; border-radius: 6px; }
.poster-bagde { background-color: #fbe6af; color: #4e3419; }`,
};
const expected = { ...starter };
for (const clue of clues)
  expected[clue.file] = expected[clue.file].replace(
    clue.broken,
    clue.choices[clue.answer],
  );
const reference = buildDocument(expected);
const code = ref({ ...starter });
const preview = computed(() => buildDocument(code.value));
const repaired = ref(0);
const clue = computed(() => clues.at(repaired.value));
const feedback = ref('');
const correct = ref(false);
const clueHeading = ref<HTMLElement>();
const continueButton = ref<HTMLButtonElement>();

async function choose(choice: number) {
  const current = clue.value;
  if (!current) return;
  correct.value = choice === current.answer;
  if (!correct.value) {
    feedback.value = current.hint;
    return;
  }
  code.value[current.file] = code.value[current.file].replace(
    current.broken,
    current.choices[current.answer],
  );
  feedback.value = current.explanation;
  repaired.value++;
  await nextTick();
  (clueHeading.value ?? continueButton.value)?.focus();
}
</script>

<template>
  <section class="card detective" aria-labelledby="detective-title">
    <div class="eyebrow">МІСІЯ «БАГ-ДЕТЕКТИВ» · КРОК 1 З 2</div>
    <h2 id="detective-title" tabindex="-1">Полагодь афішу за зразком</h2>
    <p class="muted">
      Порівняй дві афіші. Обирай виправлення по одному й дивись, що змінилося.
    </p>

    <div class="detective-previews">
      <figure>
        <figcaption>Зразок</figcaption>
        <iframe title="Зразок афіші" sandbox="" tabindex="-1" :srcdoc="reference" />
      </figure>
      <figure>
        <figcaption>Твоя афіша</figcaption>
        <iframe title="Твоя афіша" sandbox="" tabindex="-1" :srcdoc="preview" />
      </figure>
    </div>

    <p class="detective-count">Виправлено {{ repaired }} з {{ clues.length }}</p>
    <div v-if="clue" :key="repaired" class="detective-clue">
      <h3 ref="clueHeading" tabindex="-1">{{ clue.title }}</h3>
      <p>{{ clue.context }}</p>
      <div class="detective-line">
        <strong>{{ clue.file.toUpperCase() }}</strong>
        <code>{{ clue.broken }}</code>
      </div>
      <div class="detective-choices" role="group" :aria-label="clue.title">
        <button
          v-for="(option, i) in clue.choices"
          :key="option"
          type="button"
          class="btn btn-secondary"
          @click="choose(i)"
        >
          <code>{{ option }}</code>
        </button>
      </div>
    </div>
    <p class="detective-feedback" :class="{ 'success-text': correct }" role="status">
      {{ feedback }}
    </p>
    <button
      v-if="!clue"
      ref="continueButton"
      class="btn btn-primary"
      type="button"
      @click="emit('continue')"
    >
      Полагодити іншу картку<ArrowRight :size="16" />
    </button>
  </section>
</template>

<style scoped>
.detective h2,
.detective h3 {
  margin: 8px 0;
}
.detective-previews {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(8px, 2vw, 16px);
  max-width: 670px;
  margin: 16px 0;
}
.detective-previews figure {
  margin: 0;
  overflow: hidden;
  border: 1px solid #e5d7f8;
  border-radius: 10px;
}
.detective-previews figcaption {
  padding: 8px 12px;
  background: #f9f5ff;
  font-weight: 600;
}
.detective-previews iframe {
  display: block;
  width: 100%;
  height: 198px;
  border: 0;
}
.detective-count {
  margin: 0;
  font-weight: 600;
}
.detective-clue > p {
  margin-bottom: 8px;
}
.detective-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  width: fit-content;
  margin-bottom: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  background: #f3edf8;
}
.detective-line strong {
  font-size: 12px;
}
.detective-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.detective-choices button {
  text-align: left;
}
.detective code {
  overflow-wrap: anywhere;
}
.detective-feedback:empty {
  margin: 0;
}
.detective-feedback:not(:empty) {
  margin: 10px 0;
}
</style>
