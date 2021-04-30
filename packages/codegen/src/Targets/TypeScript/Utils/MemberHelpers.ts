import ts, { factory } from 'typescript';
import { addressToNumber } from '@il2js/core';
import { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../../Types';
// eslint-disable-next-line import/no-cycle
import { generateFieldAccessor } from './FieldHelpers';
// eslint-disable-next-line import/no-cycle
import { fixName, generateInheritanceReference, generateTypePath } from './TypeNameHelpers';
import { TsGenContext } from '../TsGenContext';
import { BuiltinTypes } from './Constants';

export function generateSizeProperty(
  typeDef: Il2CppTypeDefinitionInfo,
  context: TsGenContext,
  relativeTo?: Il2CppTypeInfo
): ts.ClassElement {
  const lastField = typeDef.Fields?.[typeDef.Fields.length - 1];
  const lastOffset = lastField?.Offset ?? 0;
  const lastFieldProperty: ts.PropertyAccessExpression | ts.Identifier | undefined =
    lastField && generateTypePath(lastField.Type, factory.createPropertyAccessExpression, context, relativeTo);

  const returnExpression =
    lastField && lastFieldProperty
      ? factory.createBinaryExpression(
          factory.createNumericLiteral(lastOffset),
          factory.createToken(ts.SyntaxKind.PlusToken),
          lastField.Type.Indirection > 1
            ? factory.createNumericLiteral(8)
            : factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('il2js'),
                    factory.createIdentifier('NativeStruct')
                  ),
                  factory.createIdentifier('sizeof')
                ),
                undefined,
                [lastField.Type.IsPrimitive ? factory.createStringLiteral(lastField.Type.TypeName) : lastFieldProperty]
              )
        )
      : factory.createNumericLiteral(0);

  return factory.createGetAccessorDeclaration(
    undefined,
    [factory.createModifier(ts.SyntaxKind.StaticKeyword)],
    factory.createIdentifier('size'),
    [],
    undefined,
    factory.createBlock([factory.createReturnStatement(returnExpression)], false)
  );
}

export function generateNameProperty(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext): ts.ClassElement {
  return factory.createPropertyDeclaration(
    undefined,
    factory.createModifiersFromModifierFlags(ts.ModifierFlags.Public | ts.ModifierFlags.Static),
    factory.createComputedPropertyName(factory.createIdentifier('TypeName')),
    undefined,
    undefined,
    factory.createStringLiteral(context.types.getTypeName(typeDef.Type, context))
  );
}

export function generateAddressProperty(typeDef: Il2CppTypeDefinitionInfo): ts.ClassElement | undefined {
  return typeDef.Type.Address
    ? factory.createPropertyDeclaration(
        undefined,
        factory.createModifiersFromModifierFlags(ts.ModifierFlags.Public | ts.ModifierFlags.Static),
        factory.createIdentifier('address'),
        undefined,
        undefined,
        factory.createNumericLiteral(addressToNumber(typeDef.Type.Address))
      )
    : undefined;
}

export function writeFieldNameList(
  { Fields, Type }: Il2CppTypeDefinitionInfo,
  context: TsGenContext
): ts.PropertyDeclaration {
  const elements: ts.Expression[] = [];
  if (Type.BaseType) {
    elements.push(
      factory.createSpreadElement(
        factory.createPropertyAccessExpression(
          generateTypePath(Type.BaseType, factory.createPropertyAccessExpression, context, Type),
          factory.createIdentifier('fieldNames')
        )
      )
    );
  }

  if (Fields) {
    for (const { Name } of Fields) {
      elements.push(factory.createStringLiteral(fixName(Name)));
    }
  }
  return factory.createPropertyDeclaration(
    undefined,
    factory.createModifiersFromModifierFlags(ts.ModifierFlags.Public | ts.ModifierFlags.Static),
    factory.createIdentifier('fieldNames'),
    undefined,
    factory.createArrayTypeNode(factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
    factory.createArrayLiteralExpression(elements, false)
  );
}

export function writeFunctions(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext) {
  const fns =
    context.typeFunctions[
      // hack: omit root namespace for this name since the original datasource isn't prefixed
      context.types.getTypeName(typeDef.Type, { ...context, rootNamespace: '' }, undefined /* relativeTo */)
    ] ?? [];

  const uniqueNames = new Map<string, number>();
  const elements: ts.ObjectLiteralElementLike[] = [];
  if (typeDef.Type.BaseType) {
    elements.push(
      factory.createSpreadAssignment(
        factory.createPropertyAccessExpression(
          generateTypePath(typeDef.Type.BaseType, factory.createPropertyAccessExpression, context, typeDef.Type),
          factory.createIdentifier('staticMethods')
        )
      )
    );
  }

  for (const fn of fns) {
    let name = `${fn.TypeArgs ?? ''}${fn.Name}`;
    if (!uniqueNames.has(name)) {
      uniqueNames.set(name, 1);
    } else {
      const nDuplicates = uniqueNames.get(name)!;
      uniqueNames.set(name, nDuplicates + 1);
      name += `_${nDuplicates}`;
    }

    elements.push(
      factory.createPropertyAssignment(
        factory.createStringLiteral(name),
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createNewExpression(factory.createIdentifier('il2js.MethodInfo'), undefined, [
            factory.createNumericLiteral(fn.Address),
          ])
        )
      )
    );
  }
  return factory.createPropertyDeclaration(
    undefined,
    factory.createModifiersFromModifierFlags(ts.ModifierFlags.Public | ts.ModifierFlags.Static),
    factory.createIdentifier('staticMethods'),
    undefined,
    undefined,
    factory.createObjectLiteralExpression(elements, true)
  );
}

export function generateConstructor(typeDef: Il2CppTypeDefinitionInfo): ts.ClassElement[] {
  if (!typeDef.Type.TemplateArgumentNames?.length) {
    return [];
  }
  const addressParameter = factory.createParameterDeclaration(
    undefined,
    undefined,
    undefined,
    factory.createIdentifier('address'),
    undefined,
    factory.createTypeReferenceNode('Address'),
    undefined
  );
  const constructorArguments: ts.ParameterDeclaration[] = [];
  let n = 0;
  for (const TName of typeDef.Type.TemplateArgumentNames) {
    constructorArguments.push(
      factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier(`_t${n++}`),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier(TName), undefined),
        factory.createAsExpression(
          factory.createTypeOfExpression(factory.createIdentifier('il2js.UnknownObject')),
          factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        )
      )
    );
  }
  return [
    // factory.createConstructorDeclaration(undefined, undefined, [addressParameter], undefined),
    factory.createConstructorDeclaration(
      undefined,
      undefined,
      [addressParameter, ...constructorArguments],
      factory.createBlock([
        factory.createExpressionStatement(
          factory.createCallExpression(factory.createSuper(), undefined, [factory.createIdentifier('address')])
        ),
      ])
    ),
  ];
}

export function generateClassData(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext) {
  const type = typeDef.Type;

  const heritage = [generateInheritanceReference(type.BaseType ?? BuiltinTypes.NativeStruct, context)];
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const members = generateMembers(typeDef, context);

  const typeParameters = type.TemplateArgumentNames?.length
    ? type.TemplateArgumentNames.map((name) =>
        factory.createTypeParameterDeclaration(
          name,
          undefined,
          factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
        )
      )
    : undefined;

  const className = factory.createIdentifier(fixName(type.TypeName));

  return { className, typeParameters, heritage, members };
}

export function generateClassExpression(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext): ts.ClassExpression {
  const { className, typeParameters, heritage, members } = generateClassData(typeDef, context);

  const classExpr = factory.createClassExpression(undefined, undefined, className, typeParameters, heritage, members);

  return classExpr;
}

export function generateNestedTypes(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext): ts.ClassElement[] {
  if (!typeDef.NestedTypes) {
    return [];
  }
  return typeDef.NestedTypes.map((nestedTypeDef) =>
    factory.createPropertyDeclaration(
      undefined,
      [factory.createModifier(ts.SyntaxKind.PublicKeyword), factory.createModifier(ts.SyntaxKind.StaticKeyword)],
      factory.createIdentifier(fixName(nestedTypeDef.Type.TypeName)),
      undefined,
      undefined,
      generateClassExpression(nestedTypeDef, context)
    )
  );
}

export function generateMembers(
  typeDef: Il2CppTypeDefinitionInfo,
  context: TsGenContext,
  ...addMembers: readonly ts.ClassElement[]
): ts.ClassElement[] {
  const { Fields, StaticFields } = typeDef;

  const members: ts.ClassElement[] = [
    generateNameProperty(typeDef, context),
    generateSizeProperty(typeDef, context, typeDef.Type),
    generateAddressProperty(typeDef),
    writeFieldNameList(typeDef, context),
    ...generateConstructor(typeDef),
    ...addMembers,
    ...generateNestedTypes(typeDef, context),
  ].filter(Boolean) as ts.ClassElement[];

  if (Fields) {
    members.push(...Fields.map((field) => generateFieldAccessor(field, context, typeDef.Type, false /* isStatic */)));
  }
  if (StaticFields) {
    members.push(
      ...StaticFields.map((field) => generateFieldAccessor(field, context, typeDef.Type, true /* isStatic */))
    );
  }
  const functionMember = writeFunctions(typeDef, context);
  if (functionMember) {
    members.push(functionMember);
  }
  // if (StaticMethods) {
  //   members.push(...StaticMethods.map(generateStaticMethodInfo));
  // }
  return members;
}
