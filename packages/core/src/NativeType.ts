import type { Address, Size } from './Address';
import { TypeName } from './FieldSymbols';

export type FieldType = string | number | boolean | Date | NativeTypeInstance;

export interface NativeTypeCodegenDescriptor {
  readonly name: string;
  readonly boxedValue?: string;
}

export interface NativeType<T extends NativeTypeInstance = NativeTypeInstance> extends NativeTypeCodegenDescriptor {
  new (address: Address, ...typeArgs: any[]): T;
  readonly [TypeName]: string;
  readonly size: Size;
  readonly address: Address;
  readonly fieldNames?: string[];
  calculateSize?(...typeArgs: any[]): number;
}

export interface NativeTypeInstance {
  constructor?: any;
  address: Address;
  toPrimitive?(): any;
  unbox?(): any;
  toJSON<TStub>(depth?: number, getStubFn?: (object: NativeTypeInstance) => TStub): {};
}
