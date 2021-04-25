import { Il2CppStaticMethodInfo, Il2CppTypeInfo } from '../../Types';

export interface TsGenContext {
  rootNamespace: string;
  typeMap: Map<string, Il2CppTypeInfo>;
  typeFunctions: Record<string, Il2CppStaticMethodInfo[]>;
}
