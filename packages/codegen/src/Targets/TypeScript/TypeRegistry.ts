import { assert, NativeType, isNativeType, excludeUndefined } from '@il2js/core';
import { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../../Types';
import { TsGenContext } from './TsGenContext';
// eslint-disable-next-line import/no-cycle
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
  private typeIds = new Map<number, Il2CppTypeInfo>();
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
    if (type.IsPrimitive) {
      return true;
    }
    if (!this.typeIds.has(type.TypeIndex) && !this.findType(type)) {
      return false;
    }
    if (type.TypeArguments && !type.TypeArguments.every((arg) => this.hasType(arg) || type.IsPrimitive)) {
      return false;
    }
    if (type.BaseType && !this.hasType(type.BaseType)) {
      return false;
    }
    return true;
  }

  getTypeName(typeDef: Il2CppTypeInfo, context: TsGenContext, relativeToType?: Il2CppTypeInfo): string {
    const relativeTo =
      relativeToType &&
      (relativeToType.Namespace ? relativeToType.Namespace : this.getTypeName(relativeToType, context));
    const disposition = context.types.getTypeDisposition(typeDef);
    if (disposition === TypeDisposition.Imported) {
      return [typeDef.Namespace, fixName(typeDef.TypeName)].filter(Boolean).join('.');
    }
    assert(
      !(typeDef.Namespace && typeDef.DeclaringType),
      `Not expected to have both a namespace ('${typeDef.Namespace}' AND a declaring type ('${typeDef.DeclaringType?.Namespace}.${typeDef.DeclaringType?.TypeName}'))`
    );
    if (disposition === TypeDisposition.Generated) {
      // eslint-disable-next-line no-param-reassign
      typeDef = this.typeIds.get(typeDef.TypeIndex)!;
    }
    const nsParts: string[] = [];
    if (disposition === TypeDisposition.Generated && context.rootNamespace) {
      nsParts.push(context.rootNamespace);
    }
    if (typeDef.DeclaringType) {
      if (typeDef.DeclaringType.Namespace) {
        nsParts.push(typeDef.DeclaringType.Namespace);
      }
      nsParts.push(fixName(`${typeDef.DeclaringType.TypeName}_${typeDef.TypeName}`));
    } else {
      if (typeDef.Namespace) {
        nsParts.push(typeDef.Namespace);
      }
      nsParts.push(fixName(typeDef.TypeName));
    }
    const ns = nsParts.slice(0, nsParts.length - 1).join('.');
    const fullyQualifiedName = nsParts.join('.');
    if (ns === relativeTo || fullyQualifiedName === relativeTo) {
      return fixName(typeDef.TypeName);
    }
    return fullyQualifiedName;
  }

  addTypeDefs(types: Il2CppTypeDefinitionInfo[]) {
    let typesToAdd: Il2CppTypeDefinitionInfo[] = types;
    while (typesToAdd.length > 0) {
      this.addTypeInfo(typesToAdd.map((type) => type.Type));
      typesToAdd = excludeUndefined(typesToAdd.flatMap((type) => type.NestedTypes));
    }
  }

  addTypeInfo(types: Il2CppTypeInfo[]) {
    types.forEach((type) => this.typeIds.set(type.TypeIndex, type));
  }

  addTypes({ from, types }: TypeImport) {
    const names = Object.keys(types);
    this.imports.push([names, from]);
    mergeTypeTree(this.types, types);
  }
}
