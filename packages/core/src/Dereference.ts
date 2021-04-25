import { types } from 'ref-napi';
import { Address } from './Address';
import { assert } from './Helpers';
import { IOContext } from './IOContext';

export function deref(ioContext: IOContext, address: Address, indirection: number): Address {
  assert(indirection > 0, RangeError);
  // eslint-disable-next-line no-param-reassign
  while (--indirection > 0) {
    const ptrType = ioContext.ptrType ?? types.uint64;
    const ptr = ioContext.read(address, ptrType.size);
    // eslint-disable-next-line no-param-reassign
    address = ptrType.get(ptr, 0);
  }
  return address;
}
