import { TsGenContext } from '../TsGenContext';
import { TypeRegistry } from '../TypeRegistry';

export const fakeContext: TsGenContext = {
  rootNamespace: '',
  typeFunctions: {},
  types: new TypeRegistry(),
};
