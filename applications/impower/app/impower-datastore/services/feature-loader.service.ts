import { Injectable } from '@angular/core';
import { accumulateArrays } from '@val/common';
import { EsriQueryService } from '@val/esri';
import { Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { GeoAttribute } from '../state/geo-attributes/geo-attributes.model';

@Injectable({
  providedIn: 'root'
})
export class FeatureLoaderService {

  constructor(private queryService: EsriQueryService) { }

  loadAttributesFromFeatures(layerId: string, geocodes: Set<string>, featureIds: string[]) : Observable<GeoAttribute[]> {
    if (!featureIds.includes('geocode')) featureIds.push('geocode');
    const geoArray = Array.from(geocodes);
    return this.queryService.queryAttributeIn(layerId, 'geocode', geoArray, false, featureIds).pipe(
      map(features => features.map(f => f.attributes as GeoAttribute)),
      reduce((acc, curr) => accumulateArrays(acc, curr), [] as GeoAttribute[]),
      // this code ensures we return an "empty" result for a geocode that was not found via the query
      map(newAttributes => {
        const newGeos = new Set(newAttributes.map(a => a.geocode));
        const missingGeos = geoArray.reduce((a, c) => newGeos.has(c) ? a : [...a, { geocode: c, hhld_s: 0, hhld_w: 0 }], []);
        newAttributes.push(...missingGeos);
        return newAttributes;
      })
    );
  }
}
