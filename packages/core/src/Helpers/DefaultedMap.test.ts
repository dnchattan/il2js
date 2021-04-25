import { DefaultedMap } from './DefaultedMap';

describe('DefaultedMap', () => {
  it('first access', () => {
    const backfillFn = jest.fn((key: string): [string] => [key]);
    const map = new DefaultedMap<string, [string]>(backfillFn);
    const result = map.get('foo');
    expect(result).toEqual(['foo']);
    expect(backfillFn).toHaveBeenCalledWith('foo');
  });

  it('second access', () => {
    const backfillFn = jest.fn((key: string): [string] => [key]);
    const map = new DefaultedMap<string, [string]>(backfillFn);
    const result = map.get('foo');
    expect(result).toEqual(['foo']);
    expect(backfillFn).toHaveBeenCalledTimes(1);
  });

  it('access filled value', () => {
    const backfillFn = jest.fn((key: string): [string] => [key]);
    const map = new DefaultedMap<string, [string]>(backfillFn);
    map.set('foo', ['bar']);
    const result = map.get('foo');
    expect(result).toEqual(['bar']);
    expect(backfillFn).not.toHaveBeenCalled();
  });
});
