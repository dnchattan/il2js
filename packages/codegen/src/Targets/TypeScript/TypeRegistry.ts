import { assert, NativeType, isNativeType, excludeUndefined } from '@il2js/core';

import { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../Types';
import { fixName } from './Utils/TypeNameHelpers';

export interface TypeImport {
  from: string;
  types: TypeTree;
}

export type TypeTree = { [key: string]: Readonly<TypeTree | NativeType> | undefined };

function mergeTypeTree(left: TypeTree, right: Readonly<TypeTree>) {
  const keys = Object.keys(right);
  for (const key of keys) {
    const leftValue = left[key];
    const rightValue = right[key];
    if (!leftValue) {
      // eslint-disable-next-line no-param-reassign
      left[key] = rightValue;
    } else {
      // can only merge namespaces, not types
      assert(!!rightValue);
      assert(!isNativeType(leftValue));
      assert(!isNativeType(rightValue));
      mergeTypeTree(leftValue as TypeTree, right[key] as TypeTree);
    }
  }
}

export enum TypeDisposition {
  Missing,
  Generated,
  Imported,
}

export class TypeRegistry {
  private types: TypeTree = {};
  private typeIds = new Set<number>();
  readonly imports: [string[], string][] = [];

  findType(type: Il2CppTypeInfo): NativeType | undefined {
    const namePath: string[] = [...(type.Namespace?.split('.') || []), fixName(type.TypeName)].filter(
      Boolean
    ) as string[];
    let node: any = this.types;
    while (namePath.length > 0) {
      const [currentNodeName] = namePath.splice(0, 1);
      if (!node[currentNodeName]) {
        return undefined;
      }
      node = node[currentNodeName];
    }
    return node;
  }

  getTypeDisposition(type: Il2CppTypeInfo): TypeDisposition {
    if (this.typeIds.has(type.TypeIndex)) {
      return TypeDisposition.Generated;
    }
    if (this.findType(type)) {
      return TypeDisposition.Imported;
    }
    return TypeDisposition.Missing;
  }

  hasType(type: Il2CppTypeInfo): boolean {
    return this.typeIds.has(type.TypeIndex) || !!this.findType(type);
  }

  addTypeDefs(types: Il2CppTypeDefinitionInfo[]) {
    let typesToAdd: Il2CppTypeDefinitionInfo[] = types;
    while (typesToAdd.length > 0) {
      this.addTypeInfo(typesToAdd.map((type) => type.Type));
      typesToAdd = excludeUndefined(typesToAdd.flatMap((type) => type.NestedTypes));
    }
  }

  addTypeInfo(types: Il2CppTypeInfo[]) {
    types.forEach((type) => this.typeIds.add(type.TypeIndex));
  }

  addTypes({ from, types }: TypeImport) {
    const names = Object.keys(types);
    this.imports.push([names, from]);
    mergeTypeTree(this.types, types);
  }
}
