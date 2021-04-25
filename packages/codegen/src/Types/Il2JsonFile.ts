import { Il2CppStaticMethodInfo } from './Il2CppStaticMethodInfo';
import { Il2CppTypeDefinitionInfo } from './Il2CppTypeDefinitionInfo';

export interface Il2JsonFile {
  TypeInfoList: Il2CppTypeDefinitionInfo[];
  TypeNameToStaticMethods: Record<string, Il2CppStaticMethodInfo[]>;
}
