import { Observable } from 'rxjs';

export interface CachedObservable<T> extends Observable<T> {
  getValue() : T;
}
