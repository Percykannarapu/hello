import { Observable, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, switchMap } from 'rxjs/operators';

export function fetchGet<T>(url: string, headers: any) : Observable<T> {
  return fromFetch(new Request(url, { headers })).pipe(
    switchMap(response => {
      if (response.ok) {
        return response.json();
      } else {
        // Server is returning a status requiring the client to try something else.
        return of({ error: true, message: `Error ${response.status}` });
      }
    }),
    catchError(err => {
      // Network or other error
      console.error(err);
      return of({ error: true, message: err.message });
    })
  );
}
