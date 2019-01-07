import { Observable } from 'rxjs';
import { distinctUntilChanged, map, retryWhen, scan } from 'rxjs/operators';
import { Action } from '@ngrx/store';

export const filterArray = <T>(filter: (value: T, index: number, array: T[]) => boolean) => (source$: Observable<T[]>) : Observable<T[]> => {
  return source$.pipe(
    map(items => items.filter(filter))
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
export function toPayload<T, U>() : (source$: Observable<ActionWithPayload<T>>) => Observable<T>;
export function toPayload<T, U>(selector: (payload: T) => U) : (source$: Observable<ActionWithPayload<T>>) => Observable<U>;
export function toPayload<T, U>(selector?: (payload: T) => U) : (source$: Observable<ActionWithPayload<T>>) => Observable<T | U> {
  return source$ => source$.pipe(
    map(action => action.payload),
    map(payload => selector != null ? selector(payload) : payload)
  );
}
