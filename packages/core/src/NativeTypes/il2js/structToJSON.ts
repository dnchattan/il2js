import { NativeType, NativeTypeInstance } from '../../NativeType';
import { TypeName } from '../../FieldSymbols';
import { Address } from '../../Address';
// eslint-disable-next-line import/no-cycle
import { NativeStruct } from './NativeStruct';
import { hex } from '../../Helpers';

function structToJSON(
  struct: NativeStruct,
  addresses: Address[],
  depth: number,
  getStubFn: (object: NativeTypeInstance) => any
) {
  if (addresses.length >= depth) {
    return getStubFn(struct);
  }
  if (addresses.includes(struct.address)) {
    return '<recursion>';
  }
  const fieldNames = (Object.getPrototypeOf(struct).constructor?.fieldNames as string[])?.sort();
  if (!fieldNames?.length) {
    return undefined;
  }
  const childAddresses = [...addresses, struct.address];
  const entry: any = { $id: struct.$id, $type: (struct.constructor as NativeType)[TypeName] };
  for (const name of fieldNames) {
    const value = (struct as any)[name];
    if (value === undefined) {
      continue;
    }
    if (value[TypeName] === 'UnknownObject') {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entry[name] = flattenValue(value, childAddresses, depth, getStubFn);
  }
  entry.$address = hex(struct.address);
  return entry;
}

export function flattenValue(
  value: unknown,
  addresses: Address[],
  depth: number,
  getStubFn: (object: NativeTypeInstance) => any
): any {
  let result: any = value;
  if (result === undefined) {
    return undefined;
  }
  if (result instanceof Array) {
    result = result.map((item) => flattenValue(item, addresses, depth, getStubFn));
  } else if (result instanceof Map) {
    const mapValue: any = {};
    for (const [key, entry] of result.entries()) {
      mapValue[key] = flattenValue(entry, addresses, depth, getStubFn);
    }
    result = mapValue;
  } else if (result.toPrimitive) {
    result = flattenValue(result.toPrimitive(), addresses, depth, getStubFn);
  } else if (result.toJSON) {
    result = structToJSON(result as NativeStruct, addresses, depth, getStubFn);
  }
  return result;
}
