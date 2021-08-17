import { types } from 'ref-napi';
import { TypeName } from '../../FieldSymbols';
import { FieldType, NativeType, NativeTypeInstance } from '../../NativeType';
import { Address } from '../../Address';
import { UnknownObject } from '../il2js/UnknownObject';
import { NativeStruct } from '../il2js/NativeStruct';

export class Nullable<T extends FieldType = UnknownObject> extends NativeStruct {
  public static [TypeName] = 'System.Nullable';
  static size = 16;
  private readonly vtype: (T extends NativeTypeInstance ? NativeType<T> : string) | string;
  constructor(address: Address, vtype: T extends NativeTypeInstance ? NativeType<T> : string = UnknownObject as any) {
    super(address);
    this.vtype = vtype as any;
  }

  public toPrimitive(): T | undefined {
    return this.hasValue ? this.value : undefined;
  }

  public get value(): T | undefined {
    return this.read(0, this.vtype, 2);
  }

  public get hasValue(): boolean {
    return this.readTypePrimitive(8, types.bool, 1);
  }
}
