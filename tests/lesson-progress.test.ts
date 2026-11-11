import { expect, it } from 'vitest';
import { completedLessonIds } from '../supabase/functions/manage-students/lesson-progress';

it('показує лише явно завершені уроки, у порядку курсу', () => {
  expect(
    completedLessonIds({
      '5': { completed: true },
      '1': { completed: true },
      '2': { completed: false, practice: true, quizPassed: true },
      '3': { completed: 'true' },
      '4': null,
      '01': { completed: true },
      '-1': { completed: true },
      '9007199254740992': { completed: true },
    }),
  ).toEqual([1, 5]);
});

it('обробляє відсутній або пошкоджений онлайн-прогрес', () => {
  for (const value of [null, undefined, [], 'відсутній']) {
    expect(completedLessonIds(value)).toEqual([]);
  }
});
