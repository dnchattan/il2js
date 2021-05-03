import type { Type } from 'ref-napi';
import type { Size } from './Address';
import type { NativeType, NativeTypeCodegenDescriptor } from './NativeType';
import { TypeName } from './FieldSymbols';
import { PrimitiveTypes } from './PrimitiveTypes';
import { assert } from './Helpers';

export function isNativeType(type: NativeType | string | number | boolean | Type | unknown): type is NativeType {
  return (type as any).name !== undefined;
}

export function isNativeTypeCodegenDescriptor(type: unknown): type is NativeTypeCodegenDescriptor {
  return (type as NativeTypeCodegenDescriptor).name !== undefined;
}

export function isPrimitiveType(type: Type | NativeType | string | number | boolean): type is Type | string {
  return typeof type === 'string' || ((type as any).size !== undefined && (type as any).indirection !== undefined);
}

export function sizeofPrimitiveOrPointer(type: NativeType | string | Type): Size {
  if (isPrimitiveType(type)) {
    const refType = PrimitiveTypes[type as keyof typeof PrimitiveTypes];
    assert(refType);
    return refType.size;
  }
  return 8;
}

export function sizeofType(type: NativeType | string | Type): Size {
  if (isPrimitiveType(type)) {
    const refType = PrimitiveTypes[type as keyof typeof PrimitiveTypes];
    assert(refType);
    return refType.size;
  }
  return type.size;
}

export function getTypeName(type: Type | NativeType | string): string {
  if (typeof type === 'string') {
    return type;
  }
  if (isPrimitiveType(type)) {
    return type.name ?? '?';
  }
  return (type as NativeType)[TypeName] || type.name;
}
