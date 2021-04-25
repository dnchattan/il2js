import { Type } from 'ref-napi';
import { Offset, Address } from './Address';

export interface IOContext {
  init?(): void;
  read(offset: Address, size: Offset): Buffer;
  ptrType?: Type;
}
