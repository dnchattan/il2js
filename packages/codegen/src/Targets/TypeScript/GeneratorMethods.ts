import ts, { factory } from 'typescript';
import toposort from 'toposort';
import { DefaultedMap } from '@il2js/core';
import type { Il2JsonFile, Il2CppTypeDefinitionInfo, Il2CppTypeInfo, ITypeRegistry, Il2JsConfig } from '../..';
import { generateClass } from './Utils/StructHelpers';
import type { CodegenContext } from '../CodegenContext';

export interface Namespace {
  name: string;
  childNamespaces: Namespace[];
  childTypes: Il2CppTypeDefinitionInfo[];
}

function orderTypes(typeDef: Il2CppTypeDefinitionInfo[], context: CodegenContext): Il2CppTypeDefinitionInfo[] {
  const allStructs = new Map<string, Il2CppTypeDefinitionInfo>(
    typeDef.map<[string, Il2CppTypeDefinitionInfo]>((struct) => [
      context.types.getTypeName(struct.Type, context),
      struct,
    ])
  );

  const edges = typeDef
    .filter((s) => s.Type.BaseType && s.Type.TypeIndex !== s.Type.BaseType.TypeIndex)
    .map<[Il2CppTypeDefinitionInfo, Il2CppTypeDefinitionInfo]>((s) => [
      allStructs.get(context.types.getTypeName(s.Type.BaseType!, context))!,
      allStructs.get(context.types.getTypeName(s.Type, context))!,
    ])
    .filter((edge) => edge[0] && edge[1]);

  return toposort.array(typeDef, edges);
}

async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function generateFlatCode(
  types: Il2CppTypeDefinitionInfo[],
  context: CodegenContext,
  progressCallback: ((n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void) | undefined
): Promise<ts.Statement[]> {
  const orderedTypes = types; // orderTypes(types, context); // should already be ordered before entering
  const result: ts.Statement[] = [];
  let n = 10;
  for (const typeDef of orderedTypes) {
    progressCallback?.(n++, types.length + 10, typeDef.Type.TypeName, typeDef);
    const block = generateClass(typeDef, context);
    if (!block) {
      continue;
    }
    result.push(
      factory.createModuleDeclaration(
        undefined,
        [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier([context.rootNamespace, typeDef.Type.Namespace].filter(Boolean).join('.')),
        factory.createModuleBlock([block]),
        ts.NodeFlags.Namespace
      )
    );
    // eslint-disable-next-line no-await-in-loop
    if (n % 100 === 0) await sleep(100);
  }
  return result;
}

export function groupStructsByNamespace(typeDefs: Il2CppTypeDefinitionInfo[]): Namespace {
  const root: Namespace = { name: 'global', childNamespaces: [], childTypes: [] };
  function forNS(ns: string | undefined): Namespace {
    if (!ns) {
      return root;
    }
    let result = root.childNamespaces.find((child) => child.name === ns);
    if (!result) {
      result = { name: ns, childTypes: [], childNamespaces: [] };
      root.childNamespaces.push(result);
    }
    return result;
  }
  for (const typeDef of typeDefs) {
    const nsObj = forNS(typeDef.Type.Namespace);
    nsObj.childTypes.push(typeDef);
  }
  return root;
}

function scopeTypeToDeclaringType(type?: Il2CppTypeInfo) {
  if (!type?.DeclaringType) {
    return;
  }
  scopeTypeToDeclaringType(type.BaseType);
  type.TypeArguments?.forEach(scopeTypeToDeclaringType);
  // eslint-disable-next-line no-param-reassign
  type.Namespace = type.DeclaringType.Namespace;
  // eslint-disable-next-line no-param-reassign
  type.TypeName = `${type.DeclaringType.TypeName}_${type.TypeName}`;
  // eslint-disable-next-line no-param-reassign
  delete type.DeclaringType;
}

export function processNestedStructs(structs: Il2CppTypeDefinitionInfo[]): Il2CppTypeDefinitionInfo[] {
  for (const struct of structs) {
    scopeTypeToDeclaringType(struct.Type);
    struct.Fields?.forEach((field) => scopeTypeToDeclaringType(field.Type));
    struct.StaticFields?.forEach((field) => scopeTypeToDeclaringType(field.Type));
  }
  return structs;
}

function filterStructs(structs: Il2CppTypeDefinitionInfo[]) {
  return structs.filter((si) => {
    // remove invalid named structs
    if (si.Type.TypeName.indexOf('<') > -1) {
      return false;
    }
    if (si.IsGenericInstance) {
      return false;
    }
    return true;
  });
}
export async function generateFileAsync(
  { TypeInfoList, TypeNameToStaticMethods }: Il2JsonFile,
  assembly: string,
  version: string,
  types: ITypeRegistry,
  opts: Il2JsConfig,
  progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void
): Promise<ts.Node[]> {
  const context: CodegenContext = {
    rootNamespace: opts.rootNamespace ?? 'codegen',
    typeFunctions: TypeNameToStaticMethods,
    types,
  };

  let n = 0;
  progressCallback?.(n++, TypeInfoList.length + 10, 'Ordering dependencies');
  let typesList = orderTypes(TypeInfoList, context);

  progressCallback?.(n++, TypeInfoList.length + 10, 'Nesting types');
  typesList = processNestedStructs(typesList);

  progressCallback?.(n++, TypeInfoList.length + 10, 'Filtering input');
  typesList = filterStructs(typesList);

  progressCallback?.(n++, typesList.length + 10, 'Removing empty types');

  // add to type registry
  types.addTypeDefs(typesList);

  const exportedTypes = await generateFlatCode(typesList, context, progressCallback);

  const imports = new DefaultedMap<string, string[]>(() => []);
  imports.get('@il2js/core').push('Address', 'TypeName', 'bindTypeArgs');
  for (const [names, from] of context.types.imports) {
    imports.get(from).push(...names);
  }

  const importDecls: ts.ImportDeclaration[] = [];
  for (const [from, names] of imports.entries()) {
    importDecls.push(
      factory.createImportDeclaration(
        undefined,
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports(
            names.map((name) => factory.createImportSpecifier(undefined, factory.createIdentifier(name)))
          )
        ),
        factory.createStringLiteral(from)
      )
    );
  }

  return [
    ...importDecls,
    factory.createVariableStatement(
      factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier('GameAssemblyInfo'),
            undefined,
            undefined,
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('assemblyName'),
                  factory.createStringLiteral(assembly)
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('version'),
                  factory.createStringLiteral(version)
                ),
              ],
              true
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ...exportedTypes,
  ];
}
