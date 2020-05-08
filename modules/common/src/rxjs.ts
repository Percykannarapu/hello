import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, pairwise, retryWhen, scan, startWith } from 'rxjs/operators';

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

export const distinctUntilArrayContentsChanged = <T, U>(selector: (value: T, index: number, array: T[]) => U) => (source$: Observable<T[]>) : Observable<T[]> => {
  return source$.pipe(
    distinctUntilChanged((x: T[], y: T[]) => JSON.stringify(x.map(selector)) === JSON.stringify(y.map(selector)))
  );
};

export const retryOnError = <T>(attempts: number, errorFilter?: (err: any) => boolean) => (source$: Observable<T>) : Observable<T> => {
  const internalFilter = errorFilter || (() => true);
  return source$.pipe(
    retryWhen(errors => {
      return errors.pipe(
        scan<any, number>((errorCount, err) => {
          if (internalFilter(err) && errorCount < attempts) {
            console.warn(`Retrying due to error. Attempt ${errorCount + 1}.`, err);
            return errorCount + 1;
          } else {
            throw err;
          }
        }, 0)
      );
    })
  );
};

export const retryOnTimeout = <T>(attempts: number) => (source$: Observable<T>) : Observable<T> => {
  return source$.pipe(
    retryOnError(attempts, (err) => err && err.message && err.message.toLowerCase().includes('timeout'))
  );
};

export type ActionWithPayload<T> = Action & { payload: T };
/**
 * @deprecated Use Action & Effect Creators to eliminate the need for this helper
 */
export function toPayload<T, U>() : (source$: Observable<ActionWithPayload<T>>) => Observable<T>;
export function toPayload<T, U>(selector: (payload: T) => U) : (source$: Observable<ActionWithPayload<T>>) => Observable<U>;
export function toPayload<T, U>(selector?: (payload: T) => U) : (source$: Observable<ActionWithPayload<T>>) => Observable<T | U> {
  return source$ => source$.pipe(
    map(action => action.payload),
    map(payload => selector != null ? selector(payload) : payload)
  );
}

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
