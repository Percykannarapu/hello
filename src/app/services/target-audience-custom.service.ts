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
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';

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
  private dataCache: Map<string, Map<string, ImpGeofootprintVar>> = new Map<string, Map<string, ImpGeofootprintVar>>();
  private varPkCache: Map<string, number> = new Map<string, number>();

  constructor(private messagingService: AppMessagingService, private usageService: UsageService,
              private audienceService: TargetAudienceService, private stateService: AppStateService,
              private varService: ImpGeofootprintVarService, private tradeAreaService: ImpGeofootprintTradeAreaService,
              private projectVarService: ImpProjectVarService) {
                
                this.stateService.projectIsLoading$.subscribe(isLoading => {
                  this.onLoadProject(isLoading);
                });

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

  private onLoadProject(loading: boolean) {
    if (loading) return; // loading will be false when the load is actually done
    try {
      const project = this.stateService.currentProject$.getValue();
      // const geoCache: Map<number, Map<string, ImpGeofootprintGeo>> = this.buildGeoCache();
      // const geocodes: string[] = project.getImpGeofootprintGeos().map(geo => geo.geocode);
      // const columnNames: Set<string> = new Set<string>();
      if (project && project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'custom').length > 0) {
        for (const projectVar of project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'custom')) {
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
          this.varPkCache.set(audience.audienceName, this.varService.getNextStoreId());
          if (projectVar.sortOrder > TargetAudienceService.audienceCounter) TargetAudienceService.audienceCounter = projectVar.sortOrder++;
          // columnNames.add(audience.audienceName);
          const relatedGeoVars = project.getImpGeofootprintVars().filter(gv => gv.customVarExprDisplay === audience.audienceName);
          const geoMap = new Map<string, ImpGeofootprintVar>();
          for (const geoVar of relatedGeoVars) {
            geoMap.set(geoVar.geocode, geoVar);
          }
          this.dataCache.set(audience.audienceName, geoMap);
          this.audienceService.addAudience(audience, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Build a cache of geos that can be used for quick
   * lookup while building geofootprint vars
   */
  private buildGeoCache() : Map<number, Map<string, ImpGeofootprintGeo>> {
    let count = 0;
    const geoCache = new Map<number, Map<string, ImpGeofootprintGeo>>();
    const project = this.stateService.currentProject$.getValue();
    for (const ta of project.getImpGeofootprintTradeAreas()) {
      const geoMap = new Map<string, ImpGeofootprintGeo>();
      for (const geo of ta.impGeofootprintGeos) {
        geoMap.set(geo.geocode, geo);
        geoCache.set(count, geoMap);
      }
      count++;
    }
    return geoCache;
  }

  private createGeofootprintVar(geocode: string, column: string, value: string, fileName: string, geoCache: Map<number, Map<string, ImpGeofootprintGeo>>) : ImpGeofootprintVar {
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
    const result = new ImpGeofootprintVar({ geocode, varPk: newVarPk, customVarExprQuery: fullId, customVarExprDisplay: column, isCustom: true, isString: false, isNumber: false, isActive: true });
    if (Number.isNaN(Number(value))) {
      result.valueString = (value === 'null') ? ' ' : value;
      result.fieldconte = 'CHAR';
      result.isString = true;
    } else {
      result.valueNumber = Number(value);
      result.fieldconte = 'INDEX';
      result.isNumber = true;
    }
    result.isCustom = false;
    for (const ta of Array.from(geoCache.keys())) {
      const geoMap: Map<string, ImpGeofootprintGeo> = geoCache.get(ta);
      if (geoMap.has(geocode)) {
        result.impGeofootprintTradeArea = geoMap.get(geocode).impGeofootprintTradeArea;
        geoMap.get(geocode).impGeofootprintTradeArea.impGeofootprintVars.push(result);
      }
    }
    this.varPkCache.set(column, newVarPk);
    return result;
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
          const columnNames = Object.keys(data.parsedData[0]).filter(k => k !== 'geocode' && typeof data.parsedData[0][k] !== 'function');
          const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'custom', action: 'upload' });
          const geoCache = this.buildGeoCache();
          for (const column of columnNames) {
            const columnData = data.parsedData.map(d => this.createGeofootprintVar(d.geocode, column, d[column], fileName, geoCache));
            const geoDataMap = new Map<string, ImpGeofootprintVar>(columnData.map<[string, ImpGeofootprintVar]>(c => [c.geocode, c]));
            this.dataCache.set(column, geoDataMap);
            const audDataDefinition = TargetAudienceCustomService.createDataDefinition(column, fileName);
            this.audienceService.addAudience(audDataDefinition, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
            const metricText = 'CUSTOM' + '~' + audDataDefinition.audienceName + '~' + audDataDefinition.audienceSourceName + '~' + currentAnalysisLevel;
            this.usageService.createCounterMetric(usageMetricName, metricText, successCount);
          }
          console.log(this.dataCache);
          this.messagingService.showSuccessNotification('Audience Upload Success', 'Upload Complete');
        }
      }
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleError(message: string) : void {
    this.messagingService.showErrorNotification('Audience Upload Error', message);
  }

  private clearVarsFromHierarchy() {
    const project = this.stateService.currentProject$.getValue();
    for (const location of project.impGeofootprintMasters[0].impGeofootprintLocations) {
      for (const ta of location.impGeofootprintTradeAreas) {
        ta.impGeofootprintVars = [];
      }
    }
  }

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const geoSet = new Set(geocodes);
    const geoCache: Map<number, Map<string, ImpGeofootprintGeo>> = this.buildGeoCache();
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    this.clearVarsFromHierarchy();
    for (const column of identifiers) {
      if (this.dataCache.has(column)) {
        const geoVars = [];
        this.dataCache.get(column).forEach((v, k) => {
          if (geoSet.has(k)) geoVars.push(v);
          const geoVarValue = v.valueNumber != null ? v.valueNumber : v.valueString;
          this.createGeofootprintVar(v.geocode, v.customVarExprDisplay, geoVarValue.toString(), v.customVarExprQuery.split('/')[1], geoCache);
        });
        observables.push(of(geoVars));
      }
    }
    return merge(...observables, 4).pipe(
      filter(vars => vars.length > 0)
    );
  }
}
