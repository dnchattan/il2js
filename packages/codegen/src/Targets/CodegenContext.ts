import type { Il2CppStaticMethodInfo, ITypeRegistry } from '../Types';
import type { TypeVisitors } from './TypeVisitors';

export interface CodegenContext {
  rootNamespace: string;
  typeFunctions: Record<string, Il2CppStaticMethodInfo[]>;
  types: ITypeRegistry;
  visitors?: TypeVisitors;
}
