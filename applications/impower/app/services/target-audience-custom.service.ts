import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { EsriQueryService } from '@val/esri';
import { ErrorNotification, SuccessNotification, WarningNotification } from '@val/messaging';
import { AppConfig } from 'app/app.config';
import { AddAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { GeoVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.model';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import { BehaviorSubject, merge } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { UpdateAudiences } from '../impower-datastore/state/transient/audience/audience.actions';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { LocalAppState } from '../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { FileService, Parser, ParseResponse, ParseRule } from '../val-modules/common/services/file.service';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { FieldContentTypeCodes, ProjectPrefGroupCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

const audienceUpload: Parser<CustomAudienceData> = {
  columnParsers: [
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true}
  ],
  createNullParser: (header: string) : ParseRule => {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data};
  }
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
  private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);

  constructor(private audienceService: TargetAudienceService,
              private stateService: AppStateService,
              private varService: ImpGeofootprintVarService,
              private projectVarService: ImpProjectVarService,
              private appProjectPrefService: AppProjectPrefService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private esriQueryService: EsriQueryService,
              private appConfig: AppConfig,
              private logger: AppLoggingService,
              private store$: Store<LocalAppState>) {

    this.stateService.applicationIsReady$.subscribe(ready => this.onLoadProject(ready));
    this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(this.allAudiencesBS$);
  }

  private static createDataDefinition(name: string, source: string, id: string) : AudienceDataDefinition {
    return {
      audienceName: name,
      audienceIdentifier: id,
      audienceSourceType: 'Custom',
      audienceSourceName: source,
      exportInGeoFootprint: true,
      showOnGrid: false,
      showOnMap: false,
      exportNationally: false,
      allowNationalExport: false,
      fieldconte: null,
      requiresGeoPreCaching: false,
      seq: null
    };
  }

  public rehydrateAudience() {
    try {
      const project = this.stateService.currentProject$.getValue();
      if (project == null) return;
      const customProjectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'custom');
      //this.logger.debug.log('### target-audience-custom - onLoadProject found ' + customProjectVars.length + ' custom project vars');

      if (customProjectVars != null && customProjectVars.length > 0) {
        for (const projectVar of customProjectVars) {
          const audience: AudienceDataDefinition = {
            audienceName: projectVar.fieldname,
            audienceIdentifier: projectVar.varPk.toString(),
            audienceSourceType: 'Custom',
            audienceSourceName: projectVar.source.replace(/^Custom_/, ''),
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            exportNationally: false,
            allowNationalExport: false,
            fieldconte: null,
            requiresGeoPreCaching: false,
            seq: projectVar.sortOrder
          };
          this.currentFileName = audience.audienceSourceName;
          this.audienceService.addAudience(audience, null, true);
        }
      }
    }
    catch (error) {
      this.logger.error.log(error);
    }
  }

  private onLoadProject(ready: boolean) {
    if (!ready) return;
    this.rehydrateAudience();
  }

  private varPkForColumn(column: string) : string {
    let varPk;
    const audiences: Audience[] = this.allAudiencesBS$.value;

    if (this.varPkCache.has(column)) {
      varPk = this.varPkCache.get(column);
    }
    else {
      // If there is a project var for this column, use the varPk from it.
      const projectVar = this.projectVarService.get().filter(pv => pv.fieldname === column);
      if (projectVar != null && projectVar.length > 0) {
        varPk = projectVar[0].varPk;
      }
      else {
        // Check the audience in the data store
        const audience = audiences.filter(aud => aud.audienceName === column);
        if (audience != null && audience.length > 0) {
          varPk = audience[0].audienceIdentifier;
        }
        else {
          // No existing id, create one
          varPk = this.projectVarService.getNextStoreId();
          const maxVarPk = Math.max.apply(Math, Array.from(this.varPkCache.values()));
          while (varPk <= maxVarPk) {
            varPk = this.projectVarService.getNextStoreId();
          }
        }
      }
      this.varPkCache.set(column, varPk);
    }
    return varPk;
  }

  public parseCustomVarData(dataBuffer: string, fileName: string, justColumn?: string, isReload: boolean = false) : GeoVar[] {
    // this.logger.debug.log('### parseCustomVarData - fired - dataBuffer size:', dataBuffer.length, 'filename:', fileName, 'justColumn:', justColumn);
    let results: GeoVar[] = [];
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    try {
      const data: ParseResponse<CustomAudienceData> = FileService.parseDelimitedData(header, rows, audienceUpload);
      const failCount = data.failedRows.length;
      const successCount = data.parsedData.length;
      if (failCount > 0) {
        this.logger.error.log('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.handleError(`There ${failCount > 1 ? 'were' : 'was'} ${failCount} row${failCount > 1 ? 's' : ''} in the uploaded file that could not be read.`);
      }
      if (successCount > 0) {
        if (!isReload)
            this.validateGeos(data, header);
        const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));
        if (uniqueGeos.size !== data.parsedData.length)
          this.handleError('The file should contain unique geocodes. Please remove duplicates and resubmit the file.');
        else {
          this.currentFileName = fileName;
          this.dataCache = {};

          // Audience Map for creating project vars with updated fieldconte
          const audienceMap: Map<string, AudienceDataDefinition> = new Map();

          // Determine fieldConte for each custom variable
          const fieldConteMap: Map<string, FieldContentTypeCodes> = new Map();

          // For every column, create an audience if it doesn't exist
          const columnNames = Object.keys(data.parsedData[0]).filter(k => k !== 'geocode' && typeof data.parsedData[0][k] !== 'function');
          let nextColSeq = this.allAudiencesBS$.value.length;
          for (const column of columnNames) {
            if (justColumn == null || column === justColumn) {
              // Check for an existing audience
              const columnAudience = this.allAudiencesBS$.value.filter(aud => aud.audienceName === column)[0];
              // If audience by that column name doesn't exist, create one
              if (columnAudience == null) {
                // Get existing varPk
                const projectVars = this.projectVarService.get().filter(pv => pv.fieldname === column);
                const varPk = this.varPkForColumn(column);
                const audDataDefinition = TargetAudienceCustomService.createDataDefinition(column, fileName, varPk);
                if (projectVars != null && projectVars.length > 0) {
                  audDataDefinition.showOnGrid = projectVars[0].isIncludedInGeoGrid;
                  audDataDefinition.showOnMap  = projectVars[0].isShadedOnMap;
                  audDataDefinition.exportInGeoFootprint = projectVars[0].isIncludedInGeofootprint;
                  audDataDefinition.seq = projectVars[0].sortOrder;
                }
                else
                  audDataDefinition.seq = nextColSeq++;
                audDataDefinition.fieldconte = FieldContentTypeCodes.Index;
                fieldConteMap.set(column, FieldContentTypeCodes.Index);
                audienceMap.set(column, audDataDefinition);

                // Create a new audience
                if (!isReload)
                    this.store$.dispatch(new AddAudience({ audience: audDataDefinition }));

                const metricText = 'CUSTOM' + '~' + audDataDefinition.audienceName + '~' + audDataDefinition.audienceSourceName + '~' + currentAnalysisLevel;
                this.store$.dispatch(new CreateAudienceUsageMetric('custom', 'upload', metricText, successCount));
              }
              else {
                // this.logger.debug.log('### parseCustomVarData - found existing audience -', columnAudience.seq, '-', columnAudience.audienceName, ', fieldconte:', columnAudience.fieldconte);
                if (!audienceMap.has(columnAudience.audienceName))
                  audienceMap.set(columnAudience.audienceName, columnAudience);
                fieldConteMap.set(column, FieldContentTypeCodes.Index);
              }
            }
          }

          // Look at all of the geoVars, setting the value to be a numeric or string, noting audiences needing an updated fieldconte
          const updates: Update<Audience>[] = [];
          const correctAudience: Set<string> = new Set<string>();
          data.parsedData.forEach(d => {
            const geoVar = { geocode: d.geocode };
            for (const [field, fieldValue] of Object.entries(d)) {
              const audience = this.allAudiencesBS$.value.find(aud => aud.audienceName === field);
              if (audience != null && fieldValue != null) {
                if (Number.isNaN(Number(fieldValue))) {
                  geoVar[audience.audienceIdentifier/*this.varPkCache.get(field).toString()*/] = fieldValue;
                  fieldConteMap.set(field, FieldContentTypeCodes.Char);
//                correctAudience.push(field);
                }
                else
                  geoVar[audience.audienceIdentifier/*this.varPkCache.get(field).toString()*/] = Number(fieldValue);

                if (audience.fieldconte !== fieldConteMap.get(field))
                  correctAudience.add(field);
               }
            }

//fieldConteMap.forEach((value, key) => this.logger.debug.log('### parseCustomVarData - fieldConteMap after - key:', key, ', value:', value));
//correctAudience.forEach(key => this.logger.debug.log('### parseCustomVarData - correctAudience:', key));

            // Push the massaged geoVar onto the results list
            results.push(geoVar);
          });

          // If there are audiences that need the fieldconte updated, correct them and batch them up
          if (correctAudience.size > 0)
            correctAudience.forEach(audienceName => {
              const audience = audienceMap.get(audienceName);

              audience.fieldconte = fieldConteMap.get(audienceName);
              audienceMap.set(audienceName, audience);

              const update: Update<Audience> = {
                id: audience.audienceIdentifier, // this.varPkCache.get(audienceName).toString(),
                changes: {
                  fieldconte: fieldConteMap.get(audienceName)
                }
              };
              updates.push(update);
            });

          // Update the audiences with the corrected fieldconte
          if (updates.length > 0)
            this.store$.dispatch(new UpdateAudiences( { audiences: updates }));

          // TODO: The below is necessary to create the project var, should look into using project vars just for persistance
          // this.logger.debug.log('### parseCustomVarData - adding audience - for project var');
          // audienceMap.forEach((audienceDefinition, audienceName) => {
          //   this.audienceService.addAudience(audienceDefinition/*, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos)*/);
          // });
          // this.logger.debug.log('### parseCustomVarData - adding audience - for project var - done');

          if (!isReload){
            const geos = data.parsedData.length === 1 ? 'Geo' : 'Geos';
            this.store$.dispatch(new SuccessNotification({ message: `Valid ${geos} have been uploaded successfully`, notificationTitle: 'Custom Audience Upload'}));
          }

        }
      }
    } catch (e) {
      this.handleError(`${e}`);
      this.logger.error.log(e);
      results = null;
    }
    return results;
  }

  public parseCustomMapVar(dataBuffer: string, fileName: string, audiences: Audience[], geocodes: Set<string>) : MapVar[] {
    let results: MapVar[] = [];
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    const currentAudiences = audiences.filter(a => a.audienceSourceName === fileName);
    if (currentAudiences.length === 0) return results;
    try {
      const data: ParseResponse<CustomAudienceData> = FileService.parseDelimitedData(header, rows, audienceUpload);
      const failCount = data.failedRows.length;
      const successCount = data.parsedData.length;
      if (failCount > 0) {
        this.logger.error.log('There were errors parsing the following rows in the CSV: ', data.failedRows);
      }
      if (successCount > 0) {
          // Convert column names to audience ids
          data.parsedData.forEach(d => {
            if (geocodes.has(d.geocode)) {
              const mapVar: MapVar = { geocode: d.geocode };
              let hasData = false;
              currentAudiences.forEach(audience => {
                if (d[audience.audienceName] != null) {
                  mapVar[audience.audienceIdentifier] = d[audience.audienceName];
                  hasData = true;
                }
              });
              if (hasData) results.push(mapVar);
            }
          });
      }
    } catch (e) {
      results = [];
      this.logger.error.log('There was an error parsing custom data for map shading.', e);
    }
    return results;
  }

  public reloadVarsFromPrefs(justColumn?: string) : GeoVar[] {
    const result: GeoVar[] = [];
    try {
      if (this.stateService.currentProject$.getValue() != null)
        this.logger.info.log('this.stateService.currentProject$.getValue().impProjectPrefs = ', ((this.stateService.currentProject$.getValue().impProjectPrefs != null) ? this.stateService.currentProject$.getValue().impProjectPrefs.length : null));

      // Retrieve all of the custom vars from project prefs
      const prefs: ImpProjectPref[] = this.appProjectPrefService.getPrefsByGroup(ProjectPrefGroupCodes.CustomVar);
      this.logger.info.log('reloadVarsFromPrefs - custom var prefs.Count = ' + ((prefs != null) ? prefs.length : null));

      if (prefs != null && prefs.length > 0) {
        prefs.forEach(customVarPref => result.push(...this.parseCustomVarData(this.appProjectPrefService.getPrefVal(customVarPref.pref, true), customVarPref.pref, justColumn, true)));
      }
    }
    catch (e) {
       this.logger.error.log('Error loading custom vars:' + e);
    }

    return result;
  }

  public reloadMapVarFromPrefs(audiences: Audience[], geocodes: Set<string>) : MapVar[] {
    const result: MapVar[] = [];
    try {
      // Retrieve all of the custom vars from project prefs
      const prefs: ImpProjectPref[] = this.appProjectPrefService.getPrefsByGroup(ProjectPrefGroupCodes.CustomVar);
      this.logger.info.log('reloadMapVarFromPrefs - custom var prefs.Count = ' + ((prefs != null) ? prefs.length : null));

      if (prefs != null && prefs.length > 0) {
        prefs.forEach(customVarPref => result.push(...this.parseCustomMapVar(this.appProjectPrefService.getPrefVal(customVarPref.pref, true), customVarPref.pref, audiences, geocodes)));
      }
    }
    catch (e) {
       this.logger.error.log('Error loading custom map var:' + e);
    }
    return result;
  }

  private handleError(message: string) : void {
    this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'Custom Audience Upload'}));
  }


  private validateGeos(data: ParseResponse<CustomAudienceData>, header: string){
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(this.stateService.analysisLevel$.getValue());
    const outfields = ['geocode', 'latitude', 'longitude'];
    const queryResult = new Set<string>();
    const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));
    const chunked_arr = [];
    let index = 0;
    while (index < Array.from(uniqueGeos).length) {
      chunked_arr.push(Array.from(uniqueGeos).slice(index, 2000 + index));
      index += 2000;
    }
    const obs = chunked_arr.map(geoList => {
        return this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', geoList, false, outfields).pipe(
          map(graphics => graphics.map(g => g.attributes)),
          map(attrs => {
            attrs.forEach(r => queryResult.add(r.geocode));
            return queryResult;
          })
        );
    });

    merge(...obs, 4).pipe(
      map( response => {
        return Array.from(response);
      }),
      reduce((acc, result) => [...acc, ...result], []),
    ).subscribe(result => {
      const qResult = new Set(result);
      const fields = header.split(',');
      const records: string[] = [];
      records.push(header + '\n');
       data.parsedData.forEach(record => {
         if (!qResult.has(record.geocode)){
           let row = '';
          for (let i = 0; i <= fields.length - 1; i++ ){
            row = fields[i].toLocaleUpperCase() === 'GEOCODE' ? row + `${record.geocode},` : row + `${record[fields[i]]},`;
          }
          records.push(row.substring(0, row.length - 1) + '\n');
         }
       });
       if (records.length > 1){
          const a = document.createElement('a');
          const blob = new Blob(records, { type: 'text/csv' });
          a.href = window.URL.createObjectURL(blob);
          a['download'] = `Custom Data ${this.stateService.analysisLevel$.getValue()} Issues Log.csv`;
          a.click();
          const geos = records.length === 2 ? 'Geo' : 'Geos';
          this.store$.dispatch(new WarningNotification({ message: `Invalid ${geos} exist in the upload file, please check provided issues log`, notificationTitle: 'Custom Aud Upload Warning'}));
       }
    });
  }
}
