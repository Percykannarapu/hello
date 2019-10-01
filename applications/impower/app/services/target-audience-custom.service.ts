import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { Injectable } from '@angular/core';
import { FileService, Parser, ParseResponse } from '../val-modules/common/services/file.service';
import { EMPTY, Observable, BehaviorSubject } from 'rxjs';
import { AppLoggingService } from './app-logging.service';
import { TargetAudienceService } from './target-audience.service';
import { distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { groupBy, filterArray, safe } from '@val/common';
import { FieldContentTypeCodes, ProjectPrefGroupCodes } from '../val-modules/targeting/targeting.enums';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { ErrorNotification, SuccessNotification, WarningNotification } from '@val/messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { AppProjectPrefService } from './app-project-pref.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { TradeAreaTypeCodes } from '../impower-datastore/state/models/impower-model.enums';
import { Update } from '@ngrx/entity';
import { GeoVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.model';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { AddAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { UpdateAudiences } from './../impower-datastore/state/transient/audience/audience.actions';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppConfig } from 'app/app.config';
import { EsriQueryService } from '@val/esri';

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

    // Watch for trade area radius changes, but ignore changes to no trade areas
    this.tradeAreaService.storeObservable
      .pipe(withLatestFrom(this.stateService.applicationIsReady$),
            filter(([, isReady]) => isReady),
            map(([tas]) => tas),
            filter(tas => tas != null && tas.length > 0),   // Don't do anything if there aren't any trade areas
            tap(tas => this.logger.debug.log('TAs changed, checking if we care: ', tas)),
            filterArray(ta => ta.impGeofootprintGeos != null && ta.impGeofootprintGeos.length > 0),
            map(tas => tas.map(ta => {
              switch (ta.taType.toUpperCase()) {
                case TradeAreaTypeCodes.Radius.toUpperCase():
                  this.logger.debug.log('taType: ', ta.taType, ', radius: ', ta.taRadius);
                    return ta.taRadius;

                default:
                  this.logger.debug.log('taType: ', ta.taType, ', taNumber: ', ta.taNumber, ', num Geos: ', ta.impGeofootprintGeos.length);
                  return ta.taNumber + '-' + ta.gtaId + '-' + ta.impGeofootprintGeos.length;
                }}).join(',')),  // Map to just a delimited list of radiuses
//          tap(tas => this.logger.debug.log("ta string: " + tas)),
            distinctUntilChanged((x, y) => {
              this.logger.debug.log('x: ', x, ((x === y) ? '===' : '!==') + ' y: ', y, ', x.length: ', x.length, ', y.length: ', y.length, (y.length === 0 || x === y ? ' DID NOT FIND CHANGE' : ' FOUND CHANGE'));
              if (!(y.length === 0 || x === y))
                this.varService.clearAll();
              return y.length === 0 || x === y;
            }))
      .subscribe(tas => {
/*        this.varService.get().forEach(pv => console.debug("BEFORE: projectVar: ", pv));
        this.varService.remove(this.varService.get().filter(pv => pv.varSource === "Online_Audience-TA" || pv.isCustom));
        console.debug("projectVars after remove: " + this.varService.get().length);
        this.varService.get().forEach(pv => console.debug("AFTER: projectVar: ", pv));
        console.debug("Current project, project vars before: ");
        this.stateService.currentProject$.getValue().impProjectVars.forEach(pv => console.debug("project project var: ", pv));
        this.stateService.currentProject$.getValue().impProjectVars = this.stateService.currentProject$.getValue().impProjectVars.filter(pv => pv.source !== "Online_Audience-TA" && !pv.isCustom)
        console.debug("Current project, project vars after remove: ");
        this.stateService.currentProject$.getValue().impProjectVars.forEach(pv => console.debug("project project var: ", pv));*/
//        this.reloadCustomVars();
        //this.targetAudienceService.applyAudienceSelection();
      });

    this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(this.allAudiencesBS$);
  }

  private static createDataDefinition(name: string, source: string, id: string) : AudienceDataDefinition {
    const audience: AudienceDataDefinition = {
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
    return audience;
  }

  public rehydrateAudience() {
    try {
      const project = this.stateService.currentProject$.getValue();
      if (project == null) return;
      const customProjectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'custom');
      //console.log('### target-audience-custom - onLoadProject found ' + customProjectVars.length + ' custom project vars');

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
      console.error(error);
    }
  }

  private onLoadProject(ready: boolean) {
    if (!ready) return;
    this.rehydrateAudience();
  }

  private varPkForColumn(column: string) : string {
    let varPk = null;
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
          varPk = this.varService.getNextStoreId();
          const maxVarPk = Math.max.apply(Math, Array.from(this.varPkCache.values()));
          while (varPk <= maxVarPk) {
            varPk = this.varService.getNextStoreId();
          }
        }
      }
      this.varPkCache.set(column, varPk);
    }
    return varPk;
  }

  public parseFileData(dataBuffer: string, fileName: string, isReload: boolean = false) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
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
          if (!isReload) {
            const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
            const columnNames = Object.keys(data.parsedData[0]).filter(k => k !== 'geocode' && typeof data.parsedData[0][k] !== 'function');
            for (const column of columnNames) {
              // Get existing varPk
              const projectVars = this.projectVarService.get().filter(pv => pv.fieldname === column);
              const varPk = (projectVars != null && projectVars.length > 0) ? projectVars[0].varPk.toString() : column;
              const audDataDefinition = TargetAudienceCustomService.createDataDefinition(column, fileName, varPk);
              if (projectVars != null && projectVars.length > 0)
              {
                audDataDefinition.showOnGrid = projectVars[0].isIncludedInGeoGrid;
                audDataDefinition.showOnMap  = projectVars[0].isShadedOnMap;
                audDataDefinition.exportInGeoFootprint = projectVars[0].isIncludedInGeofootprint;
              }
              this.audienceService.addAudience(audDataDefinition);
              const metricText = 'CUSTOM' + '~' + audDataDefinition.audienceName + '~' + audDataDefinition.audienceSourceName + '~' + currentAnalysisLevel;
              this.store$.dispatch(new CreateAudienceUsageMetric('custom', 'upload', metricText, successCount));
            }
          }
          this.store$.dispatch(new SuccessNotification({ message: 'Upload Complete', notificationTitle: 'Custom Audience Upload'}));
        }
      }
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  public parseCustomVarData(dataBuffer: string, fileName: string, justColumn?: string, isReload: boolean = false) : GeoVar[] {
    // console.log('### parseCustomVarData - fired - dataBuffer size:', dataBuffer.length, 'filename:', fileName, 'justColumn:', justColumn);
    let results: GeoVar[] = [];
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
        if (!isReload)
            this.validateGeos(data, fileName, header);
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
                this.store$.dispatch(new AddAudience({ audience: audDataDefinition }));

                const metricText = 'CUSTOM' + '~' + audDataDefinition.audienceName + '~' + audDataDefinition.audienceSourceName + '~' + currentAnalysisLevel;
                this.store$.dispatch(new CreateAudienceUsageMetric('custom', 'upload', metricText, successCount));
              }
              else {
                // console.log('### parseCustomVarData - found existing audience -', columnAudience.seq, '-', columnAudience.audienceName, ', fieldconte:', columnAudience.fieldconte);
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

                if (audience.fieldconte != fieldConteMap.get(field))
                  correctAudience.add(field);
               }
            }

//fieldConteMap.forEach((value, key) => console.log('### parseCustomVarData - fieldConteMap after - key:', key, ', value:', value));
//correctAudience.forEach(key => console.log('### parseCustomVarData - correctAudience:', key));

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
          // console.log('### parseCustomVarData - adding audience - for project var');
          // audienceMap.forEach((audienceDefinition, audienceName) => {
          //   this.audienceService.addAudience(audienceDefinition/*, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos)*/);
          // });
          // console.log('### parseCustomVarData - adding audience - for project var - done');
           
          if (!isReload){
            const geos = data.parsedData.length == 1 ? 'Geo' : 'Geos'; 
            this.store$.dispatch(new SuccessNotification({ message: `Valid ${geos} have been uploaded successfully`, notificationTitle: 'Custom Audience Upload'}));
          }
              
        }
      }
    } catch (e) {
      this.handleError(`${e}`);
      console.error(e);
      results = null;
    }
    return results;
  }

  public parseCustomMapVar(dataBuffer: string, fileName: string, varName: string, varPk: string) : GeoVar[] {
    let results: GeoVar[] = [];
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
          this.currentFileName = fileName;
          this.dataCache = {};

          // For every column, create an audience
          const columnNames = Object.keys(data.parsedData[0]).filter(k => (varName == null || k === varName) && k !== 'geocode' && typeof data.parsedData[0][k] !== 'function');

          // Convert column names to audience ids
          const correctAudience: string[] = [];
          data.parsedData.forEach(d => {
            const mapVar = { geocode: d.geocode };
            if (Object.keys(d).includes(varName)) {
              mapVar[varPk] = d[varName];
              results.push(mapVar);
            }
          });
      }
    } catch (e) {
      this.handleError(`${e}`);
      results = null;
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
       console.error('Error loading custom vars:' + e);
    }

    return result;
  }

  public reloadMapVarFromPrefs(varName: string, varPk: string) : MapVar[] {
    const result: GeoVar[] = [];
    try {
      // Retrieve all of the custom vars from project prefs
      const prefs: ImpProjectPref[] = this.appProjectPrefService.getPrefsByGroup(ProjectPrefGroupCodes.CustomVar);
      this.logger.info.log('reloadMapVarFromPrefs - custom var prefs.Count = ' + ((prefs != null) ? prefs.length : null));

      if (prefs != null && prefs.length > 0) {
        prefs.forEach(customVarPref => result.push(...this.parseCustomMapVar(this.appProjectPrefService.getPrefVal(customVarPref.pref, true), customVarPref.pref, varName, varPk)));
      }
    }
    catch (e) {
       console.error('Error loading custom map var:' + e);
    }
    return result;
  }

  private buildGeoCache() : Map<string, ImpGeofootprintGeo[]> {
    const currentProject = this.stateService.currentProject$.getValue();
    return groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
  }

  private handleError(message: string) : void {
    this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'Custom Audience Upload'}));
  }

  private validateGeos(data: ParseResponse<CustomAudienceData>, fileNmae: string, header: string){
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(this.stateService.analysisLevel$.getValue());
    const outfields = ['geocode', 'latitude', 'longitude'];
    const queryResult = new Set<string>();
    const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));
    const errorGeo: CustomAudienceData[] = [];
    const successGeo = [];
    this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', Array.from(uniqueGeos), false, outfields).pipe(
      map(graphics => graphics.map(g => g.attributes)),
      map(attrs => {
        attrs.forEach(r => queryResult.add(r.geocode));
        return queryResult;
      })
     ).subscribe(qResult => {
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
      console.log('filteredData===>', records);
      const a = document.createElement('a');
      const blob = new Blob(records, { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a['download'] = `Custom Data ${this.stateService.analysisLevel$.getValue()} Issues Log.csv`;
      a.click();
      const geos = records.length == 2 ? 'Geo' : 'Geos'; 
      this.store$.dispatch(new WarningNotification({ message: `Invalid ${geos} exist in the upload file, please check provided issues log`, notificationTitle: 'Custom Aud Upload Warning'}));
     });
  }
}
