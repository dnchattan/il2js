import { types } from 'ref-napi';
import { BufferTypeFactory } from 'win32-api';
import { TypeName } from '../../FieldSymbols';
import { il2js } from '../il2js';

export class String extends il2js.NativeStruct {
  public static [TypeName] = 'System.String';

  static size = 0;

  public static boxedValue = 'string';

  public unbox() {
    return this.value;
  }

  public toPrimitive() {
    return this.value;
  }

  public get length(): number {
    return this.readTypePrimitive(16, types.int32, 1);
  }

  public get value(): string {
    let length = this.length;
    if (length > 4096) {
      // eslint-disable-next-line no-console
      console.warn(`Reading string of length ${length} at address ${this.address} will be truncated`);
      length = 4096;
    }
    if (length === 0) {
      return '';
    }
    return this.readTypePrimitive(20, BufferTypeFactory(length * 2, 'utf16le'), 1);
  }
}
