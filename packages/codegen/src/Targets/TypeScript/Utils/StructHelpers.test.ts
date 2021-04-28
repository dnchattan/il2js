import { printTsNode, fakeContext } from '../Test';
import { mockIl2CppTypeDefinitionInfo, mockIl2CppTypeInfo } from '../../../Types';
import { generateClass } from './StructHelpers';
import { TypeRegistry } from '../TypeRegistry';

describe('TsGen', () => {
  describe('class', () => {
    it('simple', () => {
      const result = generateClass(
        mockIl2CppTypeDefinitionInfo({ TypeName: 'SomeType', Namespace: 'Test' }),
        fakeContext
      )!;
      expect(printTsNode(result)).toMatchInlineSnapshot(`
        "export class SomeType extends il2js.NativeStruct {
            public static [TypeName] = \\"Test.SomeType\\";
            static get size() { return 0; }
            public static fieldNames: string[] = [];
            public static staticMethods = {};
        }"
      `);
    });
    it('with address', () => {
      const result = generateClass(
        mockIl2CppTypeDefinitionInfo({ TypeName: 'SomeType', Namespace: 'Test', Address: 42 }),
        fakeContext
      )!;
      expect(printTsNode(result)).toMatchInlineSnapshot(`
        "export class SomeType extends il2js.NativeStruct {
            public static [TypeName] = \\"Test.SomeType\\";
            static get size() { return 0; }
            public static address = 42;
            public static fieldNames: string[] = [];
            public static staticMethods = {};
        }"
      `);
    });
    it('with members', () => {
      const result = generateClass(
        mockIl2CppTypeDefinitionInfo(
          { TypeName: 'SomeType', Namespace: 'Test' },
          {
            ImageName: 'image',
            Fields: [
              {
                Type: mockIl2CppTypeInfo({ TypeName: 'CString', Namespace: 'System', Indirection: 1 }),
                Name: 'title',
                Offset: 0x8,
              },
            ],
          }
        ),
        fakeContext
      )!;
      expect(printTsNode(result)).toMatchInlineSnapshot(`
        "export class SomeType extends il2js.NativeStruct {
            public static [TypeName] = \\"Test.SomeType\\";
            static get size() { return 0; }
            public static fieldNames: string[] = [];
            public static staticMethods = {};
        }"
      `);
    });
    it('with member pointer', () => {
      const result = generateClass(
        mockIl2CppTypeDefinitionInfo(
          { TypeName: 'SomeType', Namespace: 'Test' },
          {
            ImageName: 'image',
            Fields: [
              {
                Type: mockIl2CppTypeInfo({ TypeName: 'CString', Namespace: 'System', Indirection: 2 }),
                Name: 'title',
                Offset: 0x8,
              },
            ],
          }
        ),
        fakeContext
      )!;
      expect(printTsNode(result)).toMatchInlineSnapshot(`
        "export class SomeType extends il2js.NativeStruct {
            public static [TypeName] = \\"Test.SomeType\\";
            static get size() { return 0; }
            public static fieldNames: string[] = [];
            public static staticMethods = {};
        }"
      `);
    });
    it('with parent', () => {
      const result = generateClass(
        mockIl2CppTypeDefinitionInfo({
          TypeName: 'SomeType',
          Namespace: 'Test',
          BaseType: mockIl2CppTypeInfo({ TypeName: 'Bar', Namespace: 'Foo' }),
        }),
        fakeContext
      )!;
      expect(printTsNode(result)).toMatchInlineSnapshot(`
        "export class SomeType extends il2js.NativeStruct {
            public static [TypeName] = \\"Test.SomeType\\";
            static get size() { return 0; }
            public static fieldNames: string[] = [];
            public static staticMethods = {};
        }"
      `);
    });
    it('with parent<T>', () => {
      const result = generateClass(
        mockIl2CppTypeDefinitionInfo({
          TypeName: 'SomeType',
          Namespace: 'Test',
          BaseType: mockIl2CppTypeInfo({
            TypeName: 'Bar',
            Namespace: 'Foo',
            TypeArguments: [mockIl2CppTypeInfo({ TypeName: 'CString', Namespace: 'System' })],
          }),
        }),
        {
          rootNamespace: '',
          typeFunctions: {},
          types: new TypeRegistry(),
        }
      )!;
      expect(printTsNode(result)).toMatchInlineSnapshot(`
        "export class SomeType extends il2js.NativeStruct {
            public static [TypeName] = \\"Test.SomeType\\";
            static get size() { return 0; }
            public static fieldNames: string[] = [];
            public static staticMethods = {};
        }"
      `);
    });
  });
});
