import type { Il2CppTypeDefinitionInfo, Il2JsonFile, ITypeRegistry } from '../Types';
import type { CodegenApi } from './CodegenApi';
import type { TargetOptions } from './TargetOptions';
import type { TargetOutputOptions } from './TargetOutputOptions';

export interface Target {
  process(
    il2js: Il2JsonFile,
    opts: TargetOptions,
    progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void
  ): Promise<void>;
  write(options: TargetOutputOptions): Promise<void>;
}

export interface TargetFactory {
  targetName: string;
  new (assembly: string, version: string, types: ITypeRegistry, api: CodegenApi): Target;
}
