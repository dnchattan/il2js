import ts, { factory } from 'typescript';
import { assert } from '@il2js/core';
import { TsGenContext } from '../TsGenContext';
import { Il2CppTypeInfo } from '../../../Types';
// eslint-disable-next-line import/no-cycle
import { findKnownType } from './StructHelpers';
import { getTypeMapping } from '../TypeMappings';

const reservedNames = new Set(['name', 'size']);

export function fixName(name: string): string {
  // eslint-disable-next-line no-useless-escape
  const fixedName = name.replace(/[<>\[\]=,\s|\.]/g, '_');
  if (reservedNames.has(fixedName)) {
    return `_${fixedName}`;
  }
  return /* PrimitiveTypeMapping[fixedName as keyof typeof PrimitiveTypeMapping] ?? */ fixedName;
}

export function getQualifiedTypeName(
  typeDef: Il2CppTypeInfo,
  context: TsGenContext,
  relativeToType?: Il2CppTypeInfo,
  includeRootNamespace: boolean = true
): string {
  const relativeTo =
    relativeToType &&
    (relativeToType.Namespace ? relativeToType.Namespace : getQualifiedTypeName(relativeToType, context));
  if (typeDef.Namespace?.startsWith('il2js') || typeDef.Namespace?.startsWith('System')) {
    return [typeDef.Namespace, fixName(typeDef.TypeName)].filter(Boolean).join('.');
  }
  assert(
    !(typeDef.Namespace && typeDef.DeclaringType),
    `Not expected to have both a namespace ('${typeDef.Namespace}' AND a declaring type ('${typeDef.DeclaringType?.Namespace}.${typeDef.DeclaringType?.TypeName}'))`
  );
  const ns = [
    typeDef.IsGenerated && includeRootNamespace ? context.rootNamespace : undefined,
    typeDef.DeclaringType?.Namespace,
    typeDef.DeclaringType?.TypeName,
    typeDef.Namespace,
  ]
    .filter(Boolean)
    .join('.');
  const fullyQualifiedName = [ns, fixName(typeDef.TypeName)].filter(Boolean).join('.');
  if (ns === relativeTo || fullyQualifiedName === relativeTo) {
    return fixName(typeDef.TypeName);
  }
  return fullyQualifiedName;
}

export function generateTypePath<TResult, T extends (left: any, right: any) => TResult>(
  type: Il2CppTypeInfo,
  factoryFn: T,
  context: TsGenContext,
  relativeTo?: Il2CppTypeInfo
): TResult | ts.Identifier {
  const nameParts = getQualifiedTypeName(type, context, relativeTo).split('.');
  let cursor: ts.Identifier | TResult = factory.createIdentifier(nameParts.splice(0, 1)[0]);
  while (nameParts.length > 0) {
    cursor = factoryFn(cursor, factory.createIdentifier(fixName(nameParts.splice(0, 1)[0])));
  }
  return cursor;
}

export function generateTypeReference(
  type: Il2CppTypeInfo,
  context: TsGenContext,
  relativeTo: Il2CppTypeInfo | undefined
): ts.TypeReferenceNode | ts.LiteralTypeNode | ts.TypeQueryNode {
  if (type.IsPrimitive) {
    return factory.createTypeReferenceNode(getTypeMapping(type.TypeName));
  }

  const returnTypeType = findKnownType(type, context);
  const returnTypeName = returnTypeType?.boxedValue;
  if (returnTypeName) {
    return factory.createTypeReferenceNode(returnTypeName);
  }

  const typeArguments = type.TypeArguments?.length
    ? type.TypeArguments.map((argType) => generateTypeReference(argType, context, relativeTo))
    : undefined;

  return factory.createTypeReferenceNode(
    generateTypePath(type, factory.createQualifiedName, context, relativeTo),
    typeArguments
  );
}

export function generateInheritanceReference(type: Il2CppTypeInfo, context: TsGenContext): ts.HeritageClause {
  const typeArguments = type.TypeArguments?.length
    ? type.TypeArguments.map((argType) => generateTypeReference(argType, context, type))
    : undefined;
  return factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
    factory.createExpressionWithTypeArguments(
      generateTypePath(type, factory.createPropertyAccessExpression, context),
      typeArguments
    ),
  ]);
}
