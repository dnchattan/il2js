/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable no-restricted-syntax */
import { Address, addressToNumber, offsetAddress } from './Address';

describe('Address', () => {
  it('addressToNumber(string)', () => {
    expect(addressToNumber('42')).toStrictEqual(42);
  });
  it('addressToNumber(bigint)', () => {
    expect(addressToNumber(BigInt(42))).toStrictEqual(42);
  });
  it('addressToNumber(number)', () => {
    expect(addressToNumber(42)).toStrictEqual(42);
  });
});

describe('offset', () => {
  const inputTypes: [string, (n: Address) => any][] = [
    ['number', (n: Address) => n],
    ['string', (n: Address) => n.toString()],
    ['bigint', (n: Address) => BigInt(n)],
  ];
  const inputs: [Address[], Address][] = [
    [[5, 10], 15],
    [[0, 0], 0],
    [[10, -5], 5],
    [[10, -5, 15], 20],
    [[Number.MAX_SAFE_INTEGER, 50], BigInt(Number.MAX_SAFE_INTEGER) + BigInt(50)],
  ];
  for (const [leftName, leftFn] of inputTypes) {
    for (const [rightName, rightFn] of inputTypes) {
      it(`${leftName}, ${rightName}`, () => {
        for (const [[left, ...right], expected] of inputs) {
          expect(offsetAddress(leftFn(left), ...right.map(rightFn))).toEqual(expected);
        }
      });
    }
  }
});
