import { Address, Size } from '../../../Address';
import { TypeName } from '../../../FieldSymbols';
import { assert } from '../../../Helpers';
import { NativeType, NativeTypeInstance } from '../../../NativeType';
import { isPrimitiveType, sizeofType } from '../../../TypeHelpers';
import { NativeStruct } from '../../il2js/NativeStruct';
import { UnknownObject } from '../../il2js/UnknownObject';

export class ManagedArray<T extends string | number | boolean | NativeTypeInstance = UnknownObject>
  extends NativeStruct
  implements Iterable<T> {
  public static [TypeName] = 'System.Internal.ManagedArray';
  static size = 40;
  private readonly itemSize: Size;
  private readonly itemIndirection;
  private readonly vtype: (T extends NativeTypeInstance ? NativeType<T> : string) | string;

  constructor(address: Address, vtype: NativeType | string, itemIndirection?: number, count?: Size);
  constructor(
    address: Address,
    vtype: T extends NativeTypeInstance ? NativeType<T> : string,
    itemIndirection?: number,
    private countValue?: Size
  ) {
    super(address);
    this.vtype = vtype as any;
    // if indirection is unspecified, assume primitives are value types, and objects are references
    this.itemIndirection = itemIndirection ?? (isPrimitiveType(vtype) ? 1 : 2);
    if (this.itemIndirection > 1) {
      this.itemSize = 8;
    } else {
      this.itemSize = sizeofType(vtype);
    }
  }

  toPrimitive() {
    return this.toArray();
  }

  toArray() {
    return [...this];
  }

  get count(): number {
    if (this.countValue === undefined) {
      this.countValue = this.readTypePrimitive(24, 'uint64', 1);
      assert(this.countValue);
    }
    return this.countValue;
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
            value: getItem(index++)!,
          };
        }
        return {
          done: true,
          value: null,
        };
      },
    };
  }

  getItem(index: number): T | undefined {
    assert(index >= 0 && index < this.count);
    return this.read(32 + index * this.itemSize, this.vtype as any, this.itemIndirection);
  }
}
