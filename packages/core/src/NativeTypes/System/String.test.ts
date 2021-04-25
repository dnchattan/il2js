import { BufferContext } from '../../BufferContext';
import { setCurrentIOContext } from '../../Zone';
import { String } from './String';

describe('String', () => {
  it('read', async () => {
    const buf = Buffer.alloc(512);
    const testValue = 'Hello, world!';
    buf.writeInt32LE(testValue.length, 16);
    buf.write(testValue, 20, 'utf16le');
    setCurrentIOContext(new BufferContext(buf)).run(() => {
      // eslint-disable-next-line no-new-wrappers
      const value = new String(0);
      expect(value.length).toEqual(testValue.length);
      expect(value.value).toEqual(testValue);
    });
  });
});
