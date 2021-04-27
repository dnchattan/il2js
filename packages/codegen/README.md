# @il2js/codegen

This package provides the capability of generating TypeScript code for a list of types defined in JSON format. It is intended to be used in conjunction with the output from this [Il2CppDumper fork](https://github.com/dnchattan/Il2CppDumper).

## Usage

Currently this tool can only be used as an API:

```ts
import { codegen, GameAssembly } from '@il2js/codegen';

await codegen({
  // Provide unity gasm references here:
  //  * These resources will automatically be processed using `Il2CppDumper` and stored in `<cache-dir>`
  //  * If the version number matches the last run, and Il2CppDumper hasn't been updated, the results will be re-used
  //    (delete cache dir to force re-generation)
  gasm: new GameAssembly('<path-to-GameAssembly.dll>', '<path-to-globalMetadata.dat>', '<version-number>', '<cache-dir>'),
  output: {
    // output entrypoint file
    entry: 'index.ts',
    // output directory
    outputDir: 'out',
  },
  targets: [
    [
      'typescript',
      { rootNamespace: 'codegen' }
    ]
  ],
})
```

Running `codegen` will emit the generated file(s) in the specified `outputDir` directory, with the `entry` file used as the main entrypoint that would be included by another project to consume it.

### Adding more types

When `il2js` sees a type it doesn't understand, it will omit it. If you want to provide your own implementation for some types, you may inject them using the `types` option. 

This array accepts either a string or a structure containing the package information and contents. If a string is passed, it will be `require`'d during compilation and it's `typeExport` export will be 
used for the root of all types added to the registry.

```ts
await codegen({
  /* ... */
  types: [
    // this package must emit exported types via `typeExport` symbol (e.g.  export const typeExport { MyNamespace1, MyNamespace2 } )
    'custom-il2js-types',
    {
      // your types will be imported from this path in the generated code
      from: './customTypes', 
      // these types will be added to the type registry when generating code, and may be referenced via the 
      // import above. 
      types: { 
        Injected: { 
          Bar: (class CustomType extends il2js.NativeStruct {
            /* ... */
          })
        }
      }
    }
  ]
});
```

### Modifying types
If you need to inject substitution types, or modify the generated types, you can install a visitor to process each type. Returning undefined will result in that
type or the member using it to be omitted from the generated code.

```ts
await codegen({
  /* ... */
  targets: [
    [
      'typescript',
      {
        rootNamespace: 'codegen',
        visitors: {
          // called for each concrete type wrapper that gets emitted
          class(type) {
            if (type.Type.TypeName === 'Bar' && type.Type.Namespace === 'Test') {
              return undefined;
            }
            return type;
          },
          // called for each type when it is used
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
};
```

