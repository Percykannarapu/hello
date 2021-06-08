import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { arrayToSet, isConvertibleToNumber, isEmpty, isString, mapByExtended } from '@val/common';
import { EsriQueryService } from '@val/esri';
import { ErrorNotification, WarningNotification } from '@val/messaging';
import { map, reduce } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { customAudienceDataParser, CustomDataRow } from '../common/file-parsing-rules';
import { FieldContentTypeCodes } from '../impower-datastore/state/models/impower-model.enums';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { mergeCustomVars } from '../impower-datastore/state/transient/custom-vars/custom-vars.actions';
import { DynamicVariable } from '../impower-datastore/state/transient/dynamic-variable.model';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { createCustomAudienceInstance } from '../models/audience-factories';
import { FullAppState } from '../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { FileService, ParseResponse } from '../val-modules/common/services/file.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { UnifiedAudienceService } from './unified-audience.service';

@Injectable({
  providedIn: 'root'
})
export class CustomDataService {

  constructor(private appConfig: AppConfig,
              private logger: AppLoggingService,
              private stateService: AppStateService,
              private esriQueryService: EsriQueryService,
              private store$: Store<FullAppState>,
              private audienceService: UnifiedAudienceService) { }

  public parseCustomVarData(dataBuffer: string, fileName: string, existingAudiences: Audience[]) {
    const dataRows = this.parseFileData(dataBuffer, false);
    const newAudiences = this.createAudiences(dataRows, fileName, existingAudiences);
    const customVars = this.parseAllData(dataRows, existingAudiences, newAudiences);
    if (newAudiences.length > 0) {
      newAudiences.forEach(a => this.audienceService.addAudience(a));
    }
    if (customVars.length > 0) {
      this.store$.dispatch(mergeCustomVars({ customVars }));
    }
  }

  public reloadCustomVarData(dataBuffer: string, existingAudiences: Audience[]) {
    const dataRows = this.parseFileData(dataBuffer, true);
    const customVars = this.parseAllData(dataRows, existingAudiences, []);
    if (customVars.length > 0) {
      this.store$.dispatch(mergeCustomVars({ customVars }));
    }
  }

  private parseFileData(buffer: string, isLoad: boolean) : CustomDataRow[] {
    const rows: string[] = buffer.split(/\r\n|\n|\r/);
    const header: string = rows.shift();
    const data: ParseResponse<CustomDataRow> = FileService.parseDelimitedData(header, rows, customAudienceDataParser);
    const failCount = data.failedRows.length;
    const successCount = data.parsedData.length;
    if (failCount > 0) {
      this.logger.error.log('There were errors parsing the following rows in the CSV: ', data.failedRows);
      const message = `There ${failCount > 1 ? 'were' : 'was'} ${failCount} row${failCount > 1 ? 's' : ''} in the uploaded file that could not be read.`;
      this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'Custom Audience Upload'}));
    }
    if (successCount > 0) {
      let isValid = true;
      if (!isLoad) {
        isValid = this.validateGeos(data.parsedData, header);
      }
      if (isValid) return data.parsedData;
    }
    return [];
  }

  private validateGeos(data: CustomDataRow[], header: string) : boolean {
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const outfields = ['geocode'];
    const uniqueGeos = arrayToSet(data.map(d => d.geocode));
    if (uniqueGeos.size !== data.length) {
      const message = 'The file should contain unique geocodes. Please remove duplicates and resubmit the file.';
      this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'Custom Audience Upload'}));
      return false;
    } else {
      this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', Array.from(uniqueGeos), false, outfields).pipe(
        map(graphics => graphics.map(g => g.attributes?.geocode)),
        reduce((acc, result) => [...acc, ...result], []),
      ).subscribe(result => {
        const qResult = new Set(result);
        const fields = header.split(',');
        const records: string[] = [];
        const headerIdentifiers: any = customAudienceDataParser.columnParsers[0].headerIdentifier;
        const fieldGeoHeader = fields.filter(field => headerIdentifiers.indexOf(field.toUpperCase()) >= 0);
        records.push(header + '\n');
        data.forEach(record => {
          if (!qResult.has(record.geocode)) {
            let row = '';
            for (let i = 0; i <= fields.length - 1; i++ ){
              row = fields[i].toUpperCase() === fieldGeoHeader[0].toUpperCase() ? row + `${record.geocode},` : row + `${record[fields[i]]},`;
            }
            records.push(row.substring(0, row.length - 1) + '\n');
          }
        });
        if (records.length > 1) {
          const fileName = `Custom Data ${currentAnalysisLevel} Issues Log.csv`;
          const geoMessage = records.length === 2 ? 'An Invalid Geo exists' : 'Invalid Geos exist';
          this.store$.dispatch(new WarningNotification({ message: `${geoMessage} in the upload file, please check provided issues log`, notificationTitle: 'Custom Aud Upload Warning'}));
          FileService.downloadFile(fileName, records);
        }
      });
      return true;
    }
  }

  private createAudiences(data: CustomDataRow[], fileName: string, existingAudiences: Audience[]) : AudienceDataDefinition[] {
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const audienceMap: Map<string, Audience> = mapByExtended(existingAudiences, a => a.audienceName);
    const columnNames = Object.keys(data[0]).filter(k => k !== 'geocode' && !isEmpty(k) && typeof data[0][k] !== 'function');
    const result: AudienceDataDefinition[] = [];
    let nextPk = this.audienceService.getNextVarPk();
    for (const column of columnNames) {
      let currentAudience: AudienceDataDefinition = null;
      if (!audienceMap.has(column)) {
        currentAudience = createCustomAudienceInstance(column, fileName, true, false, `${nextPk++}`);
        if (isConvertibleToNumber(data[0][column])) {
          currentAudience.fieldconte = FieldContentTypeCodes.Index;
        } else {
          currentAudience.fieldconte = FieldContentTypeCodes.Char;
        }
        const metricText = 'CUSTOM' + '~' + currentAudience.audienceName + '~' + currentAudience.audienceSourceName + '~' + currentAnalysisLevel;
        this.store$.dispatch(new CreateAudienceUsageMetric('custom', 'upload', metricText, data.length));
      }
      result.push(currentAudience);
    }
    return result;
  }

  private parseAllData(data: CustomDataRow[], existingAudiences: Audience[], newAudiences: AudienceDataDefinition[]) : DynamicVariable[] {
    const existingAudienceMap: Map<string, Audience> = mapByExtended(existingAudiences, a => a.audienceName);
    const newAudienceMap: Map<string, AudienceDataDefinition> = mapByExtended(newAudiences, a => a.audienceName);
    const columnNames = Object.keys(data[0]).filter(k => k !== 'geocode' && !isEmpty(k) && typeof data[0][k] !== 'function');
    const result: DynamicVariable[] = [];
    const parseErrors: any[] = [];
    for (let i = 0; i < data.length; ++i) {
      const currentRow = data[i];
      const currentResult: DynamicVariable = { geocode: currentRow.geocode };
      columnNames.forEach(column => {
        const columnAudience = existingAudienceMap.get(column) ?? newAudienceMap.get(column);
        if (columnAudience?.fieldconte === FieldContentTypeCodes.Index && isConvertibleToNumber(currentRow[column])) {
          currentResult[columnAudience.audienceIdentifier] = Number(currentRow[column]);
        } else if (columnAudience?.fieldconte === FieldContentTypeCodes.Char || isString(currentRow[column])) {
          currentResult[columnAudience.audienceIdentifier] = `${currentRow[column]}`;
        } else {
          parseErrors.push([column, currentRow]);
        }
      });
      result.push(currentResult);
    }
    if (parseErrors.length > 0) {
      console.error('There were errors parsing some data:', parseErrors);
    }
    return result;
  }
}
