import ts, { factory } from 'typescript';
import multimatch from 'multimatch';
import toposort from 'toposort';
import { Il2JsonFile, Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../Types';
import { TargetOptions } from '../TargetOptions';
import { generateClass } from './Utils/StructHelpers';
import { getQualifiedTypeName } from './Utils/TypeNameHelpers';
import { TsGenContext } from './TsGenContext';

export interface Namespace {
  name: string;
  childNamespaces: Namespace[];
  childTypes: Il2CppTypeDefinitionInfo[];
}

const defaultOpts: TargetOptions = {
  typeNameGlobs: ['*', '!*.<*', '!*=*'],
  rootNamespace: 'codegen',
};

function orderTypes(typeDef: Il2CppTypeDefinitionInfo[], context: TsGenContext): Il2CppTypeDefinitionInfo[] {
  const allStructs = new Map<string, Il2CppTypeDefinitionInfo>(
    typeDef.map<[string, Il2CppTypeDefinitionInfo]>((struct) => [getQualifiedTypeName(struct.Type, context), struct])
  );

  const edges = typeDef
    .filter((s) => s.Type.BaseType && s.Type.TypeIndex !== s.Type.BaseType.TypeIndex)
    .map<[Il2CppTypeDefinitionInfo, Il2CppTypeDefinitionInfo]>((s) => [
      allStructs.get(getQualifiedTypeName(s.Type.BaseType!, context))!,
      allStructs.get(getQualifiedTypeName(s.Type, context))!,
    ])
    .filter((edge) => edge[0] && edge[1]);

  return toposort.array(typeDef, edges);
}

async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function generateFlatCode(
  types: Il2CppTypeDefinitionInfo[],
  context: TsGenContext,
  progressCallback: ((n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void) | undefined
): Promise<ts.Statement[]> {
  const orderedTypes = types; // orderTypes(types, context); // should already be ordered before entering
  const result: ts.Statement[] = [];
  let n = 10;
  for (const typeDef of orderedTypes) {
    progressCallback?.(n++, types.length + 10, typeDef.Type.TypeName, typeDef);
    result.push(
      factory.createModuleDeclaration(
        undefined,
        [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier([context.rootNamespace, typeDef.Type.Namespace].filter(Boolean).join('.')),
        factory.createModuleBlock([generateClass(typeDef, context)]),
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

function filterStructs(structs: Il2CppTypeDefinitionInfo[], opts: TargetOptions) {
  return structs.filter((si) => {
    // remove invalid named structs
    if (si.Type.TypeName.indexOf('<') > -1) {
      return false;
    }
    if (si.IsGenericInstance) {
      return false;
    }
    const imageFilter = opts.imageGlobs && si.ImageName && multimatch(si.ImageName, opts.imageGlobs);
    const namespaceFilter =
      opts.namespaceGlobs &&
      multimatch(si.Type.Namespace === undefined ? '<global>' : si.Type.Namespace, opts.namespaceGlobs);
    const typeNameFilter = opts.typeNameGlobs && multimatch(si.Type.TypeName, opts.typeNameGlobs);
    if (imageFilter && imageFilter.length === 0) {
      return false;
    }
    if (namespaceFilter && namespaceFilter.length === 0) {
      return false;
    }
    if (typeNameFilter && typeNameFilter.length === 0) {
      return false;
    }
    return true;
  });
}
export async function generateFileAsync(
  { TypeInfoList, TypeNameToStaticMethods }: Il2JsonFile,
  assembly: string,
  version: string,
  opts?: Partial<TargetOptions>,
  progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void
): Promise<ts.Node[]> {
  const options = { ...defaultOpts, ...opts };

  const context: TsGenContext = {
    rootNamespace: options.rootNamespace,
    typeMap: new Map(),
    typeFunctions: TypeNameToStaticMethods,
  };

  let n = 0;
  progressCallback?.(n++, TypeInfoList.length + 10, 'Ordering dependencies');
  let typesList = orderTypes(TypeInfoList, context);

  progressCallback?.(n++, TypeInfoList.length + 10, 'Nesting types');
  typesList = processNestedStructs(typesList);

  progressCallback?.(n++, TypeInfoList.length + 10, 'Filtering input');
  typesList = filterStructs(typesList, options);

  progressCallback?.(n++, typesList.length + 10, 'Removing empty types');

  // build type map
  for (const type of typesList) {
    context.typeMap.set(getQualifiedTypeName(type.Type, context), type.Type);
    if (type.NestedTypes) {
      for (const nestedType of type.NestedTypes) {
        context.typeMap.set(getQualifiedTypeName(nestedType.Type, context), nestedType.Type);
      }
    }
  }

  // const exportedTypes = await generateCodeGroupedByNamespace(filteredTypes, context, progressCallback);
  const exportedTypes = await generateFlatCode(typesList, context, progressCallback);

  return [
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('il2js')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('System')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Address')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('TypeName')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('bindTypeArgs')),
        ])
      ),
      factory.createStringLiteral('@il2js/core')
    ),
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
