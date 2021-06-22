import { Observable } from 'rxjs';
import { filter, map, pairwise, startWith } from 'rxjs/operators';

export const filterArray = <T>(callbackFn: (value: T, index: number, array: T[]) => boolean) => (source$: Observable<T[]>) : Observable<T[]> => {
  return source$.pipe(
    map(items => items.filter(callbackFn))
  );
};

export const mapArray = <T, U>(selector: (value: T, index: number, array: T[]) => U) => (source$: Observable<T[]>) : Observable<U[]> => {
  return source$.pipe(
    map(items => items.map(selector))
  );
};

export const distinctArray = <T>() => (source$: Observable<T[]>) : Observable<T[]> => {
  return source$.pipe(
    map(items => new Set(items)),
    map(itemSet => Array.from(itemSet))
  );
};

/**
 * Filters an rxjs pipeline to prevent the flow of events until a non-zero value drops back down to 0.
 * If the value starts at zero it will still filter until the value leaves and then returns.
 * Will only fire once when the value reaches zero. To fire again, the value must leave and return again.
 */
export function skipUntilNonZeroBecomesZero() : (source$: Observable<number>) => Observable<number> {
  return source$ => source$.pipe(
    startWith(0),
    pairwise(),
    filter(([prev, curr]) => prev !== 0 && curr === 0),
    map(([, curr]) => curr)
  );
}

/**
 * Filters an rxjs pipeline to prevent the flow of events until a boolean value transitions from false to true.
 * If the value starts true it will still filter until the value leaves and then returns.
 * Will only fire once when the value becomes true. To fire again, the value must leave and return again.
 */
export function skipUntilFalseBecomesTrue() : (source$: Observable<boolean>) => Observable<boolean> {
  return source$ => source$.pipe(
    startWith(true),
    pairwise(),
    filter(([prev, curr]) => !prev && curr),
    map(([, curr]) => curr)
  );
}
