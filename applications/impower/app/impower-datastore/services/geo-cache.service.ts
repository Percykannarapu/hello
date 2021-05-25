import { Injectable } from '@angular/core';
import { isNotNil, toNullOrNumber } from '@val/common';
import { concat, EMPTY, Observable, of } from 'rxjs';
import { last, map } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { RestDataService } from '../../val-modules/common/services/restdata.service';

@Injectable({
  providedIn: 'root'
})
export class GeoCacheService {

  constructor(private config: AppConfig,
              private restService: RestDataService) { }

  public refreshCache(geos: Set<string>, txId: number) : Observable<number> {
    const deleteCall = isNotNil(txId) ? this.removeCache(txId) : of(null);
    const cacheCall = geos?.size > 0 ? this.cacheGeos(geos) : EMPTY;
    return concat(deleteCall, cacheCall).pipe(
      map(result => toNullOrNumber(result)),
      last()
    );
  }

  public cacheGeos(geos: Set<string>) : Observable<number> {
    const payload = { chunks: this.config.geoInfoQueryChunks, geocodes: Array.from(geos) };
    return this.restService.post(this.config.serviceUrlFragments.populateGeoCacheUrl, [payload]).pipe(
        map(response => response.payload.transactionId)
    );
  }

  public removeCache(transactionId: number) : Observable<void> {
    return this.restService.delete(this.config.serviceUrlFragments.deleteGeoCacheUrl, transactionId).pipe(
      map(() => { return; })
    );
  }
}
