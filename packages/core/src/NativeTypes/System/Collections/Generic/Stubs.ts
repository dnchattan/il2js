/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Address } from '../../../../Address';
import { NativeTypeInstance, NativeType, FieldType } from '../../../../NativeType';
import { UnknownObject } from '../../../il2js/_TypeIndex';
import { TypeStub } from '../../Stubs';

export class SortedSet<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class HashSet<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class IEnumerator<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class IEnumerable<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}

export class Queue<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}
