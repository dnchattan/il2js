/* eslint-disable no-cond-assign */
/* eslint-disable @typescript-eslint/no-loop-func */
import { excludeUndefined } from '@il2js/core';
import type { Il2CppTypeDefinitionInfo, Il2CppTypeInfo, Il2JsonFile } from './Types';
import { executeVisitor } from './TypeVisitorExecutor';

export function isEmpty(type: Il2CppTypeDefinitionInfo) {
  return !type.Fields?.length && !type.StaticFields?.length && !type.NestedTypes?.length;
}

export function isSame(a: Il2CppTypeInfo, b: Il2CppTypeInfo): boolean {
  return a.Namespace === b.Namespace && a.TypeName === b.TypeName;
}

function typeName(type: Il2CppTypeInfo) {
  return excludeUndefined([type.Namespace, type.TypeName]).join('.');
}

function optimizeWorker(file: Il2JsonFile): boolean {
  let hasOptimized = false;
  let types: Il2CppTypeDefinitionInfo[] = file.TypeInfoList;
  for (const type of file.TypeInfoList) {
    if (isEmpty(type)) {
      // collapse to base type?
      if (type.Type.BaseType) {
        console.info(`Collapsing empty '${typeName(type.Type)}' to base type '${typeName(type.Type.BaseType)}'`);
        types = executeVisitor(
          {
            visitTypeDef(typeDef) {
              if (isSame(type.Type, typeDef.Type)) {
                hasOptimized = true;
                return undefined;
              }
              return typeDef;
            },
            visitTypeUsage(typeUsage) {
              if (isSame(type.Type, typeUsage)) {
                hasOptimized = true;
                return type.Type.BaseType;
              }
              return typeUsage;
            },
          },
          types
        );
      } else {
        console.info(`Removing empty '${excludeUndefined([type.Type.Namespace, type.Type.TypeName]).join('.')}' type`);
        types = executeVisitor(
          {
            visitTypeDef(typeDef) {
              if (isSame(type.Type, typeDef.Type)) {
                hasOptimized = true;
                return undefined;
              }
              return typeDef;
            },
          },
          types
        );
      }
    }
  }
  // eslint-disable-next-line no-param-reassign
  file.TypeInfoList = types;
  return hasOptimized;
}

export function optimizeTypes(file: Il2JsonFile): boolean {
  let passes = 1;
  do {
    console.log(`Optimization pass #${passes++}`);
  } while (optimizeWorker(file));

  return passes > 1;
}
