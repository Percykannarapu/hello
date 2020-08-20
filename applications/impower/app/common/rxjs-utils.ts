import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const mapFeaturesToGeocode = (excludePOBs: boolean) => (source$: Observable<__esri.Graphic[]>) : Observable<string[]> => {
  return source$.pipe(
    map(items => items.reduce((acc, curr) => {
      if (!(excludePOBs && curr.attributes.pob === 'B')) {
        acc.push(curr.attributes.geocode);
      }
      return acc;
    }, [] as string[])),
  );
};
