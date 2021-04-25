import { performance } from 'perf_hooks';
import { DefaultedMap } from '../../Helpers';
import { NativeTypeInstance } from '../../NativeType';
import { getTypeName } from '../../TypeHelpers';

interface ReadInfo {
  start: number;
  end: number;
}

interface ClassPerformanceMeasures {
  readCount: number;
  readDuration: number;
  raw: ReadInfo[];
}

export class PerformanceMap {
  private meausresByclass = new DefaultedMap<string, ClassPerformanceMeasures>(() => ({
    readCount: 0,
    readDuration: 0,
    raw: [],
  }));

  measureReadOperation<T>(instance: NativeTypeInstance, task: () => T): T {
    const start = performance.now();
    const result = task();
    const end = performance.now();
    const mesaures = this.meausresByclass.get(getTypeName(instance.constructor));
    mesaures.raw.push({ start, end });
    ++mesaures.readCount;
    mesaures.readDuration += end - start;
    return result;
  }
}
