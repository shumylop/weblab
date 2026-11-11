import { describe, it, expect, beforeEach } from 'vitest';
import { isReactive } from 'vue';
import { lessons } from '../src/content';
import { validateCode, answersMatch } from '../src/features/validation';
import { buildDocument } from '../src/features/preview';
import {
  freshDatabase,
  validateImport,
  db,
  profile,
  progress,
  persist,
  completeLesson,
  lessonPercent,
  replaceDatabase,
} from '../src/features/storage';
import { documentHtml } from '../src/content/helpers';
const exercise = (id: number) => lessons[id - 1].interactiveExercises[0];
const check = (id: number, html: string, css = '') =>
  validateCode({ html, css }, exercise(id).validationRules);
const allPass = (id: number, html: string, css = '') =>
  check(id, html, css).every((r) => r.passed);
describe('Навчальний контент', () => {
  it('містить сім повних уроків із коректними запитаннями', () => {
    expect(lessons).toHaveLength(7);
    for (const l of lessons) {
      expect(l.theoryBlocks.length).toBeGreaterThanOrEqual(3);
      expect(l.interactiveExercises.length).toBeGreaterThan(0);
      expect(l.quizQuestions).toHaveLength(5);
      expect(l.optionalChallenge).toBeTruthy();
      expect(l.summary.length).toBeGreaterThan(0);
      for (const q of l.quizQuestions) {
        expect(q.explanation.length).toBeGreaterThan(20);
        expect(q.correct.every((i) => i >= 0 && i < q.options.length)).toBe(
          true,
        );
      }
    }
  });
  it('стартери кодових вправ не проходять автоматично', () => {
    for (const l of lessons.slice(1)) {
      const e = l.interactiveExercises[0];
      expect(allPass(l.id, e.starterHtml, e.starterCss)).toBe(false);
    }
  });
});
describe('DOM і CSS перевірки', () => {
  it('не приймає теги в коментарях або тексті', () => {
    expect(
      allPass(2, '<!-- <h1>Текст</h1><p>Текст</p> --><p>&lt;h1&gt;</p>'),
    ).toBe(false);
  });
  it('приймає іншу коректну HTML-структуру', () => {
    expect(
      allPass(
        2,
        documentHtml(
          '<main><h1>Космос</h1><section><p>Люблю зорі</p></section></main>',
          'Зоряний клуб',
        ),
      ),
    ).toBe(true);
  });
  it('не приймає порожні заголовки або стару назву', () => {
    expect(allPass(2, documentHtml('<h1> </h1><p>Текст</p>', 'Мій сайт'))).toBe(
      false,
    );
    expect(allPass(2, documentHtml('<h1>Мій сайт</h1><p>Текст</p>'))).toBe(
      false,
    );
  });
  it('приймає список, опис зображення і відносне посилання', () => {
    expect(
      allPass(
        3,
        '<h1>Гори</h1><p>Раз</p><p>Два</p><ol><li>Карпати</li><li>Альпи</li></ol><img src="hobby.svg" alt="Гори"><a href="about.html">Про гори</a>',
      ),
    ).toBe(true);
  });
  it('не приймає картинку без alt або javascript-посилання', () => {
    const code =
      '<h1>Гори</h1><p>Раз</p><p>Два</p><ul><li>А</li><li>Б</li></ul><img src="hobby.svg"><a href="javascript:alert(1)">Раз</a>';
    expect(allPass(3, code)).toBe(false);
  });
  it('не приймає CSS у коментарях або для відсутніх елементів', () => {
    expect(
      allPass(
        4,
        '<p>Текст</p>',
        '/* h1 {color:red} body{background:red} button{padding:5px;border-radius:5px} */',
      ),
    ).toBe(false);
  });
  it('приймає класи замість селекторів тегів та shorthand', () => {
    expect(
      allPass(
        4,
        '<h1 class="title">Привіт</h1><button class="cta">Старт</button>',
        '.title{color:blue}body{background:#eee}.cta{padding:10px 20px;border-radius:1rem}',
      ),
    ).toBe(true);
  });
  it('не приймає нульові відступи', () => {
    expect(
      allPass(
        4,
        '<h1>Текст</h1><button>Старт</button>',
        'h1{color:red}body{background:blue}button{padding:0;border-radius:0}',
      ),
    ).toBe(false);
  });
  it('враховує каскад і специфічність', () => {
    const r = validateCode(
      {
        html: '<div class="cards"></div>',
        css: '.cards {display:flex} div {display:block}',
      },
      [
        {
          selector: '.cards',
          property: 'display',
          expected: ['flex'],
          message: 'flex',
        },
      ],
    );
    expect(r[0].passed).toBe(true);
    expect(
      validateCode(
        {
          html: '<div class="cards"></div>',
          css: '.cards{display:flex}.cards{display:block}',
        },
        [
          {
            selector: '.cards',
            property: 'display',
            expected: ['flex'],
            message: 'flex',
          },
        ],
      )[0].passed,
    ).toBe(false);
  });
  it('приймає flex-wrap', () => {
    expect(
      allPass(
        5,
        exercise(5).starterHtml,
        '.cards{display:flex;gap:1rem;flex-wrap:wrap}',
      ),
    ).toBe(true);
  });
  it('приймає адаптивність через media query', () => {
    expect(
      allPass(
        5,
        exercise(5).starterHtml,
        '.cards{display:flex;gap:16px}@media(max-width:600px){.cards{flex-direction:column}}',
      ),
    ).toBe(true);
  });
  it('не приймає media query для іншого контейнера', () => {
    expect(
      allPass(
        5,
        exercise(5).starterHtml,
        '.cards{display:flex;gap:16px}@media(max-width:600px){.other{flex-direction:column}}',
      ),
    ).toBe(false);
  });
  it('перевіряє фінальний сайт цілком', () => {
    expect(
      allPass(
        6,
        exercise(6).starterHtml.replace(
          '<!-- Додай footer і власні стилі -->',
          '<footer>Зроблено мною</footer>',
        ),
        'body{color:#222;background:#fafafa}.cards{display:flex;flex-wrap:wrap}',
      ),
    ).toBe(true);
    expect(
      allPass(6, '<h1>Сайт</h1>', 'body{color:red;background:white}'),
    ).toBe(false);
  });
  it('не забруднює DOM застосунку стилями після перевірки', () => {
    const n = document.head.querySelectorAll('style').length;
    check(4, '', '*{display:none}');
    expect(document.head.querySelectorAll('style').length).toBe(n);
  });
});
describe('Тести знань', () => {
  it('перевіряє множинні відповіді незалежно від порядку', () => {
    expect(answersMatch([1, 0], [0, 1])).toBe(true);
    expect(answersMatch([0], [0, 1])).toBe(false);
    expect(answersMatch([0, 1, 2], [0, 1])).toBe(false);
  });
});
describe('Безпечний результат', () => {
  it('блокує виконуваний HTML і додає CSP', () => {
    const result = buildDocument({
      html: '<script>parent.alert(1)</script><h1 onclick="alert(1)">Тест</h1><iframe src="https://example.org"></iframe><meta http-equiv="refresh" content="0;url=https://example.org"><a href="javascript:alert(1)">X</a>',
      css: 'h1{color:red}',
    });
    const doc = new DOMParser().parseFromString(result, 'text/html');
    expect(doc.querySelector('script,iframe,[onclick]')).toBeNull();
    expect(doc.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(
      doc.querySelector('meta[http-equiv]')?.getAttribute('content'),
    ).toContain("script-src 'none'");
  });
  it('вбудовує стилі та локальну ілюстрацію в експорт', () => {
    const html = buildDocument(
      {
        html: '<h1>Привіт</h1><img src="/web-lab/hobby.svg" alt="Гори">',
        css: 'h1{color:red}',
      },
      false,
    );
    expect(html).toContain('data:image/svg+xml');
    expect(html).toContain('h1{color:red}');
    expect(html).not.toContain('Content-Security-Policy');
  });
  it('не дозволяє CSS закрити style і виконати script', () => {
    const html = buildDocument({
      html: '<p>Привіт</p>',
      css: '</style><script>alert(1)</script>',
    });
    expect(
      new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector('script'),
    ).toBeNull();
  });
});
describe('Прогрес і локальні профілі', () => {
  it('повертає реактивний прогрес уже при першому відкритті уроку', () => {
    replaceDatabase(freshDatabase());
    expect(isReactive(progress(1))).toBe(true);
  });
  beforeEach(() => {
    replaceDatabase(freshDatabase());
  });
  it('перевіряє формат експортованої бази', () => {
    expect(validateImport(freshDatabase())).toBe(true);
    expect(validateImport({ version: 2 })).toBe(false);
    expect(validateImport({ version: 1, activeId: 'x', profiles: [] })).toBe(
      false,
    );
  });
  it('відхиляє невірні типи, дублікати та небезпечні ключі', () => {
    const value = freshDatabase();
    (value.profiles[0] as any).codes = { bad: { html: 5, css: '' } };
    expect(validateImport(value)).toBe(false);
    const dup = freshDatabase();
    dup.profiles.push(dup.profiles[0]);
    expect(validateImport(dup)).toBe(false);
    const bad = freshDatabase();
    bad.profiles[0].codes = JSON.parse('{"__proto__":{"html":"","css":""}}');
    expect(validateImport(bad)).toBe(false);
  });
  it('відхиляє недійсні етапи та проєкти', () => {
    const value = freshDatabase();
    value.profiles[0].lessons['1'] = { ...progress(1), stage: 99 };
    expect(validateImport(value)).toBe(false);
    const bad = freshDatabase();
    (bad.profiles[0].projects as any[]).push({ title: 'x' });
    expect(validateImport(bad)).toBe(false);
  });
  it('зберігає код та поточний урок', () => {
    profile.value.codes.html = { html: '<h1>Моє</h1>', css: 'h1{color:red}' };
    profile.value.currentLesson = 3;
    persist();
    const restored = JSON.parse(localStorage.getItem('web-lab:v1')!);
    expect(validateImport(restored)).toBe(true);
    expect(restored.profiles[0].codes.html.html).toContain('Моє');
    expect(restored.profiles[0].currentLesson).toBe(3);
  });
  it('не завершує модуль без практики й тесту', () => {
    progress(1).theory = true;
    expect(completeLesson(1)).toBe(false);
    expect(lessonPercent(1)).toBe(25);
  });
  it('завершує модуль та видає досягнення один раз', () => {
    Object.assign(progress(1), {
      theory: true,
      demo: true,
      practice: true,
      quizPassed: true,
      quiz: 80,
    });
    expect(completeLesson(1)).toBe(true);
    completeLesson(1);
    expect(profile.value.achievements).toEqual(['first']);
    expect(lessonPercent(1)).toBe(100);
  });
  it('профілі не діляться кодом або вправами', () => {
    profile.value.codes.free = { html: 'A', css: '' };
    const other = freshDatabase().profiles[0];
    db.profiles.push(other);
    db.activeId = other.id;
    expect(profile.value.codes.free).toBeUndefined();
    expect(lessonPercent(1)).toBe(0);
  });
});
