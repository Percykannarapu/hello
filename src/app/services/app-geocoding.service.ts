import { Injectable } from '@angular/core';
import { merge, Observable, of } from 'rxjs';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { map, tap } from 'rxjs/operators';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';
import { FileService, Parser, ParseResponse } from '../val-modules/common/services/file.service';
import { AppStateService } from './app-state.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.interfaces';
import { CreateLocationUsageMetric } from '../state/usage/targeting-usage.actions';
import { ErrorNotification, SuccessNotification } from '../messaging';

@Injectable()
export class AppGeocodingService {

  public duplicateKeyMap = new Map<SuccessfulLocationTypeCodes, Set<string>>();

  constructor(private restService: RestDataService,
              private config: AppConfig,
              private appStateService: AppStateService,
              private store$: Store<AppState>) {
    this.clearDuplicates();
    this.appStateService.clearUI$.subscribe(() => this.clearDuplicates());
  }

  public createRequestsFromRaw(dataRows: string[], siteType: SuccessfulLocationTypeCodes, parser: Parser<ValGeocodingRequest>) : ValGeocodingRequest[] {
    const header: string = dataRows.shift();
    let result = [];
    try {
      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, dataRows, parser, this.duplicateKeyMap.get(siteType));
      if (data == null ) {
        this.store$.dispatch(new ErrorNotification({ message: `Please define radii values >0 and <= 50 for all ${siteType}s.`, notificationTitle: 'Site List Upload Error' }));
      } else {
        if (data.failedRows.length > 0) {
          console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
          this.store$.dispatch(new ErrorNotification({ message: `There were ${data.failedRows.length} rows in the uploaded file that could not be read.`, notificationTitle: 'Geocoding Error' }));
        } else {
          const siteNumbers = [];
          data.parsedData.forEach(siteReq => siteNumbers.push(siteReq.number));
          if ( siteNumbers.filter((val, index, self) => self.indexOf(val) !== index ).length > 0  && siteType !== ImpClientLocationTypeCodes.Competitor){
            this.store$.dispatch(new ErrorNotification({ message: 'Duplicate Site Numbers exist in your upload file.', notificationTitle: 'Geocoding Error' }));
            result = [];
            return result;
          }
          if (data.duplicateKeys.length > 0 && siteType !== ImpClientLocationTypeCodes.Competitor) {
            const topDuplicateNumbers = data.duplicateKeys.slice(0, 5).join(', ');
            const dupeMessage = data.duplicateKeys.length > 5 ? `${topDuplicateNumbers} (+ ${data.duplicateKeys.length - 5} more)` : topDuplicateNumbers;
            this.store$.dispatch(new ErrorNotification({ message: `There were ${data.duplicateKeys.length} duplicate store numbers in the uploaded file: ${dupeMessage}`, notificationTitle: 'Geocoding Error' }));
          } else {
            result = data.parsedData.map(d => new ValGeocodingRequest(d));
            result.map(r => r.number).forEach(n => {
              this.duplicateKeyMap.get(siteType).add(n);
            });
          }
        }
      }
    } catch (e) {
      this.store$.dispatch(new ErrorNotification({ message: `${e}`, notificationTitle: 'Geocoding Error' }));
    }
    return result;
  }

  public getGeocodingResponse(sites: ValGeocodingRequest[], siteType: string) : Observable<ValGeocodingResponse[]> {
    const providedSites: ValGeocodingResponse[] = sites.filter(s => s.hasGoodLatAndLong()).map(s => s.toGeocodingResponse('PROVIDED'));
    const badLatLongSites: ValGeocodingResponse[] = sites.filter(s => s.hasBadLatAndLong()).map(s => s.toGeocodingResponse('BAD XY'));
    const otherSites = sites.filter(s => s.hasNoLatAndLong()).map(s => s.cleanUploadRequest());
    const observables: Observable<ValGeocodingResponse[]>[] = [of(providedSites), of(badLatLongSites)];
    const allLocations: ValGeocodingResponse[] = [];

    if (otherSites.length > 0) {
      const requestData = chunkArray(otherSites, this.config.maxValGeocodingReqSize);
      requestData.forEach(reqList => {
        const obs = this.restService.post('v1/geocoder/multiplesites', reqList).pipe(
          map(data => data.payload),
          map(rawData => rawData.map(d => new ValGeocodingResponse(d))),
        );
        observables.push(obs);
      });
    }
    return merge(...observables, 4).pipe(
      tap(
        locations => allLocations.push(...locations),
        null,
        () => {
          const successCount = allLocations.filter(loc => loc['Geocode Status'] === 'SUCCESS').length;
          const providedCount = allLocations.filter(loc => loc['Geocode Status'] === 'PROVIDED').length;
          const goodCount = successCount + providedCount;
          const failCount = allLocations.length - goodCount;
          if (allLocations.length > 1) {
            const metricText = `success=${goodCount}~error=${failCount}`;
            this.store$.dispatch(new CreateLocationUsageMetric(`${siteType.toLowerCase()}-data-file`, 'upload', metricText, allLocations.length));
          }
          if (failCount > 0) {
            this.store$.dispatch(new ErrorNotification({ message: 'Geocoding Error' }));
          } else if (successCount > 0) {
            this.store$.dispatch(new SuccessNotification({ message: 'Geocoding Success' }));
          }
        }),
    );
  }

  public clearDuplicates(){
    this.duplicateKeyMap.set(ImpClientLocationTypeCodes.Site, new Set<string>());
    this.duplicateKeyMap.set(ImpClientLocationTypeCodes.Competitor, new Set<string>());
  }

  public removeFromDuplicateCheck(siteType: SuccessfulLocationTypeCodes, siteNumbers: string[]) : void {
    if (siteNumbers == null || siteNumbers.length === 0 || !this.duplicateKeyMap.has(siteType)) return;
    siteNumbers.forEach(sn => {
      this.duplicateKeyMap.get(siteType).delete(sn);
    });
  }
}
