import { CodegenContext } from '../../CodegenContext';
import { TypeRegistry } from '../../../TypeRegistry';

export const fakeContext: CodegenContext = {
  rootNamespace: '',
  typeFunctions: {},
  types: new TypeRegistry(),
};
