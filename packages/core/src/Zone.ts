import { IOContext } from './IOContext';

let context: IOContext;

export function getCurrentIOContext(): IOContext;
export function getCurrentIOContext(throwIfNull: false): IOContext | undefined;
export function getCurrentIOContext(throwIfNull: boolean = true): IOContext | undefined {
  const ioContext = context;
  if (throwIfNull && !ioContext) {
    throw new ReferenceError('No ioContext has been defined in this fork');
  }
  return ioContext;
}

export function setCurrentIOContext(ioContext: IOContext) {
  context = ioContext;
  ioContext.init?.();
  return {
    run<T>(callback: () => T): T {
      return callback();
    },
  };
}
