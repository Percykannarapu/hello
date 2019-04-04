import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { CreateGaugeMetric, CreateUsageMetric } from '../state/usage/usage.actions';
import { TargetAudienceService } from './target-audience.service';
import { CreateLocationUsageMetric } from '../state/usage/targeting-usage.actions';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { LocalAppState } from '../state/app.interfaces';
import { ErrorNotification } from '@val/messaging';

/**
 * This service is a temporary shim to aggregate the operations needed for exporting data
 * until the data is held natively in NgRx and can be removed after that
 */

@Injectable({
  providedIn: 'root'
})
export class AppExportService {

  constructor(private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private targetAudienceService: TargetAudienceService,
              private impProjectService: ImpProjectService,
              private store$: Store<LocalAppState>,
              private config: AppConfig) { }

  exportGeofootprint(selectedOnly: boolean, currentProject: ImpProject) : Observable<Action> {
    return Observable.create((observer: Subject<Action>) => {
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
    return Observable.create((observer: Subject<CreateUsageMetric>) => {
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
    return Observable.create((observer: Subject<CreateUsageMetric>) => {
      try {
        const pluralType = `${siteType}s`;
        const filename = 'Home Geo Issues Log.csv'
        const metricValue = this.locationExportImpl(siteType, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.homeGeoIssues, filename, currentProject[0], true);
        observer.next(new CreateLocationUsageMetric(`${siteType.toLowerCase()}-list`, 'export', null, metricValue));
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  exportValassisDigital(currentProject: ImpProject) : Observable<CreateUsageMetric> {
    return Observable.create((observer: Subject<CreateUsageMetric>) => {
      try {
        this.validateProjectForExport(currentProject, 'sending the custom site list to Valassis Digital');
        const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 8);
        const filename = 'visit_locations_' + currentProject.projectId + '_' + this.config.environmentName + '_' + fmtDate + '.csv';
        const metricValue = this.locationExportImpl(ImpClientLocationTypeCodes.Site, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital, filename, currentProject);
        const metricText = 'clientName=' + currentProject.clientIdentifierName.trim() + '~' + 'projectTrackerId=' + currentProject.projectTrackerId + '~' + 'fileName=' + filename;
        observer.next(new CreateLocationUsageMetric('vlh-site-list', 'send', metricText, metricValue));
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });

  }

  exportNationalExtract(currentProject: ImpProject) : Observable<void> {
    return Observable.create((observer: Subject<void>) => {
      try {
        this.targetAudienceService.exportNationalExtract(currentProject.methAnalysis, currentProject.projectId);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  private locationExportImpl(siteType: SuccessfulLocationTypeCodes, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, filename: string, currentProject: ImpProject, homeGeoIssueOnly: boolean = false) : number {
    const storeFilter: (loc: ImpGeofootprintLocation) => boolean = 
            loc => loc.clientLocationTypeCode === siteType && (!homeGeoIssueOnly || loc.impGeofootprintLocAttribs.some(a => a.attributeCode === 'Home Geocode Issue' && a.attributeValue === 'Y'));
    const pluralType = `${siteType}s`;
    const isDigital = exportFormat === EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital;
    const metricCount =  this.impGeofootprintLocationService.get().filter(storeFilter).length;
   if(metricCount === 0 && exportFormat === EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.homeGeoIssues ){
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
}
