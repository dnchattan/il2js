export function assert(value: any, message?: string | Error): asserts value {
  if (!value) {
    throw new Error(`**Assert** ${message || value}`);
  }
}
