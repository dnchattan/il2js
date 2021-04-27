/* eslint-disable no-param-reassign */
/* eslint-disable max-classes-per-file */
import { il2js } from '@il2js/core';
import { codegen } from './Codegen';
import { IGameAssembly } from './IGameAssembly';
import { mockIl2CppTypeDefinitionInfo, mockIl2CppTypeInfo } from './Types';

describe('codegen', () => {
  it('with no typelib', async () => {
    const writeFile: jest.Mock<Promise<void>, [path: string, value: string | Buffer]> = jest.fn((_path, _value) =>
      Promise.resolve()
    );
    const load: jest.Mock<Promise<void>, []> = jest.fn();
    const gasm: IGameAssembly = {
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
                  Type: mockIl2CppTypeInfo({ TypeName: 'int', Indirection: 1, IsPrimitive: true }),
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
    await codegen({
      gasm,
      output: {
        entry: 'index.ts',
        outputDir: 'out',
      },
      targets: [['typescript', { rootNamespace: 'codegen' }]],
      api: { writeFile },
      types: [],
    });
    expect(writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "out\\\\index.ts",
        "import { Address, TypeName, bindTypeArgs, il2js, System } from \\"@il2js/core\\";
      export const GameAssemblyInfo = {
          assemblyName: \\"TestGameAssembly.dll\\",
          version: \\"123\\"
      };
      export namespace codegen.Test {
          export class Foo extends il2js.NativeStruct {
              public static [TypeName] = \\"codegen.Test.Foo\\";
              static get size() { return 8 + il2js.NativeStruct.sizeof(\\"int\\"); }
              public static fieldNames: string[] = [\\"value\\"];
              public get value(): number {
                  return this.readTypePrimitive(8, \\"int\\", 1);
              }
              public static staticMethods = {};
          }
      }",
      ]
    `);
  });
  it('with custom typelib', async () => {
    class CustomType extends il2js.NativeStruct {
      public static size = 0;
      public static fieldNames: string[] = [];
    }
    const writeFile: jest.Mock<Promise<void>, [path: string, value: string | Buffer]> = jest.fn((_path, _value) =>
      Promise.resolve()
    );
    const load: jest.Mock<Promise<void>, []> = jest.fn();
    const gasm: IGameAssembly = {
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
    await codegen({
      gasm,
      output: {
        entry: 'index.ts',
        outputDir: 'out',
      },
      targets: [['typescript', { rootNamespace: 'codegen' }]],
      api: { writeFile },
      types: [{ from: './customTypes', types: { Custom: { Namespace: { CustomType } } } }],
    });
    expect(writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "out\\\\index.ts",
        "import { Address, TypeName, bindTypeArgs, il2js, System } from \\"@il2js/core\\";
      import { Custom } from \\"./customTypes\\";
      export const GameAssemblyInfo = {
          assemblyName: \\"TestGameAssembly.dll\\",
          version: \\"123\\"
      };
      export namespace codegen.Test {
          export class Foo extends il2js.NativeStruct {
              public static [TypeName] = \\"codegen.Test.Foo\\";
              static get size() { return 8 + il2js.NativeStruct.sizeof(codegen.Custom.Namespace.CustomType); }
              public static fieldNames: string[] = [\\"value\\"];
              public get value(): codegen.Custom.Namespace.CustomType {
                  return this.readField(8, codegen.Custom.Namespace.CustomType, 1);
              }
              public static staticMethods = {};
          }
      }",
      ]
    `);
  });
  it('inject with custom type override', async () => {
    class CustomType extends il2js.NativeStruct {
      public static size = 0;
      public static fieldNames: string[] = [];
    }
    const writeFile: jest.Mock<Promise<void>, [path: string, value: string | Buffer]> = jest.fn((_path, _value) =>
      Promise.resolve()
    );
    const load: jest.Mock<Promise<void>, []> = jest.fn();
    const gasm: IGameAssembly = {
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
    await codegen({
      gasm,
      output: {
        entry: 'index.ts',
        outputDir: 'out',
      },
      targets: [
        [
          'typescript',
          {
            rootNamespace: 'codegen',
            visitors: {
              class(type) {
                if (type.Type.TypeName === 'Bar' && type.Type.Namespace === 'Test') {
                  return undefined;
                }
                return type;
              },
              typeRef(type) {
                if (type.TypeName === 'Bar' && type.Namespace === 'Test') {
                  type.Namespace = 'Injected';
                }
                return type;
              },
            },
          },
        ],
      ],
      api: { writeFile },
      types: [{ from: './customTypes', types: { Injected: { Bar: CustomType } } }],
    });
    expect(writeFile.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "out\\\\index.ts",
        "import { Address, TypeName, bindTypeArgs, il2js, System } from \\"@il2js/core\\";
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
