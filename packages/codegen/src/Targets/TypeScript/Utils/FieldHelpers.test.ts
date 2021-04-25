import { printTsNode, fakeContext } from '../Test';
import { mockIl2CppTypeInfo } from '../../../Types';
import { generateFieldAccessor } from './FieldHelpers';

describe('FieldHelpers', () => {
  it('generateFieldAccessor', () => {
    expect(
      printTsNode(
        generateFieldAccessor(
          {
            Type: mockIl2CppTypeInfo({ Namespace: 'System', TypeName: 'CString', Indirection: 1 }),
            Name: 'title',
            Offset: 0x8,
          },
          fakeContext,
          undefined,
          false
        )
      )
    ).toMatchInlineSnapshot(`
      "public get title(): System.CString {
          return this.readField(8, System.CString, 1);
      }"
    `);
  });
  it('generateFieldAccessor(pointer)', () => {
    expect(
      printTsNode(
        generateFieldAccessor(
          {
            Type: mockIl2CppTypeInfo({ Namespace: 'System', TypeName: 'CString', Indirection: 2 }),
            Name: 'title',
            Offset: 0x8,
          },
          fakeContext,
          undefined,
          false
        )
      )
    ).toMatchInlineSnapshot(`
      "public get title(): System.CString {
          return this.readField(8, System.CString, 2);
      }"
    `);
  });
  it('generateFieldAccessor(primitive)', () => {
    expect(
      printTsNode(
        generateFieldAccessor(
          {
            Type: mockIl2CppTypeInfo({ TypeName: 'int32_t', IsPrimitive: true, Indirection: 1 }),
            Name: 'title',
            Offset: 0x8,
          },
          fakeContext,
          undefined,
          false
        )
      )
    ).toMatchInlineSnapshot(`
      "public get title(): number {
          return this.readTypePrimitive(8, \\"int32_t\\", 1);
      }"
    `);
  });
  it('static generateFieldAccessor(primitive)', () => {
    expect(
      printTsNode(
        generateFieldAccessor(
          {
            Type: mockIl2CppTypeInfo({ TypeName: 'int32_t', IsPrimitive: true, Indirection: 1 }),
            Name: 'title',
            Offset: 0x8,
          },
          fakeContext,
          undefined,
          true
        )
      )
    ).toMatchInlineSnapshot(`
      "public static get title(): number {
          return this.readTypePrimitive(8, \\"int32_t\\", 1);
      }"
    `);
  });
});
