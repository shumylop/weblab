<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArrowRight,
  ArrowUpRight,
  LayoutDashboard,
  Route,
  Code2,
  Lightbulb,
  Trophy,
  Settings2,
  ChevronDown,
  ChevronRight,
  Check,
  Clock3,
  Globe2,
  FileCode2,
  Image,
  Palette,
  PanelsTopLeft,
  Rocket,
  Zap,
  HardDrive,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  CircleHelp,
} from 'lucide-vue-next';
import { lessons } from './content';
import {
  profile,
  db,
  lessonPercent,
  achievements,
  saveState,
  storageWarning,
} from './features/storage';
import LessonView from './components/LessonView.vue';
import Playground from './components/Playground.vue';
import ProjectsView from './components/ProjectsView.vue';
import SettingsView from './components/SettingsView.vue';
import { documentHtml } from './content/helpers';
const hash = ref(location.hash || '#/');
const menu = ref(false);
const screenQuery = window.matchMedia('(max-width: 740px)');
const smallScreen = ref(screenQuery.matches);
const updateScreen = (event: MediaQueryListEvent) => {
  smallScreen.value = event.matches;
};
const escapeMenu = (event: KeyboardEvent) => {
  if (event.key === 'Escape') menu.value = false;
};
onMounted(() => {
  screenQuery.addEventListener('change', updateScreen);
  window.addEventListener('keydown', escapeMenu);
});
onBeforeUnmount(() => {
  screenQuery.removeEventListener('change', updateScreen);
  window.removeEventListener('keydown', escapeMenu);
});
function updateRoute() {
  hash.value = location.hash || '#/';
  menu.value = false;
  window.scrollTo(0, 0);
}
onMounted(() => window.addEventListener('hashchange', updateRoute));
onBeforeUnmount(() => window.removeEventListener('hashchange', updateRoute));
const route = computed(() => hash.value.replace(/^#\/?/, '').split('/'));
const page = computed(() => route.value[0] || 'home');
const lesson = computed(() =>
  lessons.find((l) => l.id === Number(route.value[1])),
);
const nav = [
  { id: 'home', href: '#/', title: 'Головна', icon: LayoutDashboard },
  {
    id: 'roadmap',
    href: '#/roadmap',
    title: 'Навчальний маршрут',
    icon: Route,
  },
  {
    id: 'playground',
    href: '#/playground',
    title: 'Пісочниця коду',
    icon: Code2,
  },
  { id: 'ideas', href: '#/ideas', title: 'Мої ідеї', icon: Lightbulb },
  {
    id: 'achievements',
    href: '#/achievements',
    title: 'Досягнення',
    icon: Trophy,
  },
];
const icons = [Globe2, FileCode2, Image, Palette, PanelsTopLeft, Rocket];
const done = computed(
  () => lessons.filter((l) => profile.value.lessons[l.id]?.completed).length,
);
const exercisesDone = computed(
  () => lessons.filter((l) => profile.value.lessons[l.id]?.practice).length,
);
const totalProgress = computed(() =>
  Math.round(
    lessons.reduce((sum, l) => sum + lessonPercent(l.id), 0) / lessons.length,
  ),
);
const current = computed(
  () => lessons.find((l) => l.id === profile.value.currentLesson) || lessons[0],
);
const sandboxCode = computed({
  get: () =>
    profile.value.codes.free ?? {
      html: documentHtml(
        '  <h1>Привіт, світе!</h1>\n  <p>Це твій простір для експериментів.</p>\n  <button>Почати створювати</button>',
        'Моя лабораторія',
      ),
      css: 'body {\n  font-family: system-ui;\n  padding: 40px;\n  background: #f4f0ff;\n  color: #30264e;\n}\nh1 { color: #6c4de6; }\nbutton { padding: 12px 24px; background: #6c4de6; color: white; border: 0; border-radius: 12px; }',
    },
  set: (v) => {
    profile.value.codes.free = v;
  },
});
watch(
  [page, lesson, () => db.activeId],
  () => {
    if (page.value === 'lesson' && lesson.value)
      profile.value.currentLesson = lesson.value.id;
    document.title = `${page.value === 'lesson' ? lesson.value?.title || 'Урок не знайдено' : nav.find((n) => n.id === page.value)?.title || 'Профілі та збереження'} — WEB LAB`;
  },
  { immediate: true },
);
function status(id: number) {
  return profile.value.lessons[id]?.completed
    ? 'Завершено'
    : profile.value.lessons[id] ||
        (id === profile.value.currentLesson &&
          profile.value.codes[lessons[id - 1].interactiveExercises[0].id])
      ? 'У процесі'
      : 'Не розпочато';
}
</script>
<template>
  <a
    href="#main"
    class="skip-link"
    @click.prevent="($refs.main as HTMLElement).focus()"
    >Перейти до вмісту</a
  >
  <div class="app-shell">
    <aside
      id="sidebar"
      class="sidebar"
      :class="{ open: menu }"
      :inert="(smallScreen && !menu) || undefined"
    >
      <a href="#/" class="brand"
        ><span class="brand-mark"
          ><Code2 :size="26" :stroke-width="2.2"
        /></span>
        <div>WEB<span>LAB</span><small>ТВОЯ ЛАБОРАТОРІЯ ІДЕЙ</small></div></a
      ><button
        class="close-menu icon-button"
        aria-label="Закрити меню"
        @click="menu = false"
      >
        <X :size="20" />
      </button>
      <div class="sidebar-section-title">НАВЧАЙСЯ ТА СТВОРЮЙ</div>
      <nav aria-label="Головне меню">
        <a
          v-for="item in nav"
          :key="item.id"
          :href="item.href"
          :class="{
            active:
              page === item.id || (item.id === 'roadmap' && page === 'lesson'),
          }"
          :aria-current="page === item.id ? 'page' : undefined"
          ><component :is="item.icon" :size="19" />{{ item.title
          }}<span
            v-if="item.id === 'ideas' && profile.projects.length"
            class="nav-count"
            >{{ profile.projects.length }}</span
          ></a
        >
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-note">
          <span class="small-spark">✳</span><strong>У твоєму темпі.</strong>
          <p>Тут можна пробувати,<br />помилятися й починати знову.</p>
          <span>Саме так і народжуються ідеї.</span>
        </div>
        <a
          href="#/settings"
          class="settings-link"
          :class="{ active: page === 'settings' }"
          ><Settings2 :size="18" />Профілі та збереження</a
        >
        <div class="local-note">
          <span class="live-dot"></span>Без реєстрації. Без поспіху.
        </div>
      </div>
    </aside>
    <button
      v-if="menu"
      class="menu-backdrop"
      aria-label="Закрити меню"
      @click="menu = false"
    ></button>
    <div class="main-shell" :inert="(smallScreen && menu) || undefined">
      <header class="topbar">
        <div class="row">
          <button
            class="menu-toggle icon-button"
            aria-label="Відкрити меню"
            :aria-expanded="menu"
            aria-controls="sidebar"
            @click="menu = true"
          >
            <Menu :size="22" /></button
          ><span class="breadcrumb"
            >Твій простір <ChevronRight :size="14" /><strong>{{
              page === 'lesson'
                ? 'Навчальний маршрут'
                : page === 'settings'
                  ? 'Збереження'
                  : nav.find((n) => n.id === page)?.title || 'Сторінка'
            }}</strong></span
          >
        </div>
        <div class="topbar-right">
          <span class="saved-indicator"
            ><CheckCircle2 :size="14" />{{ saveState }}</span
          ><label class="profile-picker"
            ><span class="avatar">{{
              profile.name.slice(0, 1).toUpperCase()
            }}</span
            ><select v-model="db.activeId" aria-label="Локальний профіль">
              <option v-for="p in db.profiles" :key="p.id" :value="p.id">
                {{ p.name }}
              </option></select
            ><ChevronDown :size="14"
          /></label>
        </div>
      </header>
      <main
        id="main"
        ref="main"
        tabindex="-1"
        :class="{ 'wide-main': page === 'lesson' || page === 'playground' }"
      >
        <div v-if="storageWarning" class="warning" role="alert">
          {{ storageWarning }} <a href="#/settings">Зберегти копію</a>
        </div>
        <template v-if="page === 'home' || page === 'roadmap'">
          <template v-if="page === 'home'"
            ><div class="greeting">
              <span
                >ПРИВІТ, {{ profile.name.toUpperCase() }}
                <span class="hello-star">✳</span></span
              ><span class="course-label"><i></i>ВЕБРОЗРОБКА З НУЛЯ</span>
            </div>
            <section class="hero">
              <div class="hero-copy">
                <div class="hero-eyebrow">
                  <span></span>ВЕЛИКІ ІДЕЇ ПОЧИНАЮТЬСЯ З МАЛОГО
                </div>
                <h1>
                  Від першого<br />рядка HTML<br />до
                  <span
                    >власного сайту<span class="underline-stroke"></span></span
                  ><span class="heading-dot">.</span>
                </h1>
                <p>
                  Вивчай, експериментуй, помиляйся, виправляй і створюй власні
                  проєкти. Початкових знань не потрібно.
                </p>
                <a
                  class="btn btn-primary hero-cta"
                  :href="`#/lesson/${current.id}`"
                  >{{ totalProgress ? 'Продовжити навчання' : 'Почати навчання'
                  }}<ArrowRight :size="18"
                /></a>
                <div class="hero-meta">
                  <span
                    ><Check :size="14" />{{ lessons.length }} практичних
                    модулів</span
                  ><span><Check :size="14" />У власному темпі</span>
                </div>
              </div>
              <div class="hero-art" aria-hidden="true">
                <div class="art-orbit orbit-one"></div>
                <div class="art-orbit orbit-two"></div>
                <span class="art-star star-one">✦</span
                ><span class="art-star star-two">✳</span
                ><span class="floating-tag html-tag">&lt;html&gt;</span>
                <div class="art-code-window">
                  <div class="window-top">
                    <div><i></i><i></i><i></i></div>
                    <span>твоя-перша-сторінка.html</span><Code2 :size="13" />
                  </div>
                  <div class="window-code">
                    <div>
                      <em>1</em
                      ><span class="syntax-muted">&lt;!DOCTYPE html&gt;</span>
                    </div>
                    <div>
                      <em>2</em
                      ><span class="syntax-pink"
                        >&lt;html <span class="syntax-yellow">lang=</span
                        ><span class="syntax-green">"uk"</span>&gt;</span
                      >
                    </div>
                    <div>
                      <em>3</em
                      ><span class="syntax-pink">&nbsp; &lt;body&gt;</span>
                    </div>
                    <div>
                      <em>4</em
                      ><span
                        >&nbsp; &nbsp;
                        <b class="syntax-pink">&lt;h1&gt;</b>Привіт, світе!<b
                          class="syntax-pink"
                          >&lt;/h1&gt;</b
                        ></span
                      >
                    </div>
                    <div>
                      <em>5</em
                      ><span
                        >&nbsp; &nbsp; <b class="syntax-pink">&lt;p&gt;</b>Це
                        тільки початок.<b class="syntax-pink"
                          >&lt;/p&gt;</b
                        ></span
                      >
                    </div>
                    <div>
                      <em>6</em
                      ><span class="syntax-pink">&nbsp; &lt;/body&gt;</span>
                    </div>
                    <div>
                      <em>7</em><span class="syntax-pink">&lt;/html&gt;</span
                      ><span class="code-cursor"></span>
                    </div>
                  </div>
                </div>
                <div class="art-result">
                  <div class="result-bar">
                    <span class="live-dot"></span>ТВІЙ РЕЗУЛЬТАТ
                    <ArrowUpRight :size="12" />
                  </div>
                  <div class="result-body">
                    <span class="result-spark">✳</span
                    ><strong>Привіт, світе!</strong>
                    <p>Це тільки початок.</p>
                    <div class="result-pills">
                      <span>твоя ідея</span><span>твій код</span
                      ><span>твій сайт ↗</span>
                    </div>
                  </div>
                </div>
                <span class="floating-tag css-tag">{ CSS }</span>
                <div class="art-success">
                  <CheckCircle2 :size="17" /><span>У тебе все вийде!</span>
                </div>
              </div>
            </section>
            <section class="stats-grid" aria-label="Твій прогрес">
              <div class="stat-card">
                <span class="stat-icon purple"><Route :size="20" /></span>
                <div>
                  <strong>{{ totalProgress }}<small>%</small></strong>
                  <p>Твій загальний прогрес</p>
                </div>
                <div
                  class="stat-ring"
                  :style="{
                    background: `conic-gradient(#7552e8 ${totalProgress}%, #ece8f7 0)`,
                  }"
                >
                  <i></i>
                </div>
              </div>
              <div class="stat-card">
                <span class="stat-icon teal"><CheckCircle2 :size="20" /></span>
                <div>
                  <strong
                    >{{ done }}<small> / {{ lessons.length }}</small></strong
                  >
                  <p>Модулів завершено</p>
                </div>
              </div>
              <div class="stat-card">
                <span class="stat-icon orange"><Zap :size="20" /></span>
                <div>
                  <strong
                    >{{ exercisesDone
                    }}<small> / {{ lessons.length }}</small></strong
                  >
                  <p>Практичних завдань</p>
                </div>
              </div>
            </section>
          </template>
          <template v-else
            ><div class="page-heading">
              <div class="eyebrow">ВІД ЦІКАВОСТІ ДО ВЛАСНОГО САЙТУ</div>
              <h1>Твій навчальний маршрут</h1>
              <p class="muted">
                Шість кроків. Жодних закритих дверей. Рухайся у власному темпі.
              </p>
            </div>
            <div class="roadmap-overview card">
              <div class="row space-between">
                <h3>Твій шлях уже почався</h3>
                <strong>{{ totalProgress }}%</strong>
              </div>
              <div class="progress-track">
                <i :style="{ width: `${totalProgress}%` }"></i>
              </div>
              <p class="muted small">
                Завершено {{ done }} із {{ lessons.length }} модулів · останній
                відкритий: {{ current.title }}
              </p>
              <a :href="`#/lesson/${current.id}`" class="text-button"
                >Продовжити навчання<ArrowRight :size="16"
              /></a></div
          ></template>
          <section class="roadmap-section">
            <div class="section-heading">
              <div>
                <div v-if="page === 'home'" class="eyebrow">КРОК ЗА КРОКОМ</div>
                <h2>
                  {{
                    page === 'home'
                      ? 'Твій навчальний маршрут'
                      : 'Обери свій наступний крок'
                  }}
                </h2>
                <p>Не просто читай — створюй щось на кожному кроці.</p>
              </div>
              <a v-if="page === 'home'" href="#/roadmap" class="text-button"
                >Увесь маршрут<ArrowUpRight :size="16" /></a
              ><span v-else class="module-count"
                >{{ lessons.length }} МОДУЛІВ · ~{{
                  Math.round(
                    lessons.reduce((sum, l) => sum + l.estimatedDuration, 0) /
                      60,
                  )
                }}
                ГОДИН</span
              >
            </div>
            <div class="module-grid">
              <a
                v-for="(l, i) in lessons"
                :key="l.id"
                :href="`#/lesson/${l.id}`"
                class="module-card"
                :class="{
                  current: current.id === l.id,
                  completed: profile.lessons[l.id]?.completed,
                }"
                ><div class="row space-between">
                  <span class="module-icon" :class="l.color"
                    ><component :is="icons[i] || FileCode2" :size="23" /></span
                  ><span class="module-number">МОДУЛЬ 0{{ l.id }}</span
                  ><span
                    v-if="profile.lessons[l.id]?.completed"
                    class="completed-mark"
                    ><Check :size="15" /></span
                  ><ArrowUpRight v-else class="card-arrow" :size="18" />
                </div>
                <span class="module-tag" :class="l.color">{{ l.tag }}</span>
                <h3>{{ l.title }}</h3>
                <p>{{ l.description }}</p>
                <div class="module-meta">
                  <span><Clock3 :size="13" />{{ l.estimatedDuration }} хв</span
                  ><span
                    class="status"
                    :class="{
                      finished: profile.lessons[l.id]?.completed,
                      inprogress: status(l.id) === 'У процесі',
                    }"
                    ><i></i>{{ status(l.id) }}</span
                  >
                </div>
                <div class="progress-track">
                  <i :style="{ width: `${lessonPercent(l.id)}%` }"></i>
                </div>
                <div class="module-card-bottom">
                  <span>{{ lessonPercent(l.id) }}% пройдено</span
                  ><strong
                    >{{
                      profile.lessons[l.id]?.completed
                        ? 'Повторити'
                        : status(l.id) === 'У процесі'
                          ? 'Продовжити'
                          : 'Почати модуль'
                    }}<ArrowRight :size="14"
                  /></strong></div
              ></a>
            </div>
          </section>
          <section class="idea-banner">
            <div class="idea-banner-icon"><Lightbulb :size="30" /></div>
            <div>
              <div class="eyebrow">НЕ ЧЕКАЙ ІДЕАЛЬНОГО МОМЕНТУ</div>
              <h2>А що, як спробувати свою ідею?</h2>
              <p>
                Сайт про гру, музику чи щось зовсім нове. Ця лабораторія — твоя.
              </p>
            </div>
            <a href="#/ideas" class="btn btn-secondary"
              >До моїх ідей<ArrowUpRight :size="17"
            /></a>
          </section>
        </template>
        <LessonView
          v-else-if="page === 'lesson' && lesson"
          :key="`${profile.id}-${lesson.id}`"
          :lesson="lesson"
        />
        <template v-else-if="page === 'playground'"
          ><div class="page-heading">
            <div class="eyebrow">ТЕРИТОРІЯ ЕКСПЕРИМЕНТІВ</div>
            <h1>Пісочниця коду</h1>
            <p class="muted">
              Спробуй змінити код і подивися, що станеться. Тут можна все почати
              знову.
            </p>
          </div>
          <Playground :key="profile.id" v-model="sandboxCode" />
          <div class="playground-tip">
            <Lightbulb :size="20" />
            <p>
              Зміни колір у CSS, додай заголовок у HTML або створи зовсім новий
              макет.
              <strong
                >Помилятися нормально. Так і навчаються програмувати.</strong
              >
            </p>
          </div></template
        >
        <ProjectsView v-else-if="page === 'ideas'" :key="profile.id" />
        <SettingsView v-else-if="page === 'settings'" />
        <template v-else-if="page === 'achievements'"
          ><div class="page-heading">
            <div class="eyebrow">МАЛЕНЬКІ ПЕРЕМОГИ МАЮТЬ ЗНАЧЕННЯ</div>
            <h1>Твої досягнення</h1>
            <p class="muted">
              Кожен бейдж — це те, що ти вже вмієш. Рухайся у своєму темпі.
            </p>
          </div>
          <div class="achievement-grid">
            <article
              v-for="(a, i) in achievements"
              :key="a.id"
              class="achievement-card card"
              :class="{ unlocked: profile.achievements.includes(a.id) }"
            >
              <div
                class="achievement-symbol"
                :class="['purple', 'orange', 'blue', 'teal'][i]"
              >
                <component
                  :is="[Sparkles, FileCode2, Palette, Trophy][i]"
                  :size="36"
                />
              </div>
              <span class="eyebrow">{{
                profile.achievements.includes(a.id) ? 'ОТРИМАНО' : 'ЩЕ ПОПЕРЕДУ'
              }}</span>
              <h2>{{ a.title }}</h2>
              <p>{{ a.text }}</p>
              <span class="badge-label"
                ><Check
                  v-if="profile.achievements.includes(a.id)"
                  :size="14"
                />{{
                  profile.achievements.includes(a.id)
                    ? 'Це твоя перемога!'
                    : 'Практикуйся — і він твій'
                }}</span
              >
            </article>
          </div></template
        >
        <div v-else class="empty-project card">
          <CircleHelp :size="40" />
          <h1>Сторінку не знайдено</h1>
          <p>Повертаймося до твоєї лабораторії.</p>
          <a href="#/" class="btn btn-primary">На головну</a>
        </div>
        <footer class="footer">
          <span
            ><Code2 :size="16" />WEB LAB<span
              >Зроблено для твоїх перших відкриттів.</span
            ></span
          ><span
            ><HardDrive :size="14" />Твій прогрес зберігається в цьому
            браузері</span
          >
        </footer>
      </main>
    </div>
  </div>
</template>
