import { Type } from 'ref-napi';
import { Address } from '../../../Address';
import { NativeTypeInstance, NativeType } from '../../../NativeType';
import { TypeName } from '../../../FieldSymbols';
import { NativeStruct, UnknownObject } from '../../il2js/_TypeIndex';
import { PrimitiveTypes } from '../../../PrimitiveTypes';
import { assert } from '../../../Helpers';

export class ArrayPointer<
  T extends string | number | boolean | NativeTypeInstance = UnknownObject
> extends NativeStruct {
  public static [TypeName] = 'System.Internal.ArrayPointer';
  static size = 0;
  private readonly itemSize: number;
  private readonly vtype: (T extends NativeTypeInstance ? NativeType<T> : string) | string;
  private readonly ptype?: Type;

  constructor(
    address: Address,
    private readonly itemCount: number,
    vtype: T extends NativeTypeInstance ? NativeType<T> : string
  ) {
    super(address);
    this.vtype = vtype as any;
    if (typeof vtype === 'string') {
      this.ptype = PrimitiveTypes[vtype as keyof typeof PrimitiveTypes];
      this.itemSize = this.ptype.size;
    } else {
      this.itemSize = 8;
    }
  }

  public getItem(index: number): T {
    assert(index >= 0 && index < this.itemCount, RangeError);
    if (typeof this.vtype === 'string') {
      return this.readTypePrimitive(32 + index * this.itemSize, this.vtype, 1);
    }
    return this.readField(32 + index * this.itemSize, this.vtype as NativeType, 2) as any;
  }
}
