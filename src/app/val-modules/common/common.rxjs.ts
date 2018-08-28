import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

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
