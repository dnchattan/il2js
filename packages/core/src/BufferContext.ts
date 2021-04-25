import { Address, addressToNumber, offsetAddress } from './Address';
import { IOContext } from './IOContext';

export class BufferContext implements IOContext {
  constructor(private readonly buffer: Buffer) {}

  read(offset: Address, size: Address): Buffer {
    return this.buffer.slice(addressToNumber(offset), addressToNumber(offsetAddress(offset, size)));
  }
}
