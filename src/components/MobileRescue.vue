<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { ArrowRight, Check, Monitor, Smartphone } from 'lucide-vue-next';

const emit = defineEmits<{ continue: [] }>();
const cards = [
  { symbol: '☾', name: 'Місяць', color: '#e2dbff' },
  { symbol: '✦', name: 'Марс', color: '#ffe5d8' },
  { symbol: '◎', name: 'Сатурн', color: '#d8f4e9' },
];
const devices = [
  { id: 'phone', label: 'Телефон', icon: Smartphone },
  { id: 'desktop', label: 'Комп’ютер', icon: Monitor },
] as const;
type Device = (typeof devices)[number]['id'];
const device = ref<Device>('phone');
const prediction = ref('');
const predicted = ref(false);
const wrap = ref(false);
const checked = ref<Device[]>([]);
const feedback = ref('');
const applyButton = ref<HTMLButtonElement>();
const deviceButtons = ref<HTMLElement>();
const ready = computed(() => checked.value.length === devices.length);

async function checkPrediction() {
  predicted.value = prediction.value === 'wrap';
  if (predicted.value) {
    feedback.value =
      'Саме так. Увімкни перенесення й перевір, чи всі три картки видно.';
    await nextTick();
    applyButton.value?.focus();
  } else {
    feedback.value =
      'Придивись до краю екрана. Що може зробити картка, якщо в рядку для неї бракує місця?';
  }
}

function showDevice(next: Device) {
  device.value = next;
  if (wrap.value && !checked.value.includes(next)) checked.value.push(next);
}

async function enableWrap() {
  wrap.value = true;
  showDevice(device.value);
  feedback.value = '';
  await nextTick();
  deviceButtons.value
    ?.querySelector<HTMLButtonElement>('[aria-pressed="false"]')
    ?.focus();
}
</script>

<template>
  <section class="card mobile-rescue" aria-labelledby="mobile-rescue-title">
    <div class="eyebrow">МІСІЯ «ВРЯТУЙ САЙТ НА ТЕЛЕФОНІ» · КРОК 1 З 2</div>
    <h2 id="mobile-rescue-title" tabindex="-1">Знайди місце для всіх карток</h2>
    <p class="muted">
      У клубу дослідників є три картки, але на телефоні третя ховається за краєм.
      Уяви, що контейнер дозволив карткам переноситися. Як зміниться макет?
    </p>

    <div class="rescue-content">
      <div class="rescue-preview">
        <div ref="deviceButtons" class="rescue-devices" role="group" aria-label="Екран для перевірки">
          <button
            v-for="item in devices"
            :key="item.id"
            type="button"
            class="btn btn-small"
            :class="device === item.id ? 'btn-secondary' : 'btn-quiet'"
            :aria-pressed="device === item.id"
            @click="showDevice(item.id)"
          >
            <component :is="item.icon" :size="16" aria-hidden="true" />
            {{ item.label }}
            <Check v-if="checked.includes(item.id)" :size="14" aria-hidden="true" />
          </button>
        </div>
        <ul
          class="rescue-cards"
          :class="{ narrow: device === 'phone', wrapped: wrap }"
          aria-label="Макет сайту клубу"
        >
          <li v-for="card in cards" :key="card.name" :style="{ background: card.color }">
            <span aria-hidden="true">{{ card.symbol }}</span>
            <strong>{{ card.name }}</strong>
          </li>
        </ul>
        <p class="small muted" aria-live="polite">
          {{
            wrap
              ? ready
                ? 'Перевірено обидва екрани. На телефоні картки переносяться, на комп’ютері вміщаються в ряд.'
                : 'Картки вміщаються. Перемкни екран і перевір іншу ширину.'
              : device === 'phone'
                ? 'На телефоні частина макета виходить за край.'
                : 'На комп’ютері три картки вміщаються в ряд.'
          }}
        </p>
      </div>

      <div class="rescue-steps">
        <form v-if="!predicted" @submit.prevent="checkPrediction">
          <fieldset class="rescue-prediction">
            <legend>Що станеться на телефоні?</legend>
            <label>
              <input v-model="prediction" name="rescue-prediction" type="radio" value="hide" />
              Картки, які не вміщаються, зникнуть.
            </label>
            <label>
              <input v-model="prediction" name="rescue-prediction" type="radio" value="wrap" />
              Картка, якій бракує місця, перейде в наступний ряд.
            </label>
            <label>
              <input v-model="prediction" name="rescue-prediction" type="radio" value="same" />
              Усі картки залишаться в одному ряду.
            </label>
          </fieldset>
          <button class="btn btn-primary" type="submit" :disabled="!prediction">
            Перевірити прогноз
          </button>
        </form>
        <button
          v-else-if="!wrap"
          ref="applyButton"
          class="btn btn-primary"
          type="button"
          @click="enableWrap"
        >
          Увімкнути перенесення
        </button>
        <p class="rescue-feedback" :class="{ 'success-text': predicted }" role="status">
          {{ feedback }}
        </p>
        <p v-if="wrap" class="rescue-rule">
          <code>flex-wrap: wrap;</code> дозволяє карткам перейти в новий ряд,
          коли в поточному бракує місця.
        </p>
        <button
          v-if="ready"
          class="btn btn-primary"
          type="button"
          @click="emit('continue')"
        >
          Виправити макет у CSS<ArrowRight :size="16" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mobile-rescue h2 {
  margin: 8px 0;
}
.rescue-content {
  display: grid;
  gap: 16px 24px;
  align-items: start;
  margin-top: 18px;
}
@media (min-width: 1080px) {
  .rescue-content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
.rescue-preview {
  container-type: inline-size;
  max-width: 560px;
  padding: 12px;
  border-radius: 12px;
  background: #eef5f4;
}
.rescue-devices {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}
.rescue-cards {
  --card-width: min(25cqw, 146px);
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  margin: 0 0 8px;
  padding: 8px;
  overflow: hidden;
  list-style: none;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 1px #c7dcd8;
}
.rescue-cards.narrow {
  width: calc(2 * var(--card-width) + 24px);
}
.rescue-cards.wrapped {
  flex-wrap: wrap;
}
.rescue-cards li {
  flex: 0 0 var(--card-width);
  min-width: 0;
  padding: 8px 4px;
  border-radius: 6px;
  color: #312844;
  text-align: center;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.rescue-cards li span {
  display: block;
  font-size: 24px;
}
.rescue-preview p {
  margin: 0;
}
.rescue-prediction {
  border: 0;
  margin: 0 0 12px;
  padding: 0;
}
.rescue-prediction legend {
  margin-bottom: 6px;
  font-weight: 700;
}
.rescue-prediction label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}
.rescue-prediction input {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin: 3px 0 0;
  accent-color: var(--purple);
}
.rescue-feedback:empty {
  margin: 0;
}
.rescue-feedback:not(:empty),
.rescue-rule {
  margin: 10px 0;
}
</style>
