/* eslint-disable no-param-reassign */
import ts, { factory } from 'typescript';
import * as il2jslib from '@il2js/core';
import { NativeType } from '@il2js/core';
import { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../../Types';
import { BuiltinTypes } from './Constants';
// eslint-disable-next-line import/no-cycle
import { generateClassData } from './MemberHelpers';
// eslint-disable-next-line import/no-cycle
import { getQualifiedTypeName } from './TypeNameHelpers';
import { TsGenContext } from '../TsGenContext';

export function findKnownType(type: Il2CppTypeInfo, context: TsGenContext): NativeType | undefined {
  const namePath = getQualifiedTypeName(type, context).split('.');
  let node: any = il2jslib;
  while (namePath.length > 0) {
    const [currentNodeName] = namePath.splice(0, 1);
    if (!node[currentNodeName]) {
      return undefined;
    }
    node = node[currentNodeName];
  }
  return node;
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
  if (typeDef.TypeName === 'Fixed' && typeDef.Namespace === 'Plarium.Common.Numerics') {
    return BuiltinTypes.Fixed;
  }
  if (typeDef.TypeArguments) {
    typeDef.TypeArguments = typeDef.TypeArguments.map((typeArg) => fixupType(typeArg));
  }
  return typeDef;
}

export function trimType(typeDef: Il2CppTypeInfo, context: TsGenContext): Il2CppTypeInfo {
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

export function trimClass(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext): Il2CppTypeDefinitionInfo {
  typeDef.Type = trimType(typeDef.Type, context);
  if (typeDef.Fields) {
    for (const field of typeDef.Fields) {
      field.Type = fixupType(field.Type);
    }
    typeDef.Fields = typeDef.Fields.filter((field) => isTypeUsable(field.Type, context));
  }
  if (typeDef.StaticFields) {
    for (const field of typeDef.StaticFields) {
      field.Type = fixupType(field.Type);
    }
    typeDef.StaticFields = typeDef.StaticFields.filter((field) => isTypeUsable(field.Type, context));
  }
  if (typeDef.NestedTypes) {
    typeDef.NestedTypes = typeDef.NestedTypes.map((type) => trimClass(type, context));
  }
  return typeDef;
}

export function generateClass(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext): ts.ClassDeclaration {
  typeDef = context ? trimClass(typeDef, context) : typeDef;
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
