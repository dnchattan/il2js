import { printTsNode, fakeContext } from '../Test';
import { mockIl2CppTypeInfo } from '../../../Types';
import { generateTypeReference, getQualifiedTypeName } from './TypeNameHelpers';

describe('generateTypeReference', () => {
  it('basic', () => {
    expect(
      printTsNode(
        generateTypeReference(mockIl2CppTypeInfo({ TypeName: 'Class1', Namespace: 'Test.NS' }), fakeContext, undefined)
      )
    ).toEqual('Test.NS.Class1');
  });
});

describe('getQualifiedTypeName', () => {
  it('one{type}', () => {
    expect(getQualifiedTypeName(mockIl2CppTypeInfo({ TypeName: 'type', Namespace: 'one' }), fakeContext)).toEqual(
      'one.type'
    );
  });
  it('two.parts{type}', () => {
    expect(getQualifiedTypeName(mockIl2CppTypeInfo({ TypeName: 'type', Namespace: 'two.parts' }), fakeContext)).toEqual(
      'two.parts.type'
    );
  });
  it('""{type}', () => {
    expect(getQualifiedTypeName(mockIl2CppTypeInfo({ TypeName: 'type', Namespace: '' }), fakeContext)).toEqual('type');
  });
  it('undefined{type}', () => {
    expect(getQualifiedTypeName(mockIl2CppTypeInfo({ TypeName: 'type', Namespace: undefined }), fakeContext)).toEqual(
      'type'
    );
  });
});
