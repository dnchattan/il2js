import type { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '..';
import { Il2CppFieldInfo } from '../Il2CppFieldInfo';

export interface TypeVisitor {
  visitTypeDef?(type: Il2CppTypeDefinitionInfo): Il2CppTypeDefinitionInfo | undefined;
  visitField?(field: Il2CppFieldInfo): Il2CppFieldInfo | undefined;
  visitTypeUsage?(type: Il2CppTypeInfo): Il2CppTypeInfo | undefined;
}
