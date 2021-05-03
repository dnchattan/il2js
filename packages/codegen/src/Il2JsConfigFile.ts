import type { ValueOf } from '@il2js/core';
import { TypeFilter } from './OutputFilter';
import type { Targets } from './Targets';
import type { TargetOutputOptions } from './Targets/TargetOutputOptions';
import type { TypeImport } from './Types/Compiler/TypeImport';
import type { TypeVisitor } from './Types/Compiler/TypeVisitor';

export type TargetName = ValueOf<typeof Targets>['targetName'];
export interface Il2JsConfigFile {
  output: TargetOutputOptions;
  rootNamespace?: string;
  optimize?: boolean;
  types?: (string | TypeImport)[];
  targets: (TargetName | [TargetName, Pick<Il2JsConfigFile, Exclude<keyof Il2JsConfigFile, 'targets'>>?])[];
  visitors?: TypeVisitor[];
  filters?: TypeFilter[];
}
