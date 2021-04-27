import { Il2JsonFile } from './Types';

export interface IGameAssembly {
  structs: Il2JsonFile;
  cached: boolean;
  readonly gameAssemblyDllPath: string;
  readonly globalMetadataPath: string;
  readonly version: string;
  load(): Promise<void>;
}
