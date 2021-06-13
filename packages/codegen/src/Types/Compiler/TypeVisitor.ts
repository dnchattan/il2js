import type { Il2CppStaticMethodInfo, Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '..';
import { Il2CppFieldInfo } from '../Il2CppFieldInfo';

export interface TypeVisitor {
  visitTypeDef?(type: Il2CppTypeDefinitionInfo): Il2CppTypeDefinitionInfo | undefined;
  visitField?(field: Il2CppFieldInfo): Il2CppFieldInfo | undefined;
  visitTypeUsage?(type: Il2CppTypeInfo): Il2CppTypeInfo | undefined;
  visitStaticMethod?(methodInfo: Il2CppStaticMethodInfo, typeName: string): Il2CppStaticMethodInfo | undefined;
}
