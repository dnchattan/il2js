/* eslint-disable max-classes-per-file */

import type { Il2CppTypeDefinitionInfo, Il2CppTypeInfo, Il2JsonFile } from '.';
import { OncePer } from './Utilities';

export interface TypeFilter {
  visitType?(type: Il2CppTypeDefinitionInfo): TypeFilter | boolean;
  visitTypeUsage?(type: Il2CppTypeInfo): TypeFilter | boolean;
}

export class OutputFilter {
  readonly typesList: Set<Il2CppTypeDefinitionInfo> = new Set();
  readonly visitors: OncePer<TypeFilter, Il2CppTypeDefinitionInfo | Il2CppTypeInfo> = new OncePer();

  constructor(private file: Il2JsonFile) {}

  lookupType(type: Il2CppTypeInfo): Il2CppTypeDefinitionInfo | undefined {
    return this.file.TypeInfoList.find(
      (typeDef) => typeDef.Type.TypeName === type.TypeName && typeDef.Type.Namespace === type.Namespace
    );
  }

  processRefs(visitor: TypeFilter, ...typeRefs: (Il2CppTypeInfo | undefined)[]): this {
    for (const typeRef of typeRefs) {
      if (!typeRef) {
        continue;
      }
      if (!this.visitors.once(visitor, typeRef)) {
        continue;
      }
      const visitorResult = visitor.visitTypeUsage?.(typeRef);
      const typeDef = this.lookupType(typeRef);
      if (typeDef && visitorResult) {
        const nextVisitor = visitorResult === true ? visitor : visitorResult;
        this.typesList.add(typeDef);
        this.includeReferences(nextVisitor, typeDef);
      }
      this.processRefs(visitor, ...(typeRef.TypeArguments ?? []), typeDef?.Type.BaseType);
    }
    return this;
  }

  includeReferences(visitor: TypeFilter, typeDef: Il2CppTypeDefinitionInfo): this {
    if (!this.visitors.once(visitor, typeDef)) {
      return this;
    }

    this.processRefs(
      visitor,
      typeDef.Type,
      ...(typeDef.StaticFields?.map((field) => field.Type) ?? []),
      ...(typeDef.Fields?.map((field) => field.Type) ?? [])
    );
    return this;
  }

  include(visitor: TypeFilter): this {
    for (const type of this.file.TypeInfoList) {
      const visitorResult = visitor.visitType?.(type);
      if (visitorResult) {
        const nextVisitor = visitorResult === true ? visitor : visitorResult;
        this.typesList.add(type);
        this.includeReferences(nextVisitor, type);
      }
      if (type.NestedTypes) {
        for (const nestedType of type.NestedTypes) {
          const nestedVisitorResult = visitor.visitType?.(nestedType);
          if (nestedVisitorResult) {
            const nextVisitor = nestedVisitorResult === true ? visitor : nestedVisitorResult;
            this.typesList.add(nestedType);
            this.includeReferences(nextVisitor, nestedType);
          }
        }
      }
    }
    return this;
  }
}
