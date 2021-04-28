import { Il2CppStaticMethodInfo } from '../../Types';
import type { TypeVisitors } from '../TypeVisitors';
import type { TypeRegistry } from './TypeRegistry';

export interface TsGenContext {
  rootNamespace: string;
  typeFunctions: Record<string, Il2CppStaticMethodInfo[]>;
  types: TypeRegistry;
  visitors?: TypeVisitors;
}
