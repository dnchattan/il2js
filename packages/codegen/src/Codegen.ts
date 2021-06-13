import path from 'path';
import fs from 'fs';
import { assert } from '@il2js/core';
import { CodegenApi, Targets } from './Targets';
import { Il2CppTypeDefinitionInfo } from './Types';
import { TypeRegistry } from './TypeRegistry';
import { optimizeTypes } from './OptimizeTypes';
import { Il2JsConfig, Il2JsConfigFile } from './Il2JsConfigFile';
import { GameAssembly, isGameAssembly } from './GameAssembly';
import { executeMethodVisitor, executeVisitor } from './TypeVisitorExecutor';

export interface CodegenOptions {
  api?: CodegenApi;
  progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void;
}

const defaultCodegenApi: CodegenApi = {
  writeFile(filePath, data) {
    return fs.promises.writeFile(filePath, data, 'utf8');
  },
};

export async function codegen(config: Il2JsConfigFile, { api, progressCallback }: CodegenOptions = {}): Promise<void> {
  const { gameAssembly, output, targets, types, force, optimize, filter, visitors } = config;
  const gasm = isGameAssembly(gameAssembly)
    ? gameAssembly
    : new GameAssembly(gameAssembly.dll, gameAssembly.metadata, gameAssembly.version, filter);
  const outputFile = path.join(output.outputDir, output.entry);
  if (gasm.cached && fs.existsSync(outputFile) && !force) {
    console.log(`Re-using entry ${outputFile}`);
    return;
  }

  await gasm.load();

  if (visitors) {
    visitors.forEach((visitor) => {
      gasm.structs.TypeInfoList = executeVisitor(visitor, gasm.structs.TypeInfoList);
      gasm.structs.TypeNameToStaticMethods = executeMethodVisitor(visitor, gasm.structs.TypeNameToStaticMethods);
    });
  }

  if (optimize) {
    optimizeTypes(gasm.structs);
  }

  const typeRegistry = new TypeRegistry(types);

  for (const currentTarget of Object.values(targets)) {
    let targetName: string;
    let targetConfig: Il2JsConfig = config;
    if (typeof currentTarget !== 'string') {
      targetName = currentTarget[0];
      if (currentTarget[1]) {
        targetConfig = { ...config, ...currentTarget[1] };
      }
    } else {
      targetName = currentTarget;
    }
    const Target = Object.values(Targets).find((target) => target.targetName === targetName);
    assert(Target, RangeError);
    const targetInstance = new Target(
      path.basename(gasm.gameAssemblyDllPath),
      gasm.version,
      typeRegistry,
      api ?? defaultCodegenApi
    );
    // eslint-disable-next-line no-await-in-loop
    await targetInstance.process(gasm.structs, targetConfig, progressCallback);
    // eslint-disable-next-line no-await-in-loop
    await targetInstance.write(output);
  }
}
