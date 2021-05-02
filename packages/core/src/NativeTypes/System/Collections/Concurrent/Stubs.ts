/* eslint-disable @typescript-eslint/no-unused-vars */
import { Address } from '../../../../Address';
import { NativeTypeInstance, NativeType, FieldType } from '../../../../NativeType';
import { UnknownObject } from '../../../il2js/_TypeIndex';
import { TypeStub } from '../../Stubs';

export class ConcurrentQueue<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}
