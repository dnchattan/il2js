import { assert, NativeType, isNativeType } from '@il2js/core';

import { Il2CppTypeInfo } from '../../Types';
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

export class TypeRegistry {
  private types: TypeTree = {};
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

  addTypes({ from, types }: TypeImport) {
    const names = Object.keys(types);
    this.imports.push([names, from]);
    mergeTypeTree(this.types, types);
  }
}
