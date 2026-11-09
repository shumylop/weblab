import type { Question, ValidationRule } from '../types';
export const q = (
  text: string,
  options: string[],
  correct: number | number[],
  explanation: string,
): Question => ({
  text,
  options,
  correct: typeof correct === 'number' ? [correct] : correct,
  explanation,
});
export const el = (
  selector: string,
  message: string,
  extra: Partial<ValidationRule> = {},
): ValidationRule => ({ selector, message, ...extra });
export const css = (
  selector: string,
  property: string,
  message: string,
  extra: Partial<ValidationRule> = {},
): ValidationRule => ({ selector, property, message, ...extra });
export const documentHtml = (body: string, title = 'Моя сторінка') =>
  `<!DOCTYPE html>\n<html lang="uk">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>`;
export const imagePath = `${import.meta.env.BASE_URL}hobby.svg`;
