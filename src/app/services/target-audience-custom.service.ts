import { Injectable } from '@angular/core';
import { FileService, Parser, ParseResponse } from '../val-modules/common/services/file.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { AppMessagingService } from './app-messaging.service';
import { UsageService } from './usage.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { EMPTY, merge, Observable, of } from 'rxjs';
import { TargetAudienceService } from './target-audience.service';
import { filter } from 'rxjs/operators';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { groupBy } from '../val-modules/common/common.utils';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';

const audienceUpload: Parser<CustomAudienceData> = {
  columnParsers: [
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true}
  ]
};

interface CustomAudienceData {
  geocode: string;
  [key: string] : string;
}

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceCustomService {
  private dataCache: { [key: string] : CustomAudienceData };
  private currentFileName: string;
  private varPkCache: Map<string, number> = new Map<string, number>();

  constructor(private messagingService: AppMessagingService,
              private usageService: UsageService,
              private audienceService: TargetAudienceService,
              private stateService: AppStateService,
              private domainFactory: ImpDomainFactoryService,
              private varService: ImpGeofootprintVarService) {
    this.stateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoadProject());
  }

  private static createDataDefinition(name: string, source: string) : AudienceDataDefinition {
    const audience: AudienceDataDefinition = {
      audienceName: name,
      audienceIdentifier: name,
      audienceSourceType: 'Custom',
      audienceSourceName: source,
      exportInGeoFootprint: true,
      showOnGrid: true,
      showOnMap: false,
      exportNationally: false,
      allowNationalExport: false,
      audienceCounter: TargetAudienceService.audienceCounter
    };
    TargetAudienceService.audienceCounter++;
    return audience;
  }

  private onLoadProject() {
    try {
      const project = this.stateService.currentProject$.getValue();
      if (project == null) return;
      const customProjectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'custom');
      this.dataCache = {};
      for (const projectVar of customProjectVars) {
        const audience: AudienceDataDefinition = {
          audienceName: projectVar.fieldname,
          audienceIdentifier: projectVar.fieldname,
          audienceSourceType: 'Custom',
          audienceSourceName: projectVar.source.replace(/^Custom_/, ''),
          exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
          showOnGrid: projectVar.isIncludedInGeoGrid,
          showOnMap: false,
          exportNationally: false,
          allowNationalExport: false,
          audienceCounter: projectVar.sortOrder
        };
        this.currentFileName = audience.audienceSourceName;
        this.varPkCache.set(audience.audienceName, this.varService.getNextStoreId());
        if (projectVar.sortOrder > TargetAudienceService.audienceCounter) TargetAudienceService.audienceCounter = projectVar.sortOrder++;
        const relatedGeoVars = project.getImpGeofootprintVars().filter(gv => gv.customVarExprDisplay === audience.audienceName);
        for (const geoVar of relatedGeoVars) {
          if (!this.dataCache.hasOwnProperty(geoVar.geocode)) {
            this.dataCache[geoVar.geocode] = { geocode: geoVar.geocode };
          }
          if (geoVar.isString) {
            this.dataCache[geoVar.geocode][geoVar.customVarExprDisplay] = geoVar.valueString;
          } else {
            this.dataCache[geoVar.geocode][geoVar.customVarExprDisplay] = geoVar.valueNumber.toLocaleString();
          }
        }
        this.audienceService.addAudience(audience, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
      }
    } catch (error) {
      console.error(error);
    }
  }

  private createGeofootprintVar(geocode: string, column: string, value: string, fileName: string, geoCache: Map<string, ImpGeofootprintGeo[]>) : ImpGeofootprintVar[] {
    const fullId = `Custom/${fileName}/${column}`;
    let newVarPk = null;
    if (this.varPkCache.has(column)) {
      newVarPk = this.varPkCache.get(column);
    } else {
      newVarPk = this.varService.getNextStoreId();
      if (newVarPk <= Array.from(this.varPkCache.keys()).length) {
        for (const i of Array.from(this.varPkCache)) {
          newVarPk = this.varService.getNextStoreId();
        }
      }
    }
    const results: ImpGeofootprintVar[] = [];
    const numberAttempt = Number(value);
    const fieldDescription: string = `${column}`;
    const matchingAudience = this.audienceService.getAudiences()
      .find(a => a.audienceSourceName === column && a.audienceSourceType === 'Custom');
    let fieldType: FieldContentTypeCodes;
    let fieldValue: string | number;
    if (Number.isNaN(numberAttempt)) {
      fieldValue = value;
      fieldType = FieldContentTypeCodes.Char;
    } else {
      fieldValue = numberAttempt;
      fieldType = FieldContentTypeCodes.Index;
    }
    if (geoCache.has(geocode)) {
      geoCache.get(geocode).forEach(geo => {
        const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, newVarPk, fieldValue, fullId, fieldDescription, fieldType);
        if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
        results.push(currentResult);
      });
    }
    this.varPkCache.set(column, newVarPk);
    return results;
  }

  public parseFileData(dataBuffer: string, fileName: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    try {
      const data: ParseResponse<CustomAudienceData> = FileService.parseDelimitedData(header, rows, audienceUpload);
      const failCount = data.failedRows.length;
      const successCount = data.parsedData.length;

      if (failCount > 0) {
        console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.handleError(`There ${failCount > 1 ? 'were' : 'was'} ${failCount} row${failCount > 1 ? 's' : ''} in the uploaded file that could not be read.`);
      }
      if (successCount > 0) {
        const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));
        if (uniqueGeos.size !== data.parsedData.length) {
          this.handleError('The file should contain unique geocodes. Please remove duplicates and resubmit the file.');
        } else {
          this.currentFileName = fileName;
          this.dataCache = {};
          data.parsedData.forEach(d => this.dataCache[d.geocode] = d);
          const columnNames = Object.keys(data.parsedData[0]).filter(k => k !== 'geocode' && typeof data.parsedData[0][k] !== 'function');
          const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'custom', action: 'upload' });
          for (const column of columnNames) {
            const audDataDefinition = TargetAudienceCustomService.createDataDefinition(column, fileName);
            this.audienceService.addAudience(audDataDefinition, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
            const metricText = 'CUSTOM' + '~' + audDataDefinition.audienceName + '~' + audDataDefinition.audienceSourceName + '~' + currentAnalysisLevel;
            this.usageService.createCounterMetric(usageMetricName, metricText, successCount);
          }
          this.messagingService.showSuccessNotification('Audience Upload Success', 'Upload Complete');
        }
      }
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private buildGeoCache() : Map<string, ImpGeofootprintGeo[]> {
    const currentProject = this.stateService.currentProject$.getValue();
    return groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
  }

  private handleError(message: string) : void {
    this.messagingService.showErrorNotification('Audience Upload Error', message);
  }

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const geoSet = new Set(geocodes);
    const geoCache = this.buildGeoCache();
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    geoSet.forEach(geo => {
      if (this.dataCache.hasOwnProperty(geo)) {
        identifiers.forEach(column => {
          const newVars = this.createGeofootprintVar(geo, column, this.dataCache[geo][column], this.currentFileName, geoCache);
          observables.push(of(newVars));
        });
      }
    });
    return merge(...observables, 4).pipe(
      filter(vars => vars.length > 0)
    );
  }
}
