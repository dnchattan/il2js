/* eslint-disable @typescript-eslint/no-unused-vars */
import { Address } from '../../../../Address';
import { NativeTypeInstance, NativeType } from '../../../../NativeType';
import { UnknownObject } from '../../../il2js/_TypeIndex';
import { TypeStub } from '../../Stubs';

export class ConcurrentQueue<
  T extends string | number | boolean | NativeTypeInstance = UnknownObject
> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}
