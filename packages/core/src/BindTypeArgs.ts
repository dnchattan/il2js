import type { Address } from './Address';
import type { NativeType, NativeTypeInstance } from './NativeType';
import { TypeName } from './FieldSymbols';
import { getTypeName } from './TypeHelpers';
import { Tail } from './Helpers';

export function bindTypeArgs<TCtor extends NativeType = NativeType, T extends NativeTypeInstance = NativeTypeInstance>(
  type: TCtor,
  ...typeArgs: Tail<ConstructorParameters<TCtor>>
): NativeType<T> {
  const typeName = `${getTypeName(type)}<${typeArgs.map(getTypeName).join(', ')}>`;
  // @ts-ignore
  class BoundClass extends type {
    public static readonly [TypeName] = typeName;

    static get size() {
      return type.calculateSize ? type.calculateSize(...typeArgs) : type.size;
    }

    public static fieldNames?: string[] = type.fieldNames;

    constructor(address: Address) {
      super(address, ...typeArgs);
    }
  }
  Object.defineProperty(BoundClass, 'name', { value: typeName });
  // @ts-ignore
  return BoundClass;
}
