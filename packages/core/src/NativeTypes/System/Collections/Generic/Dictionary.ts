import { types } from 'ref-napi';
import { String } from '../../String';
import { Address } from '../../../../Address';
import { bindTypeArgs } from '../../../../BindTypeArgs';
import { NativeTypeInstance, NativeType, FieldType } from '../../../../NativeType';
import { TypeName } from '../../../../FieldSymbols';
import { NativeStruct, UnknownObject } from '../../../il2js/_TypeIndex';
import { ManagedArray } from '../../Internal/ManagedArray';
import { DictionaryEntry } from './DictionaryEntry';

export class Dictionary<K extends FieldType = UnknownObject, V extends FieldType = UnknownObject> extends NativeStruct {
  public static readonly [TypeName] = 'System.Dictionary';
  static size = 0;
  private readonly ktype: K extends NativeTypeInstance ? NativeType<K> : string | string;
  private readonly vtype: V extends NativeTypeInstance ? NativeType<V> : string | string;

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

  public toPrimitive() {
    return this.toMap();
  }

  public toMap(): Map<K extends String ? string : K, V extends String ? string : V> {
    const kvplist: [
      K extends String ? string : K,
      V extends String ? string : V
    ][] = this.entries?.toArray().map((entry) => [entry.key, entry.value]) as any;
    const dict = new Map<K extends String ? string : K, V extends String ? string : V>(kvplist);
    return dict;
  }

  public get(key: K): V {
    return this.toMap().get(key as any) as any;
  }

  public get entries(): ManagedArray<DictionaryEntry<K, V>> | undefined {
    return this.readField(
      0x18,
      ManagedArray,
      2,
      bindTypeArgs(DictionaryEntry, this.ktype, this.vtype),
      1, // indirection
      this.count
    );
  }

  public get count(): number {
    return this.readTypePrimitive(32, types.int32, 1);
  }
}
