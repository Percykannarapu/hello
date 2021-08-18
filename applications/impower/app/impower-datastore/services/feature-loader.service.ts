import { Injectable } from '@angular/core';
import { accumulateArrays } from '@val/common';
import { EsriQueryService } from '@val/esri';
import { EMPTY, Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { quadPartitionGeos } from '../../common/quad-tree';
import { GeoAttribute } from '../state/transient/geo-attributes/geo-attributes.model';

@Injectable({
  providedIn: 'root'
})
export class FeatureLoaderService {

  constructor(private queryService: EsriQueryService,
              private appConfig: AppConfig) { }

  loadAttributesFromFeatures(layerId: string, geoLocations: { geocode: string, xcoord: number, ycoord: number }[], featureIds: string[]) : Observable<GeoAttribute[]> {
    if (!featureIds.includes('geocode')) featureIds.push('geocode');
    const partitionedGeos = quadPartitionGeos(geoLocations).map(chunk => chunk.map(c => c.geocode));
    const geoArray = partitionedGeos.flatMap(pg => pg);
    return this.appConfig.isBatchMode ? EMPTY : this.queryService.queryAttributeChunksIn(layerId, 'geocode', partitionedGeos, false, featureIds).pipe(
      map(features => features.map(f => f.attributes as GeoAttribute)),
      reduce((acc, curr) => accumulateArrays(acc, curr), [] as GeoAttribute[]),
      // this code ensures we return an "empty" result for a geocode that was not found via the query
      map(newAttributes => {
        const newGeos = new Set(newAttributes.map(a => a.geocode));
        const missingGeos = geoArray.reduce((a, c) => {
          if (!newGeos.has(c)) {
            a.push({geocode: c, hhld_s: 0, hhld_w: 0});
          }
          return a;
        }, []);
        newAttributes.push(...missingGeos);
        return newAttributes;
      })
    );
  }
}
