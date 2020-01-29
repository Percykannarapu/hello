import { mapArray } from '@val/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const mapFeaturesToGeocode = (excludePOBs: boolean) => (source$: Observable<__esri.Graphic[]>) : Observable<string[]> => {
  return source$.pipe(
    map(items => {
      if (excludePOBs) {
        return items.filter(f => f.attributes.pob !== 'B');
      } else {
        return items;
      }
    }),
    mapArray(f => f.attributes.geocode)
  );
};
