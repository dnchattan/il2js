import type { Address, Size } from './Address';
import { TypeName } from './FieldSymbols';

export interface NativeType<T extends NativeTypeInstance = NativeTypeInstance> {
  new (address: Address, ...typeArgs: any[]): T;
  readonly [TypeName]: string;
  readonly size: Size;
  readonly address: Address;
  readonly boxedValue?: string;
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
