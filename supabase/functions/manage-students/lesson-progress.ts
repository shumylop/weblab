export function completedLessonIds(lessons: unknown): number[] {
  if (!lessons || typeof lessons !== 'object' || Array.isArray(lessons))
    return [];
  return Object.entries(lessons)
    .filter(
      ([id, progress]) => /^[1-9]\d*$/.test(id) && progress?.completed === true,
    )
    .map(([id]) => Number(id))
    .filter(Number.isSafeInteger)
    .sort((a, b) => a - b);
}
