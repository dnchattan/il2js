import type { Il2JsConfig } from '../Il2JsConfigFile';
import type { Il2CppTypeDefinitionInfo, Il2JsonFile, ITypeRegistry } from '../Types';
import type { CodegenApi } from './CodegenApi';
import type { TargetOutputOptions } from './TargetOutputOptions';

export interface Target {
  process(
    il2js: Il2JsonFile,
    opts: Il2JsConfig,
    progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void
  ): Promise<void>;
  write(options: TargetOutputOptions): Promise<void>;
}

export interface TargetFactory {
  targetName: string;
  new (assembly: string, version: string, types: ITypeRegistry, api: CodegenApi): Target;
}
