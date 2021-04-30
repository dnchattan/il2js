import ts, { factory } from 'typescript';
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

export function generateTypePath<TResult, T extends (left: any, right: any) => TResult>(
  type: Il2CppTypeInfo,
  factoryFn: T,
  context: TsGenContext,
  relativeTo?: Il2CppTypeInfo
): TResult | ts.Identifier {
  const nameParts = context.types.getTypeName(type, context, relativeTo).split('.');
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
