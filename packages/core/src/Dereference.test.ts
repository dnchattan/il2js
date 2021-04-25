import { types } from 'ref-napi';
import { deref } from './Dereference';
import { getCurrentIOContext, setCurrentIOContext } from './Zone';
import { addressToNumber } from './Address';
import { IOContext } from './IOContext';

function createMockIOContext(): IOContext {
  return {
    read: jest.fn(),
  };
}

describe('dereference', () => {
  it('invalid indirection', () => {
    expect(() => deref(createMockIOContext(), 0, 0)).toThrowError(RangeError);
  });
  it('no ioContext', () => {
    expect(() => getCurrentIOContext()).toThrowError(ReferenceError);
  });
  it('value', () => {
    expect(deref(createMockIOContext(), 0x5d, 1)).toEqual(0x5d);
  });
  it('pointers', async () => {
    const buf = Buffer.alloc(types.int64.size * 3);
    types.int64.set(buf, 0, 16);
    types.int64.set(buf, 8, 0xff);
    types.int64.set(buf, 16, 8);

    const ioContext: IOContext = {
      read(offset, size) {
        return buf.slice(addressToNumber(offset), addressToNumber(size));
      },
    };
    setCurrentIOContext(ioContext).run(() => {
      expect(deref(ioContext, 0, 2)).toEqual(16);
      expect(deref(ioContext, 0, 3)).toEqual(8);
      expect(deref(ioContext, 0, 4)).toEqual(0xff);
    });
  });
});
