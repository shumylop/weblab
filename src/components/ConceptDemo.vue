<script setup lang="ts">
import { computed, ref } from 'vue';
import { buildDocument } from '../features/preview';
const props = defineProps<{ lessonId: number }>();
const title = ref('Ідеї починаються тут');
const tag = ref('h1');
const color = ref('#6c4de6');
const padding = ref(24);
const direction = ref('row');
const justify = ref('space-between');
const align = ref('center');
const gap = ref(16);
const wrap = ref('wrap');
const list = ref('ul');
const theme = ref('light');
const preview = computed(() => {
  let html = '';
  let css =
    'body { font-family: system-ui; padding: 24px; color: #29243e; line-height: 1.6; }';
  if (props.lessonId === 2 || props.lessonId > 6)
    html = `<${tag.value}>${title.value.replace(/[<&]/g, '')}</${tag.value}><p>Один текст — різна роль у документі.</p>`;
  if (props.lessonId === 3)
    html = `<h1>Мої відкриття</h1><${list.value}><li>Малювати</li><li>Створювати сайти</li><li>Мандрувати</li></${list.value}><a href="#note">Дізнатися більше</a><p id="note">Посилання веде до цього абзацу з id="note".</p>`;
  if (props.lessonId === 4) {
    html =
      '<h1>Твій стиль</h1><p>Зміни колір і внутрішні відступи.</p><button>Створювати — цікаво</button>';
    css += `h1 {color: ${color.value}} button {background: ${color.value}; color: white; border: 0; border-radius: 12px; padding: ${padding.value}px;}`;
  }
  if (props.lessonId === 5) {
    html = '<div class="flex"><div>01</div><div>02</div><div>03</div></div>';
    css += `.flex { display: flex; min-height: 200px; flex-direction: ${direction.value}; justify-content: ${justify.value}; align-items: ${align.value}; gap: ${gap.value}px; flex-wrap: ${wrap.value}; } .flex > div { background: #ddd4ff; color: #5033a8; padding: 24px; border-radius: 14px; font-weight: bold; }`;
  }
  if (props.lessonId === 6) {
    html =
      '<header>ORBIT / КЛУБ ДОСЛІДНИКІВ</header><main><h1>Відкривай свій всесвіт.</h1><p>Місце для великих мрій та маленьких щоденних відкриттів.</p><section><article><h2>Спостерігай</h2><p>Помічай незвичайне навколо.</p></article><article><h2>Запитуй</h2><p>Кожне «чому?» — початок подорожі.</p></article></section><a href="#end">Почати подорож →</a></main><footer id="end">Створено з цікавістю.</footer>';
    css += `body { background: ${theme.value === 'light' ? '#f2efff' : '#252038'}; color: ${theme.value === 'light' ? '#30264e' : '#f3eeff'}; } header, footer { font-size: 12px; padding: 12px 0; } h1 { font-size: 38px; line-height: 1.1; max-width: 350px; } section { display: flex; flex-wrap: wrap; gap: 16px; } article { flex: 1 1 140px; padding: 16px; background: #8a71cf22; border-radius: 16px; } a { color: #9b7aea; display: inline-block; margin: 24px 0; }`;
  }
  return buildDocument({ html, css });
});
</script>
<template>
  <section class="card concept-demo">
    <div class="eyebrow">СПРОБУЙ І ПОДИВИСЯ · 5–10 ХВ</div>
    <h2>
      {{
        lessonId === 5
          ? 'Flexbox у твоїх руках'
          : lessonId === 6
            ? 'Один сайт. Два настрої.'
            : 'Маленька зміна — новий результат'
      }}
    </h2>
    <div class="demo-controls">
      <template v-if="lessonId === 2 || lessonId > 6"
        ><label class="field"
          >Текст<input v-model="title" maxlength="80" /></label
        ><label class="field"
          >Елемент<select v-model="tag">
            <option>h1</option>
            <option>h2</option>
            <option>p</option>
          </select></label
        ></template
      >
      <template v-if="lessonId === 3"
        ><label class="field"
          >Тип списку<select v-model="list">
            <option value="ul">ul — маркований</option>
            <option value="ol">ol — нумерований</option>
          </select></label
        ></template
      >
      <template v-if="lessonId === 4"
        ><label class="field">Колір<input v-model="color" type="color" /></label
        ><label class="field"
          >Padding: {{ padding }} px<input
            v-model="padding"
            type="range"
            min="0"
            max="48" /></label
      ></template>
      <template v-if="lessonId === 5"
        ><label class="field"
          >flex-direction<select v-model="direction">
            <option>row</option>
            <option>column</option>
          </select></label
        ><label class="field"
          >justify-content<select v-model="justify">
            <option>flex-start</option>
            <option>center</option>
            <option>space-between</option>
            <option>space-around</option>
          </select></label
        ><label class="field"
          >align-items<select v-model="align">
            <option>center</option>
            <option>stretch</option>
            <option>flex-start</option>
            <option>flex-end</option>
          </select></label
        ><label class="field"
          >gap: {{ gap }} px<input
            v-model="gap"
            type="range"
            min="0"
            max="48" /></label
        ><label class="field"
          >flex-wrap<select v-model="wrap">
            <option>wrap</option>
            <option>nowrap</option>
          </select></label
        ></template
      >
      <template v-if="lessonId === 6"
        ><label class="field"
          >Тема прикладу<select v-model="theme">
            <option value="light">Світла</option>
            <option value="dark">Темна</option>
          </select></label
        >
        <p class="muted">
          Це приклад результату. Твій сайт може бути зовсім іншим.
        </p></template
      >
    </div>
    <iframe
      title="Інтерактивна демонстрація"
      sandbox=""
      :srcdoc="preview"
    ></iframe>
    <p class="muted small">
      Змінюй налаштування та спостерігай. У практиці ти напишеш це власноруч.
    </p>
  </section>
</template>
