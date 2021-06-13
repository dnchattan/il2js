import type { Il2CppStaticMethodInfo, ITypeRegistry } from '../Types';

export interface CodegenContext {
  rootNamespace: string;
  typeFunctions: Record<string, Il2CppStaticMethodInfo[]>;
  types: ITypeRegistry;
}
