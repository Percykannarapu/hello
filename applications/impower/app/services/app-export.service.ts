import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { StartBusyIndicator, StopBusyIndicator, WarningNotification } from '@val/messaging';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { Observable } from 'rxjs';
import { concatMap, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { WorkerResult, WorkerStatus } from '../../worker-shared/common/core-interfaces';
import { RestPayload, RestResponse } from '../../worker-shared/data-model/core.interfaces';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { GeoFootprintExportFormats, LocationExportFormats } from '../../worker-shared/export-workers/payloads';
import { AppConfig } from '../app.config';
import { CrossbowProfileResponse } from '../models/crossbow.model';
import { CrossBowSitesPayload, LocalAppState } from '../state/app.interfaces';
import { CreateLocationUsageMetric } from '../state/usage/targeting-usage.actions';
import { CreateGaugeMetric, CreateUsageMetric } from '../state/usage/usage.actions';
import { FileService } from '../val-modules/common/services/file.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { TradeAreaDefinition } from './app-trade-area.service';
import { UnifiedAudienceService } from './unified-audience.service';

/**
 * This service is a temporary shim to aggregate the operations needed for exporting data
 * until the data is held natively in NgRx and can be removed after that
 */

@Injectable({
  providedIn: 'root'
})
export class AppExportService {

  readonly crossbowUrl: string = 'v1/targeting/base/targetingprofile';

  constructor(private config: AppConfig,
              private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private restService: RestDataService,
              private store$: Store<LocalAppState>,
              private audienceService: UnifiedAudienceService) { }

  exportGeofootprint(selectedOnly: boolean, currentProject: ImpProject) : Observable<Action> {
    this.validateProjectForExport(currentProject, 'exporting a Geofootprint');
    const metricText = selectedOnly ? 'includeSelectedGeography' : 'includeAllGeography';
    const key = 'GFP_Export';
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Exporting Geofootprint' }));
    return this.audienceService.requestGeofootprintExportData(currentProject.methAnalysis).pipe(
      switchMap(geoVars => this.impGeofootprintGeoService.exportStore(null, GeoFootprintExportFormats.alteryx, currentProject, geoVars, selectedOnly)),
      filter(result => result.rowsProcessed > 0),
      concatMap(result => ([
        new CreateLocationUsageMetric('geofootprint', 'export', metricText, result.rowsProcessed),
        new CreateGaugeMetric({ gaugeAction: 'location-geofootprint-export' })
      ])),
      finalize(() => this.store$.dispatch(new StopBusyIndicator({ key })))
    );
  }

  exportLocations(siteType: SuccessfulLocationTypeCodes, currentProject: ImpProject) : Observable<CreateUsageMetric> {
    return this.locationExportImpl(siteType, LocationExportFormats.alteryx, null, currentProject).pipe(
      map(result => new CreateLocationUsageMetric(`${siteType.toLowerCase()}-list`, 'export', null, result.rowsProcessed))
    );
  }

  exportHomeGeoReport(siteType: SuccessfulLocationTypeCodes, currentProject: ImpProject) : Observable<CreateUsageMetric> {
    const filename = 'Home Geo Issues Log.csv';
    return this.locationExportImpl(siteType, LocationExportFormats.homeGeoIssues, filename, currentProject).pipe(
      map(result => new CreateLocationUsageMetric(`${siteType.toLowerCase()}-list`, 'export', null, result.rowsProcessed))
    );
  }

  exportValassisDigital(currentProject: ImpProject) : Observable<CreateUsageMetric> {
    const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 8);
    const filename = 'visit_locations_' + currentProject.projectId + '_' + this.config.environmentName + '_' + fmtDate + '.csv';
    const metricText = 'clientName=' + currentProject.clientIdentifierName.trim() + '~' + 'projectTrackerId=' + currentProject.projectTrackerId + '~' + 'fileName=' + filename;
    return this.locationExportImpl(ImpClientLocationTypeCodes.Site, LocationExportFormats.digital, filename, currentProject).pipe(
      map(result => new CreateLocationUsageMetric('vlh-site-list', 'send', metricText, result.rowsProcessed))
    );
  }

  exportNationalExtract(currentProject: ImpProject) : Observable<void> {
    return new Observable(observer => {
      try {
        this.audienceService.requestNationalExtractData(currentProject);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  getPrivateCrossbowProfiles(payload: CrossBowSitesPayload) : Observable<RestResponse<RestPayload<CrossbowProfileResponse>>> {
    const userIdUrl: string = this.crossbowUrl + '/search?q=targetingProfileSearch' + `&userId=${payload.id}`;
    return this.restService.get(userIdUrl);
  }

  getGroups(payload: CrossBowSitesPayload) : Observable<RestResponse<any>> {
    const groupsUrl: string = this.crossbowUrl + '/search?q=targetingGroupSearch' + `&userId=${payload.id}`;
    return this.restService.get(groupsUrl);
  }

  getGroupProfiles(payload: CrossBowSitesPayload) : Observable<RestResponse<RestPayload<CrossbowProfileResponse>>> {
    const groupProfileUrl: string = this.crossbowUrl + '/search?q=targetingProfileSearch' + `&groupId=${payload.groupId}`;
    return this.restService.get(groupProfileUrl);
  }

  getCrossbowSites(payload: CrossBowSitesPayload) : Observable<RestResponse<any>> {
    const sitesUrl: string = this.crossbowUrl + '/search?q=targetingProfileSites' + `&profileId=${payload.profileId}&siteType=0`;
    return this.restService.get(sitesUrl);
  }

  private locationExportImpl(siteType: SuccessfulLocationTypeCodes, exportFormat: LocationExportFormats, filename: string, currentProject: ImpProject) : Observable<WorkerResult> {
    const key = 'Site_Export';
    this.store$.dispatch(new StartBusyIndicator({ key, message: `Exporting ${siteType}s` }));
    return this.impGeofootprintLocationService.exportStore(filename, exportFormat, currentProject, siteType).pipe(
      tap(result => {
        if (result.status === WorkerStatus.Complete && result.rowsProcessed === 0 && exportFormat === LocationExportFormats.homeGeoIssues) {
          this.store$.dispatch(WarningNotification({
            message: 'There are no home geocoding issues to report.',
            notificationTitle: 'Home Geocode Issues Log'
          }));
        }
      }),
      finalize(() => this.store$.dispatch(new StopBusyIndicator({ key })))
    );
  }

  private validateProjectForExport(currentProject: ImpProject, exportDescription: string) : void {
    const message = `The project must be saved before ${exportDescription}`;
    if (currentProject.projectId == null) {
      throw message;
    }
  }

  public exportCustomTAIssuesLog(uploadFailures: TradeAreaDefinition[]){
    const header = 'Site #, Geocode, Reason';
    const records: string[] = [];
    records.push(header);
    uploadFailures.forEach(record => {
        records.push(`${record.store}, ${record.geocode}, ${record.message}`);
    });
    FileService.downloadDelimitedFile('Custom TA Issues Log.csv', records);
  }

  public exportMCIssuesLog(records: string[]){
    FileService.downloadDelimitedFile('Must Cover Issues Log.csv', records);
  }

}
