import { types } from 'ref-napi';
import { Address } from '../../../../Address';
import { NativeTypeInstance, NativeType } from '../../../../NativeType';
import { TypeName } from '../../../../FieldSymbols';
import { NativeStruct, UnknownObject } from '../../../il2js/_TypeIndex';
import { ArrayPointer } from '../../Internal/ArrayPointer';
import { assert } from '../../../../Helpers';

export class List<T extends string | number | boolean | NativeTypeInstance = UnknownObject>
  extends NativeStruct
  implements Iterable<T> {
  public static [TypeName] = 'System.List';
  static size = 36;
  private readonly vtype: (T extends NativeTypeInstance ? NativeType<T> : string) | string;

  // constructor(address: Address);
  constructor(address: Address);
  constructor(address: Address, vtype: any);
  constructor(address: Address, vtype: T extends NativeTypeInstance ? NativeType<T> : string = UnknownObject as any) {
    super(address);
    this.vtype = vtype as any;
  }

  public toPrimitive(): T[] {
    return this.toArray();
  }

  // @cache({ type: CacheType.SINGLETON, scope: CacheScope.INSTANCE })
  toArray(): T[] {
    return [...this];
  }

  map<U>(fn: (item: T, index: number, array: T[]) => U) {
    return this.toArray().map(fn);
  }

  [Symbol.iterator](): Iterator<T, any, undefined> {
    let index = 0;
    const count = this.count;
    const getItem = this.getItem.bind(this);
    return {
      next(): IteratorResult<T> {
        if (index < count) {
          return {
            done: false,
            value: getItem(index++),
          };
        }
        return {
          done: true,
          value: null,
        };
      },
    };
  }

  public getItem(index: number): T {
    assert(index >= 0 && index < this.count, RangeError);
    const array: ArrayPointer<T> = this.readField(16, ArrayPointer, 2, this.count, this.vtype as any);
    return array.getItem(index);
  }

  public get count(): number {
    return this.readTypePrimitive(24, types.int32, 1);
  }
}
