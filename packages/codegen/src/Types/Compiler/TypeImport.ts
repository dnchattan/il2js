import type { TypeTree } from './ITypeRegistry';

export interface TypeImport {
  from: string;
  types: TypeTree;
}
