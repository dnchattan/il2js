/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Address } from '../../Address';
import { FieldType, NativeType, NativeTypeInstance } from '../../NativeType';
import { il2js } from '../il2js';
import { UnknownObject } from '../il2js/UnknownObject';

export class TypeStub extends il2js.NativeStruct {
  public static size = 0;

  public static fieldNames: string[] = [];
}

export class Int64 extends TypeStub {} // TODO
export class Double extends TypeStub {} // TODO
export class Guid extends TypeStub {} // TODO
export class Type extends TypeStub {}
export class Action<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}
export class TimeSpan extends TypeStub {}
export class LocalDataStoreSlot extends TypeStub {}
export class Func<T extends FieldType = UnknownObject> extends TypeStub {
  constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
    super(address);
  }
}
export class Exception extends TypeStub {}

export namespace Diagnostics {
  export class Stopwatch extends TypeStub {}
  export class StackTrace extends TypeStub {}
}

export namespace Text {
  export class StringBuilder extends TypeStub {}
}

export namespace IO {
  export class Stream extends TypeStub {}
}

export namespace Security {
  export namespace Cryptography {
    export class HashAlgorithm<T extends FieldType = UnknownObject> extends TypeStub {
      constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
        super(address);
      }
    }
  }
}

export namespace Threading {
  export class Thread extends TypeStub {}
  export class Timer extends TypeStub {}
  export class ManualResetEvent extends TypeStub {}

  export namespace Tasks {
    export class Task<T extends FieldType = UnknownObject> extends TypeStub {
      constructor(address: Address, _type: NativeType<NativeTypeInstance> | string = typeof UnknownObject) {
        super(address);
      }
    }
  }
}

export namespace Net {
  export namespace Sockets {
    export class Socket extends TypeStub {}
  }
}

export namespace Linq {
  export namespace Expressions {
    export class ParameterExpression extends TypeStub {}
  }
}
