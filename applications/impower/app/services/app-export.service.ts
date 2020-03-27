import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { ErrorNotification } from '@val/messaging';
import { RestResponse } from 'app/models/RestResponse';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { CrossBowSitesPayload, LocalAppState } from '../state/app.interfaces';
import { CreateLocationUsageMetric } from '../state/usage/targeting-usage.actions';
import { CreateGaugeMetric, CreateUsageMetric } from '../state/usage/usage.actions';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { TradeAreaDefinition } from './app-trade-area.service';
import { TargetAudienceService } from './target-audience.service';

/**
 * This service is a temporary shim to aggregate the operations needed for exporting data
 * until the data is held natively in NgRx and can be removed after that
 */

@Injectable({
  providedIn: 'root'
})
export class AppExportService {

  readonly crossbowUrl: string = 'v1/targeting/base/targetingprofile';

  constructor(private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private targetAudienceService: TargetAudienceService,
              private impProjectService: ImpProjectService,
              private restService: RestDataService,
              private store$: Store<LocalAppState>,
              private config: AppConfig,
              private logger: LoggingService) { }

  exportGeofootprint(selectedOnly: boolean, currentProject: ImpProject) : Observable<Action> {
    return new Observable(observer => {
      try {
        this.validateProjectForExport(currentProject, 'exporting a Geofootprint');
        const storeFilter: (geo: ImpGeofootprintGeo) => boolean = selectedOnly ? (geo => geo.isActive === true) : null;
        const filename = this.impGeofootprintGeoService.getFileName(currentProject.methAnalysis, currentProject.projectId);
        this.impGeofootprintGeoService.exportStore(filename, EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx, currentProject.methAnalysis, storeFilter);
        const metricValue = this.impGeofootprintGeoService.get().length;
        const metricText = selectedOnly ? 'includeSelectedGeography' : 'includeAllGeography';
        observer.next(new CreateLocationUsageMetric('geofootprint', 'export', metricText, metricValue));
        observer.next(new CreateGaugeMetric({ gaugeAction: 'location-geofootprint-export' }));
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  exportLocations(siteType: SuccessfulLocationTypeCodes, currentProject: ImpProject) : Observable<CreateUsageMetric> {
    return new Observable(observer => {
      try {
        const pluralType = `${siteType}s`;
        const filename = this.impGeofootprintLocationService.getFileName(currentProject.projectId, pluralType);
        const metricValue = this.locationExportImpl(siteType, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, filename, currentProject);
        observer.next(new CreateLocationUsageMetric(`${siteType.toLowerCase()}-list`, 'export', null, metricValue));
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  exportHomeGeoReport(siteType: SuccessfulLocationTypeCodes) : Observable<CreateUsageMetric> {
    const currentProject = this.impProjectService.get();
    return new Observable(observer => {
      try {
        const filename = 'Home Geo Issues Log.csv';
        const metricValue = this.locationExportImpl(siteType, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.homeGeoIssues, filename, currentProject[0], true);
        observer.next(new CreateLocationUsageMetric(`${siteType.toLowerCase()}-list`, 'export', null, metricValue));
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  exportValassisDigital(currentProject: ImpProject) : Observable<CreateUsageMetric> {
    return new Observable(observer => {
      try {
        this.validateProjectForExport(currentProject, 'sending the custom site list to Valassis Digital');
        const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 8);
        const filename = 'visit_locations_' + currentProject.projectId + '_' + this.config.environmentName + '_' + fmtDate + '.csv';
        const metricValue = this.locationExportImpl(ImpClientLocationTypeCodes.Site, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital, filename, currentProject);
        const metricText = 'clientName=' + currentProject.clientIdentifierName.trim() + '~' + 'projectTrackerId=' + currentProject.projectTrackerId + '~' + 'fileName=' + filename;
        /*const clientIdentifierName = currentProject.clientIdentifierName != null ? currentProject.clientIdentifierName.trim() : null;
        const metricText = 'clientName=' + clientIdentifierName + '~' + 'projectTrackerId=' + currentProject.projectTrackerId + '~' + 'fileName=' + filename;*/
        observer.next(new CreateLocationUsageMetric('vlh-site-list', 'send', metricText, metricValue));
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });

  }

  exportNationalExtract(currentProject: ImpProject) : Observable<void> {
    return new Observable(observer => {
      try {
        this.targetAudienceService.exportNationalExtract(currentProject.methAnalysis, currentProject.projectId);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  getPrivateCrossbowProfiles(payload: CrossBowSitesPayload) : Observable<RestResponse> {
    const userIdUrl: string = this.crossbowUrl + '/search?q=targetingProfileSearch' + `&userId=${payload.id}`;
    // const userIdUrl: string = this.crossbowUrl + '/search?q=targetingProfileSearch' + `&userId=13660`;
    return this.restService.get(userIdUrl);
  }

  getGroups(payload: CrossBowSitesPayload) : Observable<RestResponse> {
    const groupsUrl: string = this.crossbowUrl + '/search?q=targetingGroupSearch' + `&userId=${payload.id}`;
    // const groupsUrl: string = this.crossbowUrl + `/search?q=targetingGroupSearch&userId=13660`;
    return this.restService.get(groupsUrl);
  }

  getGroupProfiles(payload: CrossBowSitesPayload) : Observable<RestResponse> {
    const groupProfileUrl: string = this.crossbowUrl + '/search?q=targetingProfileSearch' + `&groupId=${payload.groupId}`;
    // const groupProfileUrl: string = this.crossbowSitesUrl + '/search?q=targetingProfileSearch' + `&groupId=30`;
    return this.restService.get(groupProfileUrl);
  }

  getCrossbowSites(payload: CrossBowSitesPayload) : Observable<RestResponse> {
    const sitesUrl: string = this.crossbowUrl + '/search?q=targetingProfileSites' + `&profileId=${payload.profileId}&siteType=0`;
    return this.restService.get(sitesUrl);
  }

  private locationExportImpl(siteType: SuccessfulLocationTypeCodes, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, filename: string, currentProject: ImpProject, homeGeoIssueOnly: boolean = false) : number {
    const storeFilter: (loc: ImpGeofootprintLocation) => boolean =
            loc => loc.clientLocationTypeCode === siteType && (!homeGeoIssueOnly || loc.impGeofootprintLocAttribs.some(a => a.attributeCode === 'Home Geocode Issue' && a.attributeValue === 'Y'));
            const pluralType = `${siteType}s`;
    const isDigital = exportFormat === EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital;
    const metricCount =  this.impGeofootprintLocationService.get().filter(storeFilter).length;
   if (metricCount === 0 && exportFormat === EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.homeGeoIssues ){
    this.store$.dispatch(new ErrorNotification({ message: 'There are no home geocoding issues to report.', notificationTitle: 'Home Geocode Issues Log' }));
    } else {
    this.impGeofootprintLocationService.exportStore(filename, exportFormat, currentProject, isDigital, storeFilter, pluralType.toUpperCase());
    }
    return metricCount;
  }


  private validateProjectForExport(currentProject: ImpProject, exportDescription: string) : void {
    const message = `The project must be saved with a valid Project Tracker ID before ${exportDescription}`;
    if (currentProject.projectId == null || currentProject.projectTrackerId == null) {
      throw message;
    }
  }

  public exportCustomTAIssuesLog(uploadFailures: TradeAreaDefinition[]){
    //this.logger.info.log('uploadFailures ====>', uploadFailures);
    const header = 'Site #, Geocode';
    const records: string[] = [];
    records.push(header +  '\n');
    uploadFailures.forEach(record => {
        records.push(`${record.store}, ${record.geocode}` + '\n');
    });
    this.downloadCSV(records, 'Custom TA Issues Log.csv');
  }

  public exportMCIssuesLog(records: string[]){
    this.downloadCSV(records, 'Must Cover Issues Log.csv');
  }

  private downloadCSV(records: string[], fileName: string){
    const a = document.createElement('a');
    const blob = new Blob(records, { type: 'text/csv' });
    a.href = window.URL.createObjectURL(blob);
    a['download'] = fileName;
    a.click();
  }

  public downloadPDF(result: string){
    this.logger.info.log('Opening PDF from', result);
    const url = result;
    const fileName = url.split(/[\s/]+/);
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = url;
    link.download = fileName[fileName.length - 1];
    link.dispatchEvent(new MouseEvent('click'));
  }

}
