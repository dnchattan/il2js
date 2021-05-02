const reservedNames = new Set(['name', 'size']);

export function fixName(name: string): string {
  // eslint-disable-next-line no-useless-escape
  const fixedName = name.replace(/[<>\[\]=,\s|\.]/g, '_');
  if (reservedNames.has(fixedName)) {
    return `_${fixedName}`;
  }
  return fixedName;
}
