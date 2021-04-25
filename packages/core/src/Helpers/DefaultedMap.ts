export class DefaultedMap<K, V> extends Map<K, V> {
  constructor(private defaultValue: (key: K) => V) {
    super();
  }

  get(key: K): V {
    let value = super.get(key);
    if (!value) {
      value = this.defaultValue(key);
      super.set(key, value);
    }
    return value;
  }
}
