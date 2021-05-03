import type { ValueOf } from '@il2js/core';
import type { IGameAssembly } from './IGameAssembly';
import type { TypeFilter } from './OutputFilter';
import type { Targets } from './Targets';
import type { TargetOutputOptions } from './Targets/TargetOutputOptions';
import type { TypeImport } from './Types/Compiler/TypeImport';
import type { TypeVisitor } from './Types/Compiler/TypeVisitor';

export type TargetName = ValueOf<typeof Targets>['targetName'];

export interface GameAssemblyReference {
  dll: string;
  metadata: string;
  version: string;
}

export interface Il2JsConfig {
  output?: TargetOutputOptions;
  rootNamespace?: string;
  optimize?: boolean;
  types?: (string | TypeImport)[];
  visitors?: TypeVisitor[];
  filter?: TypeFilter;
  force?: boolean;
}

export interface Il2JsConfigFile extends Il2JsConfig {
  gameAssembly: GameAssemblyReference | IGameAssembly;
  output: TargetOutputOptions;
  targets: (TargetName | [TargetName, Il2JsConfig?])[];
}
