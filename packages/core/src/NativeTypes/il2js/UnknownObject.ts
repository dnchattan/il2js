import { TypeName } from '../../FieldSymbols';
import { NativeStruct } from './NativeStruct';

export class UnknownObject extends NativeStruct {
  public __brand: 'NativeType' = 'NativeType';
  public static [TypeName] = 'UnknownObject';
  public static size = 0;
}
