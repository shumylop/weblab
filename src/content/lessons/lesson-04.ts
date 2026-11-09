import type { Lesson } from '../../types';
import { q, el, css, documentHtml } from '../helpers';
export default {
  id: 4,
  title: 'CSS — магія зовнішнього вигляду',
  description: 'Перетвори звичайний HTML на сторінку зі своїм характером.',
  estimatedDuration: 50,
  tag: 'CSS',
  color: 'blue',
  objectives: [
    'Писати CSS-правила',
    'Керувати кольором, фоном і шрифтами',
    'Розрізняти внутрішні та зовнішні відступи',
  ],
  theoryBlocks: [
    {
      title: 'Селектор обирає, властивість змінює',
      text: 'CSS — мова стилів. Селектор h1 обирає всі h1, .card — елементи з class="card", #intro — елемент з id="intro". Усередині фігурних дужок записуємо властивість: значення; Клас можна повторювати на багатьох елементах.',
      code: 'h1 { color: #6c4de6; }\n.card { background: white; }',
    },
    {
      title: 'Колір, фон і текст',
      text: 'color задає колір тексту, background-color — фон. Кольори можна писати словами, HEX або rgb(). font-family обирає шрифт, font-size — розмір, line-height — висоту рядка. Якщо кілька правил однаково специфічні, пізніше правило переважає. Для початку змінюй одну властивість за раз.',
      code: 'body {\n  background-color: #f3efff;\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n}',
    },
    {
      title: 'Кожен елемент — коробка',
      text: 'Від центру назовні: content (вміст), padding (внутрішній відступ), border (рамка), margin (зовнішній відступ). border-radius заокруглює кути. З box-sizing: border-box задана ширина включає padding та border. Кнопку створюй тегом button, а вигляд налаштовуй CSS.',
      code: 'button {\n  padding: 12px 24px;\n  border: 0;\n  border-radius: 12px;\n  background: #6c4de6;\n  color: white;\n}',
    },
  ],
  interactiveExercises: [
    {
      id: 'style',
      instructions: [
        'Задай колір заголовка через color.',
        'Зміни фон body.',
        'Створи button або використай готовий.',
        'Додай кнопці ненульовий padding та border-radius.',
      ],
      starterHtml: documentHtml(
        '  <h1>Маленькі кроки. Великі ідеї.</h1>\n  <p>Моя перша дизайн-лабораторія.</p>\n  <button>Спробувати</button>',
        'Дизайн-лабораторія',
      ),
      starterCss:
        'body {\n  font-family: system-ui;\n  padding: 32px;\n}\n\nh1 {\n  /* Додай колір */\n}\n\nbutton {\n  /* Додай фон, відступи та заокруглення */\n}',
      validationRules: [
        el('h1', 'Збережи заголовок h1.', { text: true }),
        css('h1', 'color', 'Задай колір заголовка.'),
        css(
          'body',
          'background-color',
          'Задай фон сторінки через background або background-color.',
        ),
        el('button', 'Потрібна непорожня кнопка button.', { text: true }),
        css('button', 'padding', 'Додай кнопці ненульовий внутрішній відступ.'),
        css('button', 'border-radius', 'Заокругли кути кнопки.'),
      ],
      hints: [
        'Наприклад, h1 { color: rebeccapurple; }.',
        'Внутрішні відступи — padding. Заокруглення — border-radius.',
      ],
      successMessage: 'Ти керуєш виглядом сторінки. Це вже твій дизайн!',
    },
  ],
  quizQuestions: [
    q(
      'Який селектор обере class="card"?',
      ['#card', '.card', 'card()'],
      1,
      'Крапка обирає клас; # — ідентифікатор.',
    ),
    q(
      'Що змінює padding?',
      [
        'Відступ усередині рамки',
        'Відступ між елементами зовні',
        'Текст документа',
      ],
      0,
      'Padding знаходиться між вмістом і рамкою; margin — за рамкою.',
    ),
    q(
      'Який колір матиме h1 з h1 { color: blue; }?',
      ['Синій', 'Червоний', 'Прозорий'],
      0,
      'Селектор h1 застосує color: blue до заголовка, якщо немає правила з вищим пріоритетом.',
    ),
    q(
      'Обери властивості для тексту.',
      ['font-family', 'line-height', 'border-radius'],
      [0, 1],
      'Шрифт і міжрядковий інтервал стосуються тексту; border-radius — форми коробки.',
    ),
    q(
      'З border-box padding входить у задану width.',
      ['Правда', 'Неправда'],
      0,
      'border-box включає в ширину вміст, padding та border, але не margin.',
    ),
  ],
  optionalChallenge:
    'Створи темну або світлу тему. Переконайся, що текст і кнопка залишаються контрастними.',
  summary: [
    'Ти використовуєш селектори та класи.',
    'Змінюєш кольори, фони й шрифти.',
    'Розумієш основи box model.',
  ],
  references: [
    {
      title: 'MDN: Основи CSS',
      url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics',
    },
  ],
} satisfies Lesson;
