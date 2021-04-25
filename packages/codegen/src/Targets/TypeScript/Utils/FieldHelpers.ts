import ts, { factory } from 'typescript';
import { assert } from '@il2js/core';
import { TsGenContext } from '../TsGenContext';
import { Il2CppFieldInfo, Il2CppTypeInfo } from '../../../Types';
// eslint-disable-next-line import/no-cycle
import { fixName, generateTypePath, generateTypeReference } from './TypeNameHelpers';
import { getTypeMapping } from '../TypeMappings';

export function generateReadPrimitiveCall(field: Il2CppFieldInfo): ts.CallExpression {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createThis(), factory.createIdentifier('readTypePrimitive')),
    undefined,
    [
      // args (offset, type)
      factory.createNumericLiteral(field.Offset),
      factory.createStringLiteral(field.Type.TypeName),
      factory.createNumericLiteral(field.Type.Indirection),
    ]
  );
}

function typeArgumentsToParameters(
  typeArguments: Il2CppTypeInfo[],
  context: TsGenContext,
  relativeTo: Il2CppTypeInfo | undefined
): ts.Expression[] {
  const parameters: ts.Expression[] = [];
  for (const tArg of typeArguments) {
    if (tArg.TypeArguments?.length) {
      parameters.push(
        factory.createCallExpression(factory.createIdentifier('bindTypeArgs'), undefined, [
          generateTypePath(tArg, factory.createPropertyAccessExpression, context, relativeTo),
          ...typeArgumentsToParameters(tArg.TypeArguments, context, relativeTo),
        ])
      );
    } else if (tArg.IsPrimitive) {
      parameters.push(factory.createStringLiteral(tArg.TypeName));
    } else {
      parameters.push(generateTypePath(tArg, factory.createPropertyAccessExpression, context, relativeTo));
    }
  }
  assert(parameters.length === typeArguments.length);
  return parameters;
}

export function generateReadFieldCall(
  field: Il2CppFieldInfo,
  context: TsGenContext,
  relativeTo: Il2CppTypeInfo | undefined
): ts.CallExpression {
  const parameters: ts.Expression[] = [
    // args (offset, type)
    factory.createNumericLiteral(field.Offset),
    generateTypePath(field.Type, factory.createPropertyAccessExpression, context, relativeTo),
    factory.createNumericLiteral(field.Type.Indirection),
  ];
  if (field.Type.TypeArguments) {
    parameters.push(...typeArgumentsToParameters(field.Type.TypeArguments, context, relativeTo));
  }
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createThis(), factory.createIdentifier('readField')),
    undefined,
    parameters
  );
}

export function generateFieldAccessor(
  field: Il2CppFieldInfo,
  context: TsGenContext,
  relativeTo: Il2CppTypeInfo | undefined,
  isStatic: boolean
): ts.ClassElement {
  const isPrimitiveType = field.Type.IsPrimitive;
  const callExpr = isPrimitiveType
    ? generateReadPrimitiveCall(field)
    : generateReadFieldCall(field, context, relativeTo);
  let returnType: ts.TypeNode;
  if (isPrimitiveType) {
    returnType = factory.createTypeReferenceNode(getTypeMapping(field.Type.TypeName));
  } else {
    returnType = generateTypeReference(field.Type, context, relativeTo);
  }
  return factory.createGetAccessorDeclaration(
    undefined,
    // modifiers
    factory.createModifiersFromModifierFlags(ts.ModifierFlags.Public | (isStatic ? ts.ModifierFlags.Static : 0)),
    // field name
    fixName(field.Name),
    // parameters
    [],
    // return type
    returnType,
    // method body
    factory.createBlock([factory.createReturnStatement(callExpr)], true)
  );
}
