import path from 'path';
import fs from 'fs';
import { assert } from '@il2js/core';
import { GameAssembly } from './GameAssembly';
import { TargetOptions, Targets } from './Targets';
import { TargetOutputOptions } from './Targets/TargetOutputOptions';
import { Il2CppTypeDefinitionInfo } from './Types';

export async function codegen(
  gameAssemblyDllPath: string,
  globalMetadataPath: string,
  version: string,
  targets: Record<keyof typeof Targets, TargetOptions>,
  outputOptions: TargetOutputOptions,
  force: boolean,
  progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void
): Promise<void> {
  const gasm = new GameAssembly(gameAssemblyDllPath, globalMetadataPath, version);
  await gasm.load();
  const outputFile = path.join(outputOptions.outputDir, outputOptions.entry);
  if (gasm.cached && fs.existsSync(outputFile) && !force) {
    console.log(`Re-using entry ${outputFile}`);
  }
  for (const [targetName, targetOpts] of Object.entries(targets)) {
    const Target = Targets.find((target) => target.targetName === targetName);
    assert(Target, RangeError);
    const target = new Target(path.basename(gameAssemblyDllPath), version);
    // eslint-disable-next-line no-await-in-loop
    await target.process(gasm.structs, targetOpts, progressCallback);
    // eslint-disable-next-line no-await-in-loop
    await target.write(outputOptions);
  }
}

export default codegen;
