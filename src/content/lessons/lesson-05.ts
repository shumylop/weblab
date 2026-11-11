import type { Lesson } from '../../types';
import { q, el, css, documentHtml } from '../helpers';
export default {
  id: 5,
  title: 'Створюємо сучасний макет',
  description:
    'Випробуй перенесення карток і самостійно виправ макет для телефона.',
  estimatedDuration: 55,
  tag: 'МАКЕТ',
  color: 'teal',
  objectives: [
    'Керувати Flexbox-контейнером',
    'Розрізняти головну й поперечну осі',
    'Створювати адаптивні картки',
  ],
  theoryBlocks: [
    {
      title: 'Контейнер керує дітьми',
      text: 'Блокові елементи зазвичай займають доступну ширину. Контейнер об’єднує пов’язані блоки й обмежує ширину вмісту. display: flex у батька розкладає його безпосередніх дітей уздовж головної осі. За замовчуванням flex-direction: row — це ряд.',
      code: '.cards { display: flex; gap: 16px; }',
    },
    {
      title: 'Дві осі й проміжки',
      text: 'justify-content розподіляє вільне місце вздовж головної осі; align-items вирівнює вздовж поперечної. gap задає проміжки між дітьми. Якщо flex-direction: column, головна вісь стає вертикальною. Покрути перемикачі в демонстрації й перевір це.',
      code: '.cards {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n}',
    },
    {
      title: 'Один сайт для різних екранів',
      text: 'meta viewport дозволяє мобільному браузеру використовувати справжню ширину пристрою. flex-wrap: wrap переносить картки на новий ряд. flex: 1 1 180px дозволяє картці рости, стискатися й мати базову ширину 180px. Media query застосовує правила лише за певної ширини.',
      code: '.cards { display: flex; flex-wrap: wrap; gap: 16px; }\n.card { flex: 1 1 180px; min-width: 0; }\n@media (max-width: 600px) {\n  .cards { flex-direction: column; }\n}',
    },
  ],
  interactiveExercises: [
    {
      id: 'layout',
      instructions: [
        'У CSS зроби .cards Flexbox-контейнером і додай проміжок між картками.',
        'Перемкни перегляд на телефон і знайди картку, яка виходить за край.',
        'Дозволь карткам переноситися й перевір, чи видно довгий заголовок у режимах телефона та комп’ютера.',
      ],
      starterHtml: documentHtml(
        '  <h1>Моя колекція ідей</h1>\n  <section class="cards">\n    <article class="card"><h2>Досліджуй</h2><p>Знаходь нове.</p></article>\n    <article class="card"><h2>Створюй</h2><p>Дай ідеї форму.</p></article>\n    <article class="card"><h2>Поділися відкриттям із друзями</h2><p>Розкажи свою історію.</p></article>\n  </section>',
        'Мої картки',
      ),
      starterCss:
        '* { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui; padding: 16px; background: #f7f5ff; }\n.cards {\n  /* Напиши правила для контейнера */\n}\n.card { flex: 1 0 min(136px, 100%); padding: 16px; border-radius: 16px; background: #e7dfff; min-width: 0; overflow-wrap: anywhere; }',
      validationRules: [
        el('.cards > *', 'Додай щонайменше три картки в .cards.', { min: 3 }),
        css('.cards', 'display', 'Контейнеру потрібен display: flex.', {
          expected: ['flex', 'inline-flex'],
        }),
        css('.cards', 'gap', 'Додай ненульовий gap між картками.'),
        css(
          '.cards',
          'flex-wrap',
          'Додай flex-wrap: wrap або мобільне правило flex-direction: column.',
          { responsive: true },
        ),
        el('meta[name="viewport"]', 'Збережи meta viewport.', {
          attribute: 'content',
        }),
      ],
      hints: [
        'Шукай .cards у редакторі CSS. Саме контейнер вирішує, як розкласти картки.',
        'Запиши display: flex і gap: 12px у .cards. Дозволь перенесення за допомогою flex-wrap: wrap.',
      ],
      successMessage: 'Макет пройшов перевірку. Подивись, як картки виглядають на обох екранах.',
    },
  ],
  quizQuestions: [
    q(
      'Де задають display: flex?',
      ['У батьківському контейнері', 'В alt', 'У title'],
      0,
      'Flex-контейнер керує своїми безпосередніми дітьми.',
    ),
    q(
      'Що робить gap?',
      ['Задає проміжки між елементами', 'Змінює шрифт', 'Створює посилання'],
      0,
      'Gap залишає проміжки між дітьми без зовнішніх відступів по краях.',
    ),
    q(
      'Якщо напрямок row, justify-content працює вздовж…',
      [
        'Головної осі, зазвичай горизонтальної',
        'Лише вертикальної осі',
        'Глибини екрана',
      ],
      0,
      'У рядку головна вісь іде вздовж рядка.',
    ),
    q(
      'Що допомагає адаптивності? Обери все.',
      ['flex-wrap: wrap', 'meta viewport', 'Фіксована ширина 2000px для всіх'],
      [0, 1],
      'Перенесення і правильний viewport допомагають вмісту підлаштовуватися.',
    ),
    q(
      'Що зробить @media (max-width: 600px) { .cards { flex-direction: column; } }?',
      [
        'Розташує flex-картки стовпчиком на вузькому екрані',
        'Видалить картки',
        'Змінить всі екрани на 600px',
      ],
      0,
      'Правило діє лише при ширині viewport до 600px включно.',
    ),
  ],
  optionalChallenge:
    'Створи nav із логотипом та трьома посиланнями. На вузькому екрані дозволь їм переноситися.',
  summary: [
    'Ти створюєш Flexbox-макет.',
    'Керуєш осями та проміжками.',
    'Адаптуєш сторінку до вузького екрана.',
  ],
  references: [
    {
      title: 'MDN: Flexbox',
      url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox',
    },
  ],
} satisfies Lesson;
