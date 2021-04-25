// eslint-disable-next-line max-classes-per-file
import { BufferTypeFactory } from 'win32-api';
import { Address } from '../../Address';
import { TypeName } from '../../FieldSymbols';
import { NativeStruct } from './NativeStruct';

/**
sizeof(Il2CppClass_1): 184
sizeof(MethodInfo): 80
sizeof(Il2CppClass): 4376
MethodInfo.klass offset : 24
Il2CppClass.rgctx_data offset : 192
Il2CppClass.static_fields offset : 184
 */

// .method.klass.rgctx_data.klass.static_fields

export class Il2CppClass extends NativeStruct {
  public static [TypeName] = 'il2js.Il2CppClass';
  static size = 4376;
  static get address(): Address {
    throw new Error('address not accessible for built-in types');
  }

  public get name(): string {
    return this.readTypePrimitive<string>(16, BufferTypeFactory(512, 'utf8'), 2).split('\0')[0];
  }

  public get namespace(): string {
    return this.readTypePrimitive<string>(24, BufferTypeFactory(512, 'utf8'), 2).split('\0')[0];
  }

  public get klass(): Il2CppClass {
    // rgctx_data union value
    return this.readField(192, Il2CppClass, 2);
  }
}

class MethodInfoValue extends NativeStruct {
  public static [TypeName] = 'il2js.MethodInfoValue';
  static size = 80;
  static get address(): Address {
    throw new Error('address not accessible for built-in types');
  }

  public get klass(): Il2CppClass {
    return this.readField(24, Il2CppClass, 2);
  }
}

export class MethodInfo extends NativeStruct {
  public static [TypeName] = 'il2js.MethodInfo';
  static size = 8;
  static get address(): Address {
    throw new Error('address not accessible for built-in types');
  }

  constructor(public readonly moduleOffset: Address) {
    super(moduleOffset);
  }

  public getCppClass(baseAddress: Address): Il2CppClass {
    const methodInfo: MethodInfoValue = this.readField(baseAddress, MethodInfoValue, 2);
    return methodInfo.klass;
  }
}
