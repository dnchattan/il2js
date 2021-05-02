import { types } from 'ref-napi';
import { TypeName } from '../../FieldSymbols';
import { il2js } from '../il2js';

export class DateTime extends il2js.NativeStruct {
  public static [TypeName] = 'System.DateTime';

  static size = 0;

  public static boxedValue = 'Date';

  public unbox() {
    return this.value;
  }

  public toPrimitive() {
    return this.value;
  }

  public get dateData(): number | string | BigInt {
    return this.readTypePrimitive(0, types.uint64, 1);
  }

  public get value(): Date {
    const dateData = BigInt(this.dateData);
    return new Date(
      Number(dateData / BigInt(10000) - BigInt(62135596800000) + BigInt(new Date().getTimezoneOffset() * 60000))
    );
  }
}
