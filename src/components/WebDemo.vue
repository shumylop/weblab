<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import {
  Globe2,
  Search,
  Send,
  Server,
  FileCode2,
  Monitor,
  Play,
} from 'lucide-vue-next';
const active = ref(0);
const playing = ref(false);
let timer: ReturnType<typeof setInterval>;
const steps = [
  {
    icon: Globe2,
    title: 'Браузер',
    text: 'Ти вводиш URL у браузері. Він визначає, який ресурс потрібно отримати.',
  },
  {
    icon: Search,
    title: 'DNS',
    text: 'Браузер знаходить IP-адресу сервера за доменом. Відповідь може вже бути в кеші.',
  },
  {
    icon: Send,
    title: 'Запит',
    text: 'Після встановлення з’єднання браузер надсилає HTTP-запит. Для HTTPS з’єднання шифрується.',
  },
  {
    icon: Server,
    title: 'Сервер',
    text: 'Сервер отримує запит, знаходить або створює ресурс і готує відповідь.',
  },
  {
    icon: FileCode2,
    title: 'Відповідь',
    text: 'Браузер отримує статус і вміст: наприклад 200 OK та HTML. Для картинок і стилів можуть знадобитися нові запити.',
  },
  {
    icon: Monitor,
    title: 'Сторінка',
    text: 'Браузер розбирає HTML та CSS і відображає сторінку. Тепер ти можеш із нею взаємодіяти.',
  },
];
function play() {
  clearInterval(timer);
  active.value = 0;
  playing.value = true;
  timer = setInterval(() => {
    if (active.value === 5) {
      clearInterval(timer);
      playing.value = false;
    } else active.value++;
  }, 1600);
}
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <div class="web-demo card">
    <div class="row space-between">
      <div>
        <div class="eyebrow">ВІД АДРЕСИ ДО СТОРІНКИ</div>
        <h2>Подорож одного запиту</h2>
      </div>
      <button class="btn btn-secondary" @click="play">
        <Play :size="16" />{{ playing ? 'Ще раз' : 'Запустити' }}
      </button>
    </div>
    <div class="web-steps">
      <button
        v-for="(step, i) in steps"
        :key="step.title"
        :class="{ active: i === active, visited: i < active }"
        :aria-pressed="i === active"
        @click="active = i"
      >
        <span class="web-step-icon"
          ><component :is="step.icon" :size="24" /></span
        ><small>0{{ i + 1 }}</small
        ><strong>{{ step.title }}</strong>
      </button>
    </div>
    <div class="demo-explanation" aria-live="polite">
      <span>0{{ active + 1 }}</span>
      <div>
        <h3>{{ steps[active].title }}</h3>
        <p>{{ steps[active].text }}</p>
      </div>
    </div>
    <p class="muted small">
      Натисни на будь-який етап, щоб роздивитися його ближче.
    </p>
  </div>
</template>
