export function loginEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(normalized))
    throw new Error('Логін: 3–32 латинські літери, цифри, крапка, _ або -.');
  return `${normalized}@login.weblab.invalid`;
}
export { validPassword } from '../../supabase/functions/manage-students/password-policy';
