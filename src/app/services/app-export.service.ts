import { Injectable } from '@angular/core';
import { EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppConfig } from '../app.config';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { EXPORT_FORMAT_IMPGEOFOOTPRINTGEO, ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { CreateUsageMetric } from '../state/usage/usage.actions';
import { TargetAudienceService } from './target-audience.service';
import { CreateLocationUsageMetric } from '../state/usage/targeting-usage.actions';

@Injectable({
  providedIn: 'root'
})
export class AppExportService {

  constructor(private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private targetAudienceService: TargetAudienceService,
              private config: AppConfig) { }

  exportGeofootprint(selectedOnly: boolean, currentProject: ImpProject) : CreateUsageMetric {
    const storeFilter: (geo: ImpGeofootprintGeo) => boolean = selectedOnly ? (geo => geo.isActive === true) : null;
    const filename = this.impGeofootprintGeoService.getFileName(currentProject.methAnalysis, currentProject.projectId);
    this.impGeofootprintGeoService.exportStore(filename, EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx, currentProject.methAnalysis, storeFilter);
    const metricValue = this.impGeofootprintGeoService.get().length;
    const metricText = selectedOnly ? 'includeSelectedGeography' : 'includeAllGeography';
    return new CreateLocationUsageMetric('geofootprint', 'export', metricText, metricValue);
  }

  exportLocations(siteType: SuccessfulLocationTypeCodes, currentProject: ImpProject) : CreateUsageMetric {
    const pluralType = `${siteType}s`;
    const filename = this.impGeofootprintLocationService.getFileName(currentProject.projectId, pluralType);
    const metricValue = this.locationExportImpl(siteType, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, filename, currentProject);
    return new CreateLocationUsageMetric(`${siteType.toLowerCase()}-list`, 'export', null, metricValue);
  }

  exportValassisDigital(currentProject: ImpProject) : CreateUsageMetric {
    const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 8);
    const filename = 'visit_locations_' + currentProject.projectId + '_' + this.config.environmentName + '_' + fmtDate + '.csv';
    const metricValue = this.locationExportImpl(ImpClientLocationTypeCodes.Site, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital, filename, currentProject);
    const metricText = 'clientName=' + currentProject.clientIdentifierName.trim() + '~' + 'projectTrackerId=' + currentProject.projectTrackerId + '~' + 'fileName=' + filename;
    return new CreateLocationUsageMetric('vlh-site-list', 'send', metricText, metricValue);
  }

  exportNationalExtract(currentProject: ImpProject) : void {
    this.targetAudienceService.exportNationalExtract(currentProject.methAnalysis, currentProject.projectId);
  }

  private locationExportImpl(siteType: SuccessfulLocationTypeCodes, exportFormat: EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION, filename: string, currentProject: ImpProject) : number {
    const storeFilter: (loc: ImpGeofootprintLocation) => boolean = loc => loc.clientLocationTypeCode === siteType;
    const pluralType = `${siteType}s`;
    this.impGeofootprintLocationService.exportStore(filename, exportFormat, currentProject, false, storeFilter, pluralType.toUpperCase());
    return this.impGeofootprintLocationService.get().filter(storeFilter).length;
  }
}
