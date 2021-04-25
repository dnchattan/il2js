import { types, Type } from 'ref-napi';

export const PrimitiveTypes: Record<string, Type> = {
  ...types,
  sbyte: types.byte,
  object: types.Object, // TODO
  string: types.CString, // TODO?
  int8_t: types.int8,
  uint8_t: types.uint8,
  int16_t: types.int16,
  uint16_t: types.uint16,
  int32_t: types.int32,
  uint32_t: types.uint32,
  int64_t: types.int64,
  uint64_t: types.uint64,
  intptr_t: types.int64,
  uintptr_t: types.uint64,
};

export function addPrimitiveType(name: string, type: Type) {
  PrimitiveTypes[name] = type;
}
