import type { NativeType } from '@il2js/core';
import type { Il2CppTypeInfo, Il2CppTypeDefinitionInfo, CodegenContext } from '../..';
import type { TypeImport } from '../../TypeRegistry';
import type { TypeDisposition } from './TypeDisposition';

export interface ITypeRegistry {
  readonly imports: [string[], string][];
  findType(type: Il2CppTypeInfo): NativeType | undefined;
  getTypeDisposition(type: Il2CppTypeInfo): TypeDisposition;
  hasType(type: Il2CppTypeInfo): boolean;
  getTypeName(typeDef: Il2CppTypeInfo, context: CodegenContext, relativeToType?: Il2CppTypeInfo): string;
  addTypeDefs(types: Il2CppTypeDefinitionInfo[]): void;
  addTypeInfo(types: Il2CppTypeInfo[]): void;
  addTypes({ from, types }: TypeImport): void;
}
