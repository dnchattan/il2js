import { types } from 'ref-napi';
import { NativeStruct } from './NativeStruct';
import { System } from '../System';
import { setCurrentIOContext } from '../../Zone';
import { BufferContext } from '../../BufferContext';
import { TypeName } from '../../FieldSymbols';

describe('NativeStruct', () => {
  describe('derived impls', () => {
    it('fields', async () => {
      class TestType extends NativeStruct {
        static readonly [TypeName] = 'TestType';
        static readonly size = 16;

        public get greeting(): string {
          return this.readField(8, System.String, 2);
        }
      }

      const buffer = Buffer.alloc(512);
      types.int64.set(buffer, 56, 64);
      types.int32.set(buffer, 64 + 16, 13);
      buffer.write('Hello, world!', 64 + 16 + 4, 'utf16le');
      setCurrentIOContext(new BufferContext(buffer)).run(() => {
        const instance = new TestType(48);
        expect(instance.greeting).toEqual('Hello, world!');
      });
    });
  });
});
