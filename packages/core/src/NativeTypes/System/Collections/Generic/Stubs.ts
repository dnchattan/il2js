/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Address } from '../../../../Address';
import { NativeTypeInstance, NativeType } from '../../../../NativeType';
import { UnknownObject } from '../../../il2js/_TypeIndex';
import { TypeStub } from '../../Stubs';

export class SortedSet<T extends string | number | boolean | NativeTypeInstance = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class HashSet<T extends string | number | boolean | NativeTypeInstance = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class IEnumerator<T extends string | number | boolean | NativeTypeInstance = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class IEnumerable<T extends string | number | boolean | NativeTypeInstance = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class Queue<T extends string | number | boolean | NativeTypeInstance = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}
