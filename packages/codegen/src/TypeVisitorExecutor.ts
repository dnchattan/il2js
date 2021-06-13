/* eslint-disable no-param-reassign */
import { excludeUndefined } from '@il2js/core';
import type { Il2CppStaticMethodInfo, Il2CppTypeDefinitionInfo } from './Types';
import type { TypeVisitor } from './Types/Compiler/TypeVisitor';

export function executeMethodVisitor(
  visitor: Readonly<TypeVisitor>,
  methods: Record<string, Il2CppStaticMethodInfo[]>
): Record<string, Il2CppStaticMethodInfo[]> {
  if (!visitor.visitStaticMethod) {
    return methods;
  }
  const result: Record<string, Il2CppStaticMethodInfo[]> = {};
  for (const [typeName, methodInfos] of Object.entries(methods)) {
    const visitorResult = excludeUndefined(
      methodInfos.map((methodInfo) => visitor.visitStaticMethod!(methodInfo, typeName))
    );
    if (visitorResult && visitorResult.length) {
      result[typeName] = visitorResult;
    }
  }
  return result;
}

export function executeVisitor(
  visitor: Readonly<TypeVisitor>,
  types: Il2CppTypeDefinitionInfo[]
): Il2CppTypeDefinitionInfo[] {
  if (visitor.visitTypeDef) {
    types = excludeUndefined(types.map(visitor.visitTypeDef));
  }
  for (const type of types) {
    if (visitor.visitTypeDef) {
      if (type.NestedTypes) {
        type.NestedTypes = executeVisitor(visitor, type.NestedTypes);
      }
    }

    if (visitor.visitField) {
      if (type.Fields) {
        type.Fields = excludeUndefined(type.Fields.map(visitor.visitField));
      }
      if (type.StaticFields) {
        type.StaticFields = excludeUndefined(type.StaticFields.map(visitor.visitField));
      }
    }
    if (visitor.visitTypeUsage) {
      if (type.Type.TypeArguments) {
        type.Type.TypeArguments = excludeUndefined(type.Type.TypeArguments.map(visitor.visitTypeUsage));
      }
      if (type.Type.BaseType) {
        type.Type.BaseType = visitor.visitTypeUsage(type.Type.BaseType);
      }
      if (type.Fields) {
        type.Fields = excludeUndefined(
          type.Fields.map((field) => {
            const fieldType = visitor.visitTypeUsage!(field.Type);
            if (fieldType) {
              field.Type = fieldType;
              return field;
            }
            return undefined;
          })
        );
      }
      if (type.StaticFields) {
        type.StaticFields = excludeUndefined(
          type.StaticFields.map((field) => {
            const fieldType = visitor.visitTypeUsage!(field.Type);
            if (fieldType) {
              field.Type = fieldType;
              return field;
            }
            return undefined;
          })
        );
      }
    }
  }
  return types;
}
