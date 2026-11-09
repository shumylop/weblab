import { describe, it, expect } from 'vitest';
import { loginEmail, validPassword } from '../src/features/identity';
describe('Логіни без персональної пошти', () => {
  it('нормалізує псевдонім у внутрішню адресу', () => {
    expect(loginEmail(' Comet01 ')).toBe('comet01@login.weblab.invalid');
  });
  it('не приймає адреси email, пробіли або SQL/HTML', () => {
    for (const name of ['a', 'user@example.org', '<script>', 'name surname'])
      expect(() => loginEmail(name)).toThrow();
  });
  it('має мінімум 12 та максимум 128 символів пароля', () => {
    expect(validPassword('a'.repeat(11))).toBe(false);
    expect(validPassword('a'.repeat(12))).toBe(true);
    expect(validPassword('a'.repeat(129))).toBe(false);
  });
});

it('приймає простий пароль учня від 6 символів без вимог до складності', () => {
  expect(validPassword('123456', 'student')).toBe(true);
  expect(validPassword('abcdef', 'student')).toBe(true);
  expect(validPassword('12345', 'student')).toBe(false);
  expect(validPassword('a'.repeat(128), 'student')).toBe(true);
  expect(validPassword('a'.repeat(129), 'student')).toBe(false);
  expect(validPassword('123456', 'teacher')).toBe(false);
});
