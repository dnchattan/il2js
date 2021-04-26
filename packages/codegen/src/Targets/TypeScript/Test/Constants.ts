import { TsGenContext } from '../TsGenContext';
import { TypeRegistry } from '../TypeRegistry';

export const fakeContext: TsGenContext = {
  rootNamespace: '',
  typeMap: new Map(),
  typeFunctions: {},
  types: new TypeRegistry(),
};
