import { String } from '../../String';
import { Address, Size } from '../../../../Address';
import { FieldType, NativeType, NativeTypeInstance } from '../../../../NativeType';
import { sizeofPrimitiveOrPointer } from '../../../../TypeHelpers';
import { il2js } from '../../../il2js';
import { UnknownObject } from '../../../il2js/_TypeIndex';

export class DictionaryEntry<
  K extends FieldType = UnknownObject,
  V extends FieldType = UnknownObject
> extends il2js.NativeStruct {
  static size: Size = 24;

  private readonly ktype: NativeType<K extends NativeTypeInstance ? K : never> | string;

  private readonly vtype: NativeType<V extends NativeTypeInstance ? V : never> | string;

  private readonly vOffset: number;

  static calculateSize(
    ktype: NativeType<NativeTypeInstance> | string,
    vtype: NativeType<NativeTypeInstance> | string
  ): number {
    if (sizeofPrimitiveOrPointer(ktype) === 4 && sizeofPrimitiveOrPointer(vtype) === 4) {
      return 16;
    }
    return 24;
  }

  constructor(
    address: Address,
    ktype: NativeType<NativeTypeInstance> | string,
    vtype: NativeType<NativeTypeInstance> | string
  ) {
    super(address);
    this.ktype = ktype as any;
    this.vtype = vtype as any;
    this.vOffset = 8;
    if (sizeofPrimitiveOrPointer(this.ktype) === 4 && sizeofPrimitiveOrPointer(this.vtype) === 4) {
      this.vOffset = 4;
    }
  }

  public get key():
    | (K extends NativeType ? (InstanceType<K> extends String ? string : InstanceType<K>) : K)
    | undefined {
    return this.read(8, this.ktype, undefined);
  }

  public get value():
    | (V extends NativeType ? (InstanceType<V> extends String ? string : InstanceType<V>) : V)
    | undefined {
    return this.read(8 + this.vOffset, this.vtype, undefined);
  }
}
