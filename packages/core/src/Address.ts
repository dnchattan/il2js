import { excludeUndefined } from './Helpers';

export type Address = number | string | bigint;
export type Offset = number | string | bigint;
export type Size = number;

export function addressToNumber(value: Address): number {
  if (typeof value === 'string') {
    return parseInt(value, value.startsWith('0x') ? 16 : 10);
  }
  return Number(value);
}

export function offsetAddress(address: Address, ...offsets: (Offset | undefined)[]): Address {
  const result = excludeUndefined(offsets).reduce(
    (final: bigint, offset) =>
      final + BigInt(typeof offset === 'string' ? parseInt(offset, offset.startsWith('0x') ? 16 : 10) : offset),
    BigInt(typeof address === 'string' ? parseInt(address, address.startsWith('0x') ? 16 : 10) : address)
  );
  if (result < Number.MAX_SAFE_INTEGER) {
    return Number(result);
  }
  return result;
}
