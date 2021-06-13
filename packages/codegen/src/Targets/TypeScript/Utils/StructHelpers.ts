/* eslint-disable no-param-reassign */
import ts, { factory } from 'typescript';
import { excludeUndefined, NativeTypeCodegenDescriptor } from '@il2js/core';
import type { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../../Types';
import { BuiltinTypes } from './Constants';
// eslint-disable-next-line import/no-cycle
import { generateClassData } from './MemberHelpers';
// eslint-disable-next-line import/no-cycle
import { CodegenContext } from '../../CodegenContext';

export function findKnownType(type: Il2CppTypeInfo, context: CodegenContext): NativeTypeCodegenDescriptor | undefined {
  return context.types.findType(type);
}

export function isTypeUsable(type: Il2CppTypeInfo, context: CodegenContext): boolean {
  if (type.IsPrimitive) {
    return true;
  }
  const name = context.types.getTypeName(type, context);
  if (!BuiltinTypes[name as keyof typeof BuiltinTypes] && !context.types.hasType(type)) {
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

export function visitType(typeDef: Il2CppTypeInfo, context: CodegenContext): Il2CppTypeInfo | undefined {
  if (!typeDef) return undefined;
  if (typeDef.BaseType && !isTypeUsable(typeDef.BaseType, context)) {
    typeDef.BaseType = undefined;
  }
  if (typeDef.DeclaringType && !isTypeUsable(typeDef.DeclaringType, context)) {
    typeDef.DeclaringType = undefined;
  }
  if (typeDef.TypeArguments) {
    typeDef.TypeArguments = typeDef.TypeArguments.map((typeArg) => fixupType(typeArg));
  }
  return fixupType(typeDef);
}

export function visitClass(
  typeDef: Il2CppTypeDefinitionInfo,
  context: CodegenContext
): Il2CppTypeDefinitionInfo | undefined {
  if (!typeDef) return undefined;
  const type = visitType(typeDef.Type, context);
  if (!type) return undefined;
  typeDef.Type = type;
  if (typeDef.Fields) {
    // MODIFY and filter:
    typeDef.Fields = typeDef.Fields.filter((field) => {
      const fieldType = visitType(field.Type, context);
      if (!fieldType) {
        return false;
      }
      field.Type = fieldType;
      return isTypeUsable(field.Type, context);
    });
  }
  if (typeDef.StaticFields) {
    typeDef.StaticFields = typeDef.StaticFields.filter((field) => {
      const fieldType = visitType(field.Type, context);
      if (!fieldType) {
        return false;
      }
      field.Type = fieldType;
      return isTypeUsable(field.Type, context);
    });
  }
  if (typeDef.NestedTypes) {
    typeDef.NestedTypes = excludeUndefined(typeDef.NestedTypes.map((nestedType) => visitClass(nestedType, context)));
  }
  return typeDef;
}

export function generateClass(
  typeDef: Il2CppTypeDefinitionInfo,
  context: CodegenContext
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
