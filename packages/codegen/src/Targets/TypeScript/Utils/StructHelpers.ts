/* eslint-disable no-param-reassign */
import ts, { factory } from 'typescript';
import { excludeUndefined, NativeType } from '@il2js/core';
import type { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../../Types';
import { BuiltinTypes } from './Constants';
// eslint-disable-next-line import/no-cycle
import { generateClassData } from './MemberHelpers';
// eslint-disable-next-line import/no-cycle
import { getQualifiedTypeName } from './TypeNameHelpers';
import { TsGenContext } from '../TsGenContext';

export function findKnownType(type: Il2CppTypeInfo, context: TsGenContext): NativeType | undefined {
  return context.types.findType(type);
}

export function isTypeUsable(type: Il2CppTypeInfo, context: TsGenContext): boolean {
  if (type.IsPrimitive) {
    return true;
  }
  const name = getQualifiedTypeName(type, context);
  if (!BuiltinTypes[name as keyof typeof BuiltinTypes] && !context.typeMap.has(name) && !findKnownType(type, context)) {
    return false;
  }
  if (type.TypeArguments?.length) {
    return type.TypeArguments.every((t) => isTypeUsable(t, context));
  }
  return true;
}

export function fixupType(typeDef: Il2CppTypeInfo): Il2CppTypeInfo {
  if (typeDef.IsArray) {
    typeDef.IsArray = false; // don't recurse :)
    typeDef = BuiltinTypes.ManagedArray(typeDef);
  }
  if (typeDef.IsPrimitive && typeDef.TypeName === 'object') {
    return BuiltinTypes.UnknownObject;
  }
  if (typeDef.TypeArguments) {
    typeDef.TypeArguments = typeDef.TypeArguments.map((typeArg) => fixupType(typeArg));
  }
  return typeDef;
}

export function visitType(typeDef: Il2CppTypeInfo, context: TsGenContext): Il2CppTypeInfo | undefined {
  let result: Il2CppTypeInfo | undefined = typeDef;
  result.IsGenerated = true;
  if (context.visitors?.typeRef) {
    result = context.visitors.typeRef(result, context);
  }
  if (!result) return undefined;
  if (result.BaseType && !isTypeUsable(result.BaseType, context)) {
    result.BaseType = undefined;
  }
  if (result.DeclaringType && !isTypeUsable(result.DeclaringType, context)) {
    result.DeclaringType = undefined;
  }
  if (result.TypeArguments) {
    result.TypeArguments = result.TypeArguments.map((typeArg) => fixupType(typeArg));
  }
  return fixupType(result);
}

export function visitClass(
  typeDef: Il2CppTypeDefinitionInfo,
  context: TsGenContext
): Il2CppTypeDefinitionInfo | undefined {
  let result: Il2CppTypeDefinitionInfo | undefined = typeDef;
  if (context.visitors?.class) {
    result = context.visitors.class(result, context);
  }
  if (!result) return undefined;
  const type = visitType(result.Type, context);
  if (!type) return undefined;
  result.Type = type;
  if (result.Fields) {
    // MODIFY and filter:
    result.Fields = result.Fields.filter((field) => {
      const fieldType = visitType(field.Type, context);
      if (!fieldType) {
        return false;
      }
      field.Type = fieldType;
      return isTypeUsable(field.Type, context);
    });
  }
  if (result.StaticFields) {
    result.StaticFields = result.StaticFields.filter((field) => {
      const fieldType = visitType(field.Type, context);
      if (!fieldType) {
        return false;
      }
      field.Type = fieldType;
      return isTypeUsable(field.Type, context);
    });
  }
  if (result.NestedTypes) {
    result.NestedTypes = excludeUndefined(result.NestedTypes.map((nestedType) => visitClass(nestedType, context)));
  }
  return result;
}

export function generateClass(
  typeDef: Il2CppTypeDefinitionInfo,
  context: TsGenContext
): ts.ClassDeclaration | undefined {
  const def = context ? visitClass(typeDef, context) : typeDef;
  if (!def) {
    return undefined;
  }
  const { className, typeParameters, heritage, members } = generateClassData(typeDef, context);

  const classDecl = factory.createClassDeclaration(
    undefined,
    factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
    className,
    typeParameters,
    heritage,
    members
  );

  return classDecl;
}
