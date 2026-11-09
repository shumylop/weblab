// Shared by the student-management endpoint and the browser forms.
export function validPassword(
  password: string,
  role: 'student' | 'teacher' = 'teacher',
) {
  return (
    password.length >= (role === 'student' ? 6 : 12) && password.length <= 128
  );
}
