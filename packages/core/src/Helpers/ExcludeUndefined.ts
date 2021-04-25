export function excludeUndefined<T>(arrayValue: (T | undefined)[]): T[] {
  return arrayValue.filter((e) => e !== undefined) as T[];
}
