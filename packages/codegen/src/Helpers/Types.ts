export type Head<T extends any[]> = T[0];
export type FnWithArgs<T extends any[]> = (...args: T) => void;
export type TailArgs<T> = T extends (x: any, ...args: infer U) => any ? U : never;
export type Tail<T extends any[]> = TailArgs<FnWithArgs<T>>;
export type StaticAssert<T extends true | Message, Message extends string> = never & T;
export type Extends<T, U> = T extends U ? true : false;
export type Exact<T, U> = T extends U ? (U extends T ? true : false) : false;
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type ValueOf<T> = T[keyof T];
