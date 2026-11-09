<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, Lightbulb } from 'lucide-vue-next';
const emit = defineEmits<{ passed: [] }>();
const parts = ref(['', '', '', '']);
const assemble = ref(['', '', '', '']);
const role = ref('');
const checked = ref(false);
const passed = ref(false);
const hint = ref(false);
const labels = ['Протокол', 'Домен', 'Шлях', 'Параметри'];
const dissection = ['https:', 'web-lab.example', '/lessons', '?topic=html'];
const choices = [
  ['http://', 'https://', 'ftp://'],
  ['school.example', 'web-lab.example', 'html'],
  ['/about', '/lessons', '/images'],
  ['?page=2', '?topic=html', '#html'],
];
const composed = computed(() => assemble.value.join(''));
function check() {
  checked.value = true;
  try {
    const url = new URL(composed.value);
    passed.value =
      parts.value.every((v, i) => v === labels[i]) &&
      url.protocol === 'https:' &&
      url.hostname === 'web-lab.example' &&
      url.pathname === '/lessons' &&
      url.search === '?topic=html' &&
      role.value === 'render';
  } catch {
    passed.value = false;
  }
  if (passed.value) emit('passed');
}
</script>
<template>
  <section class="card url-exercise">
    <div class="eyebrow">ПРАКТИКА · 10 ХВ</div>
    <h2>Розбери URL</h2>
    <p>
      Що означає кожна частина адреси
      <code>https://web-lab.example/lessons?topic=html</code>?
    </p>
    <div class="url-parts">
      <label v-for="(part, i) in dissection" :key="part"
        ><code>{{ part }}</code
        ><select v-model="parts[i]" :aria-label="`Тип частини ${part}`">
          <option value="">Обери тип</option>
          <option v-for="label in labels" :key="label">{{ label }}</option>
        </select></label
      >
    </div>
    <h3>А тепер склади адресу</h3>
    <p class="muted">
      Захищений протокол, домен web-lab.example, шлях /lessons та параметр
      topic=html.
    </p>
    <div class="url-parts">
      <label v-for="(label, i) in labels" :key="label"
        >{{ label
        }}<select v-model="assemble[i]">
          <option value="">Обери частину</option>
          <option v-for="choice in choices[i]" :key="choice">
            {{ choice }}
          </option>
        </select></label
      >
    </div>
    <div class="url-preview">
      <code>{{ composed || 'Тут з’явиться твоя адреса' }}</code>
    </div>
    <label class="field"
      >Навіщо потрібен браузер?<select v-model="role">
        <option value="">Обери пояснення</option>
        <option value="store">
          Зберігати всі сайти світу на моєму пристрої
        </option>
        <option value="dns">Лише перекладати домен в IP-адресу</option>
        <option value="render">
          Запитувати ресурси та відображати HTML/CSS як сторінку
        </option>
      </select></label
    >
    <div class="row">
      <button class="btn btn-primary" @click="check">
        <Check :size="16" />Перевірити завдання</button
      ><button class="btn btn-quiet" @click="hint = !hint">
        <Lightbulb :size="16" />Підказка
      </button>
    </div>
    <p v-if="hint" class="hint-box">
      HTTPS — захищений протокол. Домен іде перед шляхом, параметри починаються
      з ?. Браузер є клієнтом.
    </p>
    <p
      v-if="checked"
      class="feedback"
      :class="{ success: passed }"
      aria-live="polite"
    >
      {{
        passed
          ? 'Клас! Адресу складено правильно, і роль браузера зрозуміла.'
          : 'Майже! Звір типи частин адреси, обери https://, web-lab.example, /lessons, ?topic=html та пояснення про запити й відображення.'
      }}
    </p>
  </section>
</template>
