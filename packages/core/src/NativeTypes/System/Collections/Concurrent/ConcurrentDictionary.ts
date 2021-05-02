/* eslint-disable max-classes-per-file */
import { Type } from 'ref-napi';
import { Address } from '../../../../Address';
import { bindTypeArgs } from '../../../../BindTypeArgs';
import { TypeName } from '../../../../FieldSymbols';
import { NativeTypeInstance, NativeType, FieldType } from '../../../../NativeType';
import { il2js } from '../../../il2js';
import { UnknownObject } from '../../../il2js/_TypeIndex';
import { ManagedArray } from '../../Internal/ManagedArray';

/**
struct __declspec(align(8)) System_Collections_Concurrent_ConcurrentDictionary_Node_T_TKey_TValue_T__Fields {
	Il2CppObject* _key;
	Il2CppObject* _value;
	struct System_Collections_Concurrent_ConcurrentDictionary_Node_T_TKey_TValue_T__o* _next;
	int32_t _hashcode;
};
struct System_Collections_Concurrent_ConcurrentDictionary_Node_T_TKey_TValue_T__array {
	Il2CppObject obj;
	Il2CppArrayBounds *bounds;
	il2cpp_array_size_t max_length;
	System_Collections_Concurrent_ConcurrentDictionary_Node_T_TKey_TValue_T__o* m_Items[65535];
};
struct __declspec(align(8)) System_Collections_Concurrent_ConcurrentDictionary_Tables_T_TKey_TValue_T__Fields {
	struct System_Collections_Concurrent_ConcurrentDictionary_Node_T_TKey_TValue_T__array* _buckets;
	struct System_Object_array* _locks;
	struct System_Int32_array* _countPerLock;
};
struct __declspec(align(8)) System_Collections_Concurrent_ConcurrentDictionary_T_MemberHolder_MemberInfoArray_T__Fields {
	struct System_Collections_Concurrent_ConcurrentDictionary_Tables_T_TKey_TValue_T__o* _tables;
	struct System_Collections_Generic_IEqualityComparer_T_TKey_T__o* _comparer;
	bool _growLockArray;
	int32_t _budget;
};
* */

export abstract class GenericKeyValuePairType<
  K extends FieldType = UnknownObject,
  V extends FieldType = UnknownObject
> extends il2js.NativeStruct {
  static size = 0;
  protected readonly ktype: string | Type | NativeType;
  protected readonly vtype: string | Type | NativeType;

  constructor(address: Address);
  constructor(address: Address, ktype: any);
  constructor(address: Address, ktype: any, vtype: any);
  constructor(
    address: Address,
    ktype: K extends NativeTypeInstance ? NativeType<K> : string = UnknownObject as any,
    vtype: V extends NativeTypeInstance ? NativeType<V> : string = UnknownObject as any
  ) {
    super(address);
    this.ktype = ktype as any;
    this.vtype = vtype as any;
  }
}

class ConcurrentDictionaryNode<
  K extends FieldType = UnknownObject,
  V extends FieldType = UnknownObject
> extends GenericKeyValuePairType<K, V> {
  public static readonly [TypeName] = 'System.Collections.Concurrent.Details.ConcurrentDictionaryNode';
  static size = 0;

  get key(): K | undefined {
    return this.read(0x10, this.ktype, undefined);
  }

  get value(): V | undefined {
    return this.read(0x18, this.vtype, undefined);
  }

  get next(): ConcurrentDictionaryNode<K, V> | undefined {
    return this.read(0x20, ConcurrentDictionaryNode, undefined, this.ktype, this.vtype);
  }
}

class ConcurrentDictionaryTable<
  K extends FieldType = UnknownObject,
  V extends FieldType = UnknownObject
> extends GenericKeyValuePairType<K, V> {
  public static readonly [TypeName] = 'System.Collections.Concurrent.Details.ConcurrentDictionaryTable';
  static size = 0;

  public get buckets(): ManagedArray<ConcurrentDictionaryNode<K, V>> | undefined {
    return this.readField(0x10, ManagedArray, 2, bindTypeArgs(ConcurrentDictionaryNode, this.ktype, this.vtype), 2);
  }
}

export class ConcurrentDictionary<
  K extends FieldType = UnknownObject,
  V extends FieldType = UnknownObject
> extends GenericKeyValuePairType<K, V> {
  public static readonly [TypeName] = 'System.Collections.Concurrent.ConcurrentDictionary';
  static size = 0;

  get entries(): Generator<[K, V]> {
    function* iterator(this: ConcurrentDictionary<K, V>): Generator<[K, V]> {
      const buckets = this.table?.buckets;
      if (!buckets) return;
      for (const bucket of buckets) {
        let node = bucket;
        while (node) {
          yield [node.key!, node.value!];
          node = node.next!;
        }
      }
    }
    return iterator.bind(this)();
  }

  public toPrimitive() {
    return this.toMap();
  }

  // @cache({ type: CacheType.SINGLETON, scope: CacheScope.INSTANCE })
  toMap(): Map<K, V> {
    return new Map(this.entries);
  }

  private get table(): ConcurrentDictionaryTable<K, V> | undefined {
    return this.readField(0x10, ConcurrentDictionaryTable, 2, this.ktype, this.vtype);
  }
}
