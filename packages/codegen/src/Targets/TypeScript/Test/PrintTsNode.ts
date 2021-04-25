import ts from 'typescript';

export function printTsNode(...nodes: ts.Node[]): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });
  const indexFile = ts.createSourceFile('index.d.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  return nodes.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, indexFile)).join('\n');
}
