import path from 'path';
import fs from 'fs';
import { assert, ValueOf } from '@il2js/core';
import { CodegenApi, TargetOptions, Targets } from './Targets';
import { TargetOutputOptions } from './Targets/TargetOutputOptions';
import { Il2CppTypeDefinitionInfo } from './Types';
import { TypeImport, TypeRegistry } from './Targets/TypeScript/TypeRegistry';
import { IGameAssembly } from './IGameAssembly';

export interface CodegenOptions {
  gasm: IGameAssembly;
  targets: [ValueOf<typeof Targets>['targetName'], TargetOptions][];
  output: TargetOutputOptions;
  types?: (string | TypeImport)[];
  force?: boolean;
  api?: CodegenApi;
  progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void;
}

const defaultCodegenApi: CodegenApi = {
  writeFile(filePath, data) {
    return fs.promises.writeFile(filePath, data, 'utf8');
  },
};

export async function codegen({
  gasm,
  output,
  targets,
  types,
  force,
  progressCallback,
  api,
}: CodegenOptions): Promise<void> {
  const outputFile = path.join(output.outputDir, output.entry);
  if (gasm.cached && fs.existsSync(outputFile) && !force) {
    console.log(`Re-using entry ${outputFile}`);
    return;
  }

  await gasm.load();

  const typeRegistry = new TypeRegistry();
  const typeList: (string | TypeImport)[] = types ?? ['@il2js/core'];
  for (const entry of typeList) {
    if (typeof entry === 'string') {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const { typeExport } = require(entry);
      typeRegistry.addTypes({ from: entry, types: typeExport });
    } else {
      typeRegistry.addTypes(entry);
    }
  }

  for (const [targetName, targetOpts] of Object.values(targets)) {
    const Target = Object.values(Targets).find((target) => target.targetName === targetName);
    assert(Target, RangeError);
    const target = new Target(
      path.basename(gasm.gameAssemblyDllPath),
      gasm.version,
      typeRegistry,
      api ?? defaultCodegenApi
    );
    // eslint-disable-next-line no-await-in-loop
    await target.process(gasm.structs, targetOpts, progressCallback);
    // eslint-disable-next-line no-await-in-loop
    await target.write(output);
  }
}
