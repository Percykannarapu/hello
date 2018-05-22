import { Injectable } from '@angular/core';
import { FileService, ParseResponse, ParseRule } from '../val-modules/common/services/file.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { AppMessagingService } from './app-messaging.service';
import { UsageService } from './usage.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { EMPTY, merge, Observable, of } from 'rxjs';
import { TargetAudienceService } from './target-audience.service';
import { filter } from 'rxjs/operators';
import { AudienceDataDefinition } from '../models/audience-data.model';

const audienceUploadRules: ParseRule[] = [
  { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true}
];

interface CustomAudienceData {
  geocode: string;
  [key: string] : string;
}

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceCustomService {
  private dataCache: Map<string, Map<string, ImpGeofootprintVar>> = new Map<string, Map<string, ImpGeofootprintVar>>();

  constructor(private messagingService: AppMessagingService, private usageService: UsageService, private audienceService: TargetAudienceService) { }

  private static createGeofootprintVar(geocode: string, column: string, value: string, fileName: string) : ImpGeofootprintVar {
    const fullId = `Custom/${fileName}/${column}`;
    const result = new ImpGeofootprintVar({ geocode, varPk: -1, customVarExprQuery: fullId, customVarExprDisplay: column, isCustom: 1, isString: 0, isNumber: 0, isActive: 1 });
    if (Number.isNaN(Number(value))) {
      result.valueString = value;
      result.isString = 1;
    } else {
      result.valueNumber = Number(value);
      result.isNumber = 1;
    }
    return result;
  }

  private static createDataDefinition(name: string, source: string) : AudienceDataDefinition {
    return {
      audienceName: name,
      audienceIdentifier: name,
      audienceSourceType: 'Custom',
      audienceSourceName: source,
      exportInGeoFootprint: true,
      showOnGrid: true,
      showOnMap: false
    };
  }

  public parseFileData(dataBuffer: string, fileName: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      const data: ParseResponse<CustomAudienceData> = FileService.parseDelimitedData<CustomAudienceData>(header, rows, audienceUploadRules);
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
          for (const column of columnNames) {
            const columnData = data.parsedData.map(d => TargetAudienceCustomService.createGeofootprintVar(d.geocode, column, d[column], fileName));
            const geoDataMap = new Map<string, ImpGeofootprintVar>(columnData.map<[string, ImpGeofootprintVar]>(c => [c.geocode, c]));
            this.dataCache.set(column, geoDataMap);
            this.audienceService.addAudience(TargetAudienceCustomService.createDataDefinition(column, fileName), (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
            this.usageService.createCounterMetric(usageMetricName, column, successCount);
          }
          console.log(this.dataCache);
          this.messagingService.showGrowlSuccess('Audience Upload Success', 'Upload Complete');
        }
      }
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleError(message: string) : void {
    this.messagingService.showGrowlError('Audience Upload Error', message);
  }

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const geoSet = new Set(geocodes);
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    for (const column of identifiers) {
      if (this.dataCache.has(column)) {
        const geoVars = [];
        this.dataCache.get(column).forEach((v, k) => {
          if (geoSet.has(k)) geoVars.push(v);
        });
        observables.push(of(geoVars));
      }
    }
    return merge(...observables, 4).pipe(
      filter(vars => vars.length > 0)
    );
  }
}
