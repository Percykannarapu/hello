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
    if (!featureIds.includes('geocode'))
      featureIds.push('geocode');
    return this.queryService.queryAttributeIn(layerId, 'geocode', Array.from(geocodes), false, featureIds).pipe(
      map(features => features.map(f => f.attributes as GeoAttribute)),
      reduce((acc, curr) => accumulateArrays(acc, curr), [])
    );
  }
}
