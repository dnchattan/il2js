import { PrimitiveTypes } from '@il2js/core';

const PrimitiveTypeMapping: Record<keyof typeof PrimitiveTypes, string | undefined> = {
  string: 'string',
  object: '{}',
  void: 'void',
  int64: 'number',
  ushort: 'number',
  int: 'number',
  uint64: 'number',
  float: 'number',
  uint: 'number',
  long: 'number',
  double: 'number',
  int8: 'number',
  ulong: 'number',
  Object: '{}',
  uint8: 'number',
  longlong: 'number',
  CString: 'string',
  int16: 'number',
  ulonglong: 'number',
  bool: 'boolean',
  uint16: 'number',
  char: 'number',
  byte: 'number',
  sbyte: 'number',
  int32: 'number',
  uchar: 'number',
  size_t: 'number',
  uint32: 'number',
  short: 'number',
  int8_t: 'number',
  uint8_t: 'number',
  int16_t: 'number',
  uint16_t: 'number',
  int32_t: 'number',
  uint32_t: 'number',
  int64_t: 'number',
  uint64_t: 'number',
  intptr_t: 'number',
  uintptr_t: 'number',
};

export function getTypeMapping(name: string): string {
  return PrimitiveTypeMapping[name] ?? 'unknown';
}

export function addTypeMapping(name: string, typeName: string) {
  PrimitiveTypeMapping[name] = typeName;
}
