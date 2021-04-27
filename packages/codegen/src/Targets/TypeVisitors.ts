import { Il2CppTypeDefinitionInfo, Il2CppTypeInfo } from '../Types';
import { TsGenContext } from './TypeScript/TsGenContext';

export interface TypeVisitors {
  class?(typeDef: Il2CppTypeDefinitionInfo, context: TsGenContext): Il2CppTypeDefinitionInfo | undefined;
  typeRef?(typeRef: Il2CppTypeInfo, context: TsGenContext): Il2CppTypeInfo | undefined;
}
