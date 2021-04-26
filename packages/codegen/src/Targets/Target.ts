import { Il2CppTypeDefinitionInfo, Il2JsonFile } from '../Types';
import { CodegenApi } from './CodegenApi';
import { TargetOptions } from './TargetOptions';
import { TargetOutputOptions } from './TargetOutputOptions';
import { TypeRegistry } from './TypeScript/TypeRegistry';

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
  new (assembly: string, version: string, types: TypeRegistry, api: CodegenApi): Target;
}
