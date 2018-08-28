import { Injectable } from '@angular/core';
import { Observable, merge, of } from 'rxjs';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { map, tap } from 'rxjs/operators';
import { AppMessagingService } from './app-messaging.service';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { UsageService } from './usage.service';
import { FileService, Parser, ParseResponse } from '../val-modules/common/services/file.service';
import { AppStateService } from './app-state.service';

@Injectable()
export class AppGeocodingService {

  private duplicateKeyMap = new Map<string, string[]>();

  constructor(private messageService: AppMessagingService,
              private restService: RestDataService,
              private usageService: UsageService,
              private config: AppConfig,
              private appStateService: AppStateService) {
    this.duplicateKeyMap.set('Site', []);
    this.duplicateKeyMap.set('Competitor', []);
    this.appStateService.getClearUserInterfaceObs().subscribe(flag => this.clearFields(flag));
  }

  public createRequestsFromRaw(dataRows: string[], siteType: string, parser: Parser<ValGeocodingRequest>) : ValGeocodingRequest[] {
    const header: string = dataRows.shift();
    let result = [];
    try {
      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, dataRows, parser, this.duplicateKeyMap.get(siteType));
     if (data == null ){
      this.messageService.showErrorNotification('Site List Upload Error', `Please define radii values >0 and <= 50 for all ${siteType}s.`);
     } else {
      if (data.failedRows.length > 0) {
        console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.messageService.showErrorNotification('Geocoding Error', `There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      } else {
        if (data.duplicateKeys.length > 0) {
          const topDuplicateNumbers = data.duplicateKeys.slice(0, 5).join(', ');
          const dupeMessage = data.duplicateKeys.length > 5 ? `${topDuplicateNumbers} (+ ${data.duplicateKeys.length - 5} more)` : topDuplicateNumbers;
          this.messageService.showErrorNotification('Geocoding Error', `There were ${data.duplicateKeys.length} duplicate store numbers in the uploaded file: ${dupeMessage}`);
        } else if (data.parsedData.map(d => d.state).filter(s => s.length > 2).length > 0) {
          this.messageService.showErrorNotification('Geocoding Error', 'Location State values longer than 2 characters are not supported');
        }  else {
          result = data.parsedData.map(d => new ValGeocodingRequest(d));
          this.duplicateKeyMap.get(siteType).push(...result.map(r => r.number));
        }
      }
    }
     
    } catch (e) {
      this.messageService.showErrorNotification('Geocoding Error', `${e}`);
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
            const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: `${siteType.toLowerCase()}-data-file`, action: 'upload' });
            const metricText = `success=${goodCount}~error=${failCount}`;
            this.usageService.createCounterMetric(usageMetricName, metricText, allLocations.length);
          }
          if (failCount > 0) {
            this.messageService.showErrorNotification('Error', 'Geocoding Error');
          } else if (successCount > 0) {
            this.messageService.showSuccessNotification('Success', 'Geocoding Success');
          }
        }),
    );
  }

  public clearFields(flag: boolean){
    if (flag){
        this.duplicateKeyMap.clear();
        this.duplicateKeyMap = new Map<string, string[]>();
        this.duplicateKeyMap.set('Site', []);
        this.duplicateKeyMap.set('Competitor', []);
    }
  }

}
