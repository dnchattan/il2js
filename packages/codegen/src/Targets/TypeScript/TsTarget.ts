/* eslint-disable no-param-reassign */
import ts from 'typescript';
import path from 'path';
import { assert } from '@il2js/core';
import { Il2JsonFile, Il2CppTypeDefinitionInfo } from '../../Types';
import { TargetOptions } from '../TargetOptions';
import { Target } from '../Target';
import { generateFileAsync } from './GeneratorMethods';
import { TargetOutputOptions } from '../TargetOutputOptions';
import { TypeRegistry } from './TypeRegistry';
import { CodegenApi } from '../CodegenApi';

export class TsTarget implements Target {
  static targetName: 'typescript' = 'typescript';
  private nodes?: ts.Node[];

  constructor(
    private readonly assembly: string,
    private readonly version: string,
    private readonly types: TypeRegistry,
    private readonly api: CodegenApi
  ) {}

  async process(
    il2js: Il2JsonFile,
    opts: TargetOptions,
    progressCallback?: (n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) => void
  ): Promise<void> {
    this.nodes = await generateFileAsync(il2js, this.assembly, this.version, this.types, opts, progressCallback);
  }

  async write(options: TargetOutputOptions): Promise<void> {
    assert(this.nodes, ReferenceError);
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
    });
    const indexFile = ts.createSourceFile('index.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    const output = this.nodes.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, indexFile)).join('\n');

    const targetFile = path.join(options.outputDir, options.entry);
    await this.api.writeFile(targetFile, output);
  }
}
