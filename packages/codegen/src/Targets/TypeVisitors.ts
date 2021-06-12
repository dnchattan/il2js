import { Il2CppStaticMethodInfo, Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../Types';
import { CodegenContext } from './CodegenContext';

export interface TypeVisitors {
  class?(typeDef: Il2CppTypeDefinitionInfo, context: CodegenContext): Il2CppTypeDefinitionInfo | undefined;
  typeRef?(typeRef: Il2CppTypeInfo, context: CodegenContext): Il2CppTypeInfo | undefined;
  staticMethod?(
    methodInfo: Il2CppStaticMethodInfo,
    typeDef: Il2CppTypeDefinitionInfo,
    context: CodegenContext
  ): Il2CppStaticMethodInfo | undefined;
}
