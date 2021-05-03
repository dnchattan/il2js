/* eslint-disable no-param-reassign */
import { codegen } from './Codegen';
import { IGameAssembly } from './IGameAssembly';
import { mockIl2CppTypeDefinitionInfo, mockIl2CppTypeInfo } from './Types';

describe('codegen', () => {
  it('with no typelib', async () => {
    const writeFile: jest.Mock<Promise<void>, [path: string, value: string | Buffer]> = jest.fn((_path, _value) =>
      Promise.resolve()
    );
    const codegenOpts = { api: { writeFile } };
    const load: jest.Mock<Promise<void>, []> = jest.fn();
    const gameAssembly: IGameAssembly = {
      cached: false,
      gameAssemblyDllPath: 'foo/TestGameAssembly.dll',
      globalMetadataPath: 'foo/metadata/globalMetadata.dat',
      load,
      version: '123',
      structs: {
        TypeInfoList: [
          mockIl2CppTypeDefinitionInfo(
            { TypeName: 'Bar', Namespace: 'Test', TypeIndex: 1 },
            {
              ImageName: 'image',
              Fields: [
                {
                  Type: mockIl2CppTypeInfo({ TypeName: 'int', Indirection: 1, IsPrimitive: true }),
                  Name: 'value',
                  Offset: 0x8,
                },
              ],
            }
          ),
          mockIl2CppTypeDefinitionInfo(
            { TypeName: 'Foo', Namespace: 'Test', TypeIndex: 2 },
            {
              ImageName: 'image',
              Fields: [
                {
                  Type: mockIl2CppTypeInfo({ TypeName: 'Bar', Namespace: 'Test', Indirection: 1, TypeIndex: 1 }),
                  Name: 'bar',
                  Offset: 0x8,
                },
              ],
            }
          ),
        ],
        TypeNameToStaticMethods: {
          'Test.Foo': [{ Address: 1234, Name: 'get_instance' }],
        },
      },
    };
    await codegen(
      {
        gameAssembly,
        output: {
          entry: 'index.ts',
          outputDir: 'out',
        },
        targets: [['typescript', { rootNamespace: 'codegen' }]],
        types: [],
      },
      codegenOpts
    );
    expect(writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "out\\\\index.ts",
        "import { Address, TypeName, bindTypeArgs } from \\"@il2js/core\\";
      export const GameAssemblyInfo = {
          assemblyName: \\"TestGameAssembly.dll\\",
          version: \\"123\\"
      };
      export namespace codegen.Test {
          export class Bar extends il2js.NativeStruct {
              public static [TypeName] = \\"codegen.Test.Bar\\";
              static get size() { return 8 + il2js.NativeStruct.sizeof(\\"int\\"); }
              public static fieldNames: string[] = [\\"value\\"];
              public get value(): number {
                  return this.readTypePrimitive(8, \\"int\\", 1);
              }
              public static staticMethods = {};
          }
      }
      export namespace codegen.Test {
          export class Foo extends il2js.NativeStruct {
              public static [TypeName] = \\"codegen.Test.Foo\\";
              static get size() { return 8 + il2js.NativeStruct.sizeof(codegen.Test.Bar); }
              public static fieldNames: string[] = [\\"bar\\"];
              public get bar(): codegen.Test.Bar {
                  return this.readField(8, codegen.Test.Bar, 1);
              }
              public static staticMethods = {
                  \\"get_instance\\": () => new il2js.MethodInfo(1234)
              };
          }
      }",
      ]
    `);
  });
  it('with custom typelib', async () => {
    const writeFile: jest.Mock<Promise<void>, [path: string, value: string | Buffer]> = jest.fn((_path, _value) =>
      Promise.resolve()
    );
    const codegenOpts = { api: { writeFile } };
    const load: jest.Mock<Promise<void>, []> = jest.fn();
    const gameAssembly: IGameAssembly = {
      cached: false,
      gameAssemblyDllPath: 'foo/TestGameAssembly.dll',
      globalMetadataPath: 'foo/metadata/globalMetadata.dat',
      load,
      version: '123',
      structs: {
        TypeInfoList: [
          mockIl2CppTypeDefinitionInfo(
            { TypeName: 'Foo', Namespace: 'Test' },
            {
              ImageName: 'image',
              Fields: [
                {
                  Type: mockIl2CppTypeInfo({
                    TypeName: 'CustomType',
                    Namespace: 'Custom.Namespace',
                    Indirection: 1,
                  }),
                  Name: 'value',
                  Offset: 0x8,
                },
              ],
            }
          ),
        ],
        TypeNameToStaticMethods: {},
      },
    };
    await codegen(
      {
        gameAssembly,
        output: {
          entry: 'index.ts',
          outputDir: 'out',
        },
        targets: [['typescript', { rootNamespace: 'codegen' }]],
        types: [
          '@il2js/core',
          { from: './customTypes', types: { Custom: { Namespace: { CustomType: { name: 'CustomType' } } } } },
        ],
      },
      codegenOpts
    );
    expect(writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "out\\\\index.ts",
        "import { Address, TypeName, bindTypeArgs, System, il2js } from \\"@il2js/core\\";
      import { Custom } from \\"./customTypes\\";
      export const GameAssemblyInfo = {
          assemblyName: \\"TestGameAssembly.dll\\",
          version: \\"123\\"
      };
      export namespace codegen.Test {
          export class Foo extends il2js.NativeStruct {
              public static [TypeName] = \\"codegen.Test.Foo\\";
              static get size() { return 8 + il2js.NativeStruct.sizeof(Custom.Namespace.CustomType); }
              public static fieldNames: string[] = [\\"value\\"];
              public get value(): Custom.Namespace.CustomType {
                  return this.readField(8, Custom.Namespace.CustomType, 1);
              }
              public static staticMethods = {};
          }
      }",
      ]
    `);
  });
  it('inject with custom type override', async () => {
    const writeFile: jest.Mock<Promise<void>, [path: string, value: string | Buffer]> = jest.fn((_path, _value) =>
      Promise.resolve()
    );
    const codegenOpts = { api: { writeFile } };
    const load: jest.Mock<Promise<void>, []> = jest.fn();
    const gameAssembly: IGameAssembly = {
      cached: false,
      gameAssemblyDllPath: 'foo/TestGameAssembly.dll',
      globalMetadataPath: 'foo/metadata/globalMetadata.dat',
      load,
      version: '123',
      structs: {
        TypeInfoList: [
          mockIl2CppTypeDefinitionInfo(
            { TypeName: 'Bar', Namespace: 'Test' },
            {
              ImageName: 'image',
              Fields: [],
            }
          ),
          mockIl2CppTypeDefinitionInfo(
            { TypeName: 'Foo', Namespace: 'Test' },
            {
              ImageName: 'image',
              Fields: [
                {
                  Type: mockIl2CppTypeInfo({
                    TypeName: 'Bar',
                    Namespace: 'Test',
                    Indirection: 1,
                  }),
                  Name: 'value',
                  Offset: 0x8,
                },
              ],
            }
          ),
        ],
        TypeNameToStaticMethods: {},
      },
    };
    await codegen(
      {
        gameAssembly,
        output: {
          entry: 'index.ts',
          outputDir: 'out',
        },
        rootNamespace: 'codegen',
        types: ['@il2js/core', { from: './customTypes', types: { Injected: { Bar: { name: 'Bar' } } } }],
        visitors: [
          {
            visitTypeDef(type) {
              if (type.Type.TypeName === 'Bar' && type.Type.Namespace === 'Test') {
                return undefined;
              }
              return type;
            },
            visitTypeUsage(type) {
              if (type.TypeName === 'Bar' && type.Namespace === 'Test') {
                type.Namespace = 'Injected';
              }
              return type;
            },
          },
        ],
        targets: ['typescript'],
      },
      codegenOpts
    );
    expect(writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "out\\\\index.ts",
        "import { Address, TypeName, bindTypeArgs, System, il2js } from \\"@il2js/core\\";
      import { Injected } from \\"./customTypes\\";
      export const GameAssemblyInfo = {
          assemblyName: \\"TestGameAssembly.dll\\",
          version: \\"123\\"
      };
      export namespace codegen.Test {
          export class Foo extends il2js.NativeStruct {
              public static [TypeName] = \\"codegen.Test.Foo\\";
              static get size() { return 8 + il2js.NativeStruct.sizeof(Injected.Bar); }
              public static fieldNames: string[] = [\\"value\\"];
              public get value(): Injected.Bar {
                  return this.readField(8, Injected.Bar, 1);
              }
              public static staticMethods = {};
          }
      }",
      ]
    `);
  });
});
