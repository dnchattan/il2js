/* eslint-disable max-classes-per-file */
import { Type } from 'ref-napi';
import { NativeType, NativeTypeInstance } from '../../NativeType';
import { TypeName } from '../../FieldSymbols';
import { offsetAddress, Offset, Size, Address } from '../../Address';
import { getCurrentIOContext, setCurrentIOContext } from '../../Zone';
import { deref } from '../../Dereference';
import { PrimitiveTypes } from '../../PrimitiveTypes';

import type { Il2CppClass } from './MethodInfo';
import { IOContext } from '../../IOContext';
import { isPrimitiveType, isNativeType } from '../../TypeHelpers';
import { PerformanceMap } from './PerformanceMap';
// eslint-disable-next-line import/no-cycle
import { flattenValue } from './structToJSON';
import { assert, DefaultedMap, Extends, StaticAssert, Tail } from '../../Helpers';

let idValue = 0;

const performanceData = new PerformanceMap();
(global as any).NativeStruct_performanceData = performanceData;

const AddressField = Symbol('address');

export abstract class NativeStruct implements NativeTypeInstance {
  public __brand: 'NativeType' = 'NativeType';
  public static [TypeName] = ``;
  static staticMethods = {};
  static fieldNames: string[] = [];

  static typeMap = new Map<string, NativeType>();
  static typeHash = new Set<Function>();

  public static createInstance(address: Address, typeName: string) {
    const InstanceType = this.typeMap.get(typeName);
    if (!InstanceType) {
      throw new Error(`Unknown type '${typeName}'`);
    }
    return new InstanceType(address);
  }

  protected valueCache: DefaultedMap<Offset, Map<any, any>> = new DefaultedMap(() => new Map());
  protected structSize: Size;
  private ioContext: IOContext;
  public readonly $id: number;

  constructor(public address: Address) {
    this.$id = idValue++;
    const ctor = this.constructor as NativeType;
    if (!NativeStruct.typeHash.has(ctor)) {
      NativeStruct.typeHash.add(ctor);
      NativeStruct.typeMap.set(ctor[TypeName], ctor);
    }
    // log(`initialized type '${chalk.cyanBright(ctor[TypeName])}' @ ${chalk.magentaBright(`0x${hex(address)}`)}`);
    this.structSize = Object.getOwnPropertyDescriptor(ctor, 'size') && Reflect.get(ctor, 'size');

    this.ioContext = getCurrentIOContext();

    const originalReadField = this.readField.bind(this);
    this.readField = (...args: Parameters<typeof originalReadField>) =>
      setCurrentIOContext(this.ioContext).run(() => originalReadField(...args));

    const originalReadTypePrimitive = this.readTypePrimitive.bind(this);
    this.readTypePrimitive = (...args: Parameters<typeof originalReadTypePrimitive>) =>
      setCurrentIOContext(this.ioContext).run(() => originalReadTypePrimitive(...args));
  }

  get CppClass(): Il2CppClass {
    // have to do this indirection to avoid cirucular dependency
    // eslint-disable-next-line global-require
    return this.readField(0, require('./MethodInfo').Il2CppClass, 2);
  }

  public cast<T extends NativeType>(
    CastType: T,
    ...typeArgs: Tail<ConstructorParameters<NativeType>>
  ): InstanceType<T> {
    return new CastType(this.address, ...typeArgs) as InstanceType<T>;
  }

  public useIOContext<T>(fn: () => T): T {
    return setCurrentIOContext(this.ioContext).run(fn);
  }

  private static [AddressField]?: Address;

  static get address(): Address {
    const value = this[AddressField];
    if (value === undefined) {
      throw new Error(`address not accessible for built-in type '${this.name}'`);
    }
    return value;
  }

  static set address(value: Address) {
    this[AddressField] = value;
  }

  public static sizeof(type: NativeType | string | Type): Size {
    if (isPrimitiveType(type)) {
      const refType = PrimitiveTypes[type as keyof typeof PrimitiveTypes];
      assert(refType, ReferenceError);
      return refType.size;
    }
    return type.size;
  }

  public toJSON(): {};
  public toJSON(depth: number): {};
  public toJSON<TStub = any>(depth: number, getStubFn: (object: NativeTypeInstance) => TStub): {};
  public toJSON(
    depth: number = 3,
    getStubFn: (object: NativeTypeInstance) => any = (obj) => ({ $stub: [obj.address, obj.constructor[TypeName]] })
  ) {
    return flattenValue(this, [], depth, getStubFn);
  }

  protected read<
    T extends string | Type | NativeType,
    TReturn = T extends NativeType ? InstanceType<T> : number | string
  >(
    offset: Offset,
    FieldType: T,
    indirection: number | undefined,
    ...args: T extends NativeType ? Tail<ConstructorParameters<NativeType>> : []
  ): TReturn | undefined {
    if (isPrimitiveType(FieldType)) {
      return this.readTypePrimitive(offset, FieldType, indirection ?? 1);
    }
    assert(isNativeType(FieldType));
    const result = this.readField(offset, FieldType, indirection ?? 2, ...args) as any;
    if (result === undefined) {
      return undefined;
    }
    return result;
  }

  protected readField<
    TypeArgs extends any[],
    TCtor extends NativeType<T>,
    T extends NativeTypeInstance = NativeTypeInstance
  >(offset: Offset, FieldType: TCtor, indirection: number, ...typeArgs: TypeArgs): any {
    // TODO change to return T once nested templates are working!
    // TODO: this breaks for ManagedArray
    // assert(indirection > 1 || offsetAddress(offset, type.size) < this.structSize);
    // log(`read field type '${chalk.cyanBright(type.name)}' @ +${chalk.magentaBright(`0x${hex(offset)}`)}`);
    return this.getCachedValue(offset, FieldType, () => {
      const address = deref(this.ioContext, offsetAddress(this.address, offset), indirection);
      if (!address) {
        return undefined;
      }
      const result = new FieldType(address, ...typeArgs);

      ((result as unknown) as NativeStruct).ioContext = this.ioContext;

      if (result.unbox) {
        return result.unbox();
      }

      return result;
    });
  }

  protected static readField<
    TypeArgs extends any[],
    TCtor extends { new (address: Address, ...args: TypeArgs): T; size: number } = {
      new (address: Address, ...args: TypeArgs): any;
      size: number;
    },
    T extends NativeTypeInstance = NativeTypeInstance
  >(offset: Offset, FieldType: TCtor, indirection: number, ...typeArgs: TypeArgs): any {
    // TODO change to return T once nested templates are working!
    // log(
    //   `read ${chalk.yellowBright('static')} field type '${chalk.cyanBright(type.name)}' @ +${chalk.magentaBright(
    //     `0x${hex(offset)}`
    //   )}`
    // );
    const ioContext = getCurrentIOContext();
    const address = deref(ioContext, offsetAddress(this.address, offset), indirection);
    if (!address) {
      return undefined;
    }
    const result = new FieldType(address, ...typeArgs);
    return result;
  }

  protected readTypePrimitive<T>(offset: Offset, type: Type | string, indirection: number): T {
    const refType = typeof type === 'string' ? PrimitiveTypes[type as keyof typeof PrimitiveTypes] : type;
    // log(
    //   `read field type '${chalk.cyanBright(refType.name ?? 'unknown')}' @ +${chalk.magentaBright(`0x${hex(offset)}`)}`
    // );
    return this.getCachedValue(offset, refType, () => {
      const address = deref(this.ioContext, offsetAddress(this.address, offset), indirection);
      const buf = this.ioContext.read(address, refType.size);
      return refType.get(buf, 0);
    });
  }

  protected static readTypePrimitive<T>(offset: Offset, type: Type | string, indirection: number): T {
    const refType = typeof type === 'string' ? PrimitiveTypes[type as keyof typeof PrimitiveTypes] : type;
    // log(
    //   `read ${chalk.yellowBright('static')} field type '${chalk.cyanBright(
    //     refType.name ?? 'unknown'
    //   )}' @ +${chalk.magentaBright(`0x${hex(offset)}`)}`
    // );
    const ioContext = getCurrentIOContext();
    const address = deref(ioContext, offsetAddress(this.address, offset), indirection);
    const buf = ioContext.read(address, refType.size);
    return refType.get(buf, 0);
  }

  protected getCachedValue<T, U>(offset: Offset, type: T): U | undefined;
  protected getCachedValue<T, U>(offset: Offset, type: T, readValueFn: () => U): U;
  protected getCachedValue<T, U>(offset: Offset, type: T, readValueFn?: () => U): U | undefined {
    const offsetMap = this.valueCache.get(offset);
    let value = offsetMap.get(type);
    if (value === undefined && readValueFn) {
      value = performanceData.measureReadOperation(this, readValueFn);
      offsetMap.set(type, value);
    }
    return value;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
declare class __ASSERT__ConcreteNativeStruct extends NativeStruct {
  static size: Size;
  [TypeName]: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars, no-underscore-dangle
declare const __ASSERT__NativeStruct: StaticAssert<
  Extends<typeof __ASSERT__ConcreteNativeStruct, NativeType<NativeStruct>>,
  'NativeStruct must extend NativeType interface'
>;
