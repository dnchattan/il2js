export function assert(value: any): asserts value;
export function assert(value: any, message: string): asserts value;
export function assert<TError extends typeof Error = typeof Error>(
  value: any,
  errorType: TError,
  ...args: ConstructorParameters<TError>
): asserts value;
export function assert<TError extends typeof Error = typeof Error>(value: any, ...args: unknown[]): asserts value {
  if (!value) {
    if (args.length === 0) {
      throw new Error(`**Assert** ${value}`);
    }
    const [arg0, ...errorArgs] = args;
    if (typeof arg0 === 'string') {
      throw new Error(`**Assert** ${arg0}`);
    } else {
      if (errorArgs.length === 0) {
        throw new (arg0 as TError)(`**Assert** ${value}`);
      }
      throw new (arg0 as TError)(...(errorArgs as ConstructorParameters<TError>));
    }
  }
}
