import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { chunkArray } from '@val/common';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { merge, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { ValGeocodingResponse } from '../models/val-geocoding-response.model';
import { LocalAppState } from '../state/app.interfaces';
import { resetNamedForm } from '../state/forms/forms.actions';
import { CreateLocationUsageMetric } from '../state/usage/targeting-usage.actions';
import { FileService, Parser, ParseResponse } from '../val-modules/common/services/file.service';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppStateService } from './app-state.service';

@Injectable()
export class AppGeocodingService {

  public duplicateKeyMap = new Map<SuccessfulLocationTypeCodes, Set<string>>();

  constructor(private restService: RestDataService,
              private config: AppConfig,
              private appStateService: AppStateService,
              private store$: Store<LocalAppState>,
              private logger: LoggingService) {
    this.clearDuplicates();
    this.appStateService.clearUI$.subscribe(() => this.clearDuplicates());
  }

  public createRequestsFromRaw(dataRows: string[], siteType: SuccessfulLocationTypeCodes, parser: Parser<ValGeocodingRequest>) : ValGeocodingRequest[] {
    const header: string = dataRows.shift();
    let result = [];
    try {
      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, dataRows, parser, this.duplicateKeyMap.get(siteType));
      if (data != null && (data.duplicateHeaders.length > 0 || data.invalidColLengthHeaders.length > 0)){
        if (data.duplicateHeaders.length > 0)
            this.store$.dispatch(new ErrorNotification({ message: 'The upload file contains duplicate headers, please fix the file and upload again.', notificationTitle: 'Duplicate Headers' }));
        if (data.invalidColLengthHeaders.length > 0)
            this.store$.dispatch(new ErrorNotification({ message: 'Column headers must be 30 characters or less, please fix the file and upload again.', notificationTitle: 'Invalid Headers' }));
        //throw new Error();
        data.parsedData = [];
      }
      if (data != null && Object.keys(data.invalidRowHeaders).length > 0){

        Object.keys(data.invalidRowHeaders).map((headerCol) => {
          //this.logger.info.log('index values====>', record[headerCol], headerCol);
          this.store$.dispatch(new ErrorNotification({message: `The ${headerCol} column cannot exceed ${data.invalidRowHeaders[headerCol]} characters per site`, notificationTitle: 'Invalid Upload Data'}));
        });
        data.parsedData = [];
        //throw new Error();
      }
      if (data == null ) {
        this.store$.dispatch(new ErrorNotification({ message: `Please define radii values >0 and <= 50 for all ${siteType}s.`, notificationTitle: 'Location Upload Error' }));
      } else {
        if (data.failedRows.length > 0) {
          this.logger.error.log('There were errors parsing the following rows in the CSV: ', data.failedRows);
          const failedString = '\n \u0007 ' + data.failedRows.join('\n\n\u0007 ');
          this.store$.dispatch(new ErrorNotification({ message: `There were ${data.failedRows.length} rows in the uploaded file that could not be read. \n ${failedString}`, notificationTitle: 'Location Upload Error' }));
        } else {
          const siteNumbers = [];
          data.parsedData.forEach(siteReq => siteNumbers.push(siteReq.number));
          if ( siteNumbers.filter((val, index, self) => self.indexOf(val) !== index ).length > 0  && siteType !== ImpClientLocationTypeCodes.Competitor){
            this.store$.dispatch(new ErrorNotification({ message: 'Duplicate Site Numbers exist in your upload file.', notificationTitle: 'Location Upload Error' }));
            result = [];
            return result;
          }
          if (data.duplicateKeys.length > 0 && siteType !== ImpClientLocationTypeCodes.Competitor) {
            const topDuplicateNumbers = data.duplicateKeys.slice(0, 5).join(', ');
            const dupeMessage = data.duplicateKeys.length > 5 ? `${topDuplicateNumbers} (+ ${data.duplicateKeys.length - 5} more)` : topDuplicateNumbers;
            this.store$.dispatch(new ErrorNotification({ message: `There were ${data.duplicateKeys.length} duplicate store numbers in the uploaded file: ${dupeMessage}`, notificationTitle: 'Location Upload Error' }));
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
      tap(locs => this.logger.debug.log('Geocoding response count', locs.length)),
      tap({
        next: locations => allLocations.push(...locations),
        complete: () => {
          const successCount = allLocations.filter(loc => loc['Geocode Status'] === 'SUCCESS').length;
          const providedCount = allLocations.filter(loc => loc['Geocode Status'] === 'PROVIDED').length;
          const goodCount = successCount + providedCount;
          const failCount = allLocations.length - goodCount;
          if (allLocations.length > 1) {
            const metricText = `success=${goodCount}~error=${failCount}`;
            this.store$.dispatch(new CreateLocationUsageMetric(`${siteType.toLowerCase()}-data-file`, 'upload', metricText, allLocations.length));
          }
          if (allLocations.length === 1) {
            this.store$.dispatch(resetNamedForm({path: 'addLocation'}));
          }
          if (failCount > 0) {
            this.store$.dispatch(new ErrorNotification({notificationTitle: 'Geocoding Error', message: 'Refer to the interactive geocoding tab. Accept XY for center of ZIP code or modify the address and resubmit.'}));
          } else if (successCount > 0) {
            this.store$.dispatch(new SuccessNotification({message: 'Geocoding Success'}));
          }
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
