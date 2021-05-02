export class OncePer<T, U> {
  private storage = new Map<T, U[]>();
  once(t: T, u: U): boolean {
    const entry = this.storage.get(t);
    if (!entry) {
      this.storage.set(t, [u]);
      return true;
    }
    if (!entry.includes(u)) {
      entry.push(u);
      return true;
    }
    return false;
  }
}
