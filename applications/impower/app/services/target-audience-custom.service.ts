import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { Injectable } from '@angular/core';
import { FileService, Parser, ParseResponse } from '../val-modules/common/services/file.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { EMPTY, Observable } from 'rxjs';
import { TargetAudienceService } from './target-audience.service';
import { distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { filterArray, groupBy, safe } from '@val/common';
import { FieldContentTypeCodes, ProjectPrefGroupCodes } from '../val-modules/targeting/targeting.enums';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { AppProjectPrefService } from './app-project-pref.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { TradeAreaTypeCodes } from '../impower-datastore/state/models/impower-model.enums';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppProjectService } from './app-project.service';

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

  constructor(private audienceService: TargetAudienceService,
              private stateService: AppStateService,
              private domainFactory: ImpDomainFactoryService,
              private varService: ImpGeofootprintVarService,
              private projectVarService: ImpProjectVarService,
              private appProjectPrefService: AppProjectPrefService,
              private appProjectService: AppProjectService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private targetAudienceService: TargetAudienceService,
              private geoService: ImpGeofootprintGeoService,
              private store$: Store<LocalAppState>) {

    this.stateService.applicationIsReady$.subscribe(ready => this.onLoadProject(ready));
    // Watch for trade area radius changes, but ignore changes to no trade areas
    this.tradeAreaService.storeObservable
      .pipe(withLatestFrom(this.stateService.applicationIsReady$),
            filter(([, isReady]) => isReady),
            map(([tas]) => tas),
            filter(tas => tas != null && tas.length > 0)   // Don't do anything if there aren't any trade areas
            , tap(tas => console.log('TAs changed, checking if we care: ', tas))
            , filterArray(ta => ta.impGeofootprintGeos != null && ta.impGeofootprintGeos.length > 0)
            , map(tas => tas.map(ta => {
              switch (ta.taType.toUpperCase()) {
                case TradeAreaTypeCodes.Radius.toUpperCase():
                    console.log('taType: ', ta.taType, ', radius: ', ta.taRadius);
                    return ta.taRadius;

                default:
                    console.log('taType: ', ta.taType, ', taNumber: ', ta.taNumber, ', num Geos: ', ta.impGeofootprintGeos.length);
                    return ta.taNumber + '-' + ta.gtaId + '-' + ta.impGeofootprintGeos.length;
                }}).join(','))  // Map to just a delimited list of radiuses
//           ,tap(tas => console.log("ta string: " + tas))
            , distinctUntilChanged((x, y) => {
              console.log('x: ', x, ((x === y) ? '===' : '!==') + ' y: ', y, ', x.length: ', x.length, ', y.length: ', y.length, (y.length === 0 || x === y ? ' DID NOT FIND CHANGE' : ' FOUND CHANGE'));
              if (!(y.length === 0 || x === y))
                this.varService.clearAll();
              return y.length === 0 || x === y;
            }))
      .subscribe(() => {
/*        this.varService.get().forEach(pv => console.log("BEFORE: projectVar: ", pv));
        this.varService.remove(this.varService.get().filter(pv => pv.varSource === "Online_Audience-TA" || pv.isCustom));
        console.log("projectVars after remove: " + this.varService.get().length);
        this.varService.get().forEach(pv => console.log("AFTER: projectVar: ", pv));
        console.log("Current project, project vars before: ");
        this.stateService.currentProject$.getValue().impProjectVars.forEach(pv => console.log("project project var: ", pv));
        this.stateService.currentProject$.getValue().impProjectVars = this.stateService.currentProject$.getValue().impProjectVars.filter(pv => pv.source !== "Online_Audience-TA" && !pv.isCustom)
        console.log("Current project, project vars after remove: ");
        this.stateService.currentProject$.getValue().impProjectVars.forEach(pv => console.log("project project var: ", pv));*/
        this.reloadCustomVars();
        this.targetAudienceService.applyAudienceSelection();
      });
  }

  private static createDataDefinition(name: string, source: string, id: string) : AudienceDataDefinition {
   TargetAudienceService.audienceCounter++;
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
      audienceCounter: TargetAudienceService.audienceCounter,
      fieldconte: null,
      requiresGeoPreCaching: false
    };
    return audience;
  }

  private onLoadProject(ready: boolean) {
    if (!ready) return;
    // this.dataCache = {};
    // this.varPkCache.clear();
    // return;  // This appeared to be only reloading custom vars, which is taken care of elsewhere

    try {
      console.log('onLoadProject fired');
      const project = this.stateService.currentProject$.getValue();
      if (project == null) return;
      const customProjectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'custom');
      console.log('onLoadProject found ' + customProjectVars.length + ' custom vars');
      // this.dataCache = {};
      // this.varPkCache.clear();
      if (customProjectVars.length > 0){
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
          audienceCounter: projectVar.sortOrder,
          fieldconte: null,
          requiresGeoPreCaching: false
        };
        this.currentFileName = audience.audienceSourceName;
        // if (!this.varPkCache.has(audience.audienceName)) // Added to not create duplicate varPkCache entries
        // this.varPkCache.set(audience.audienceName, this.varService.getNextStoreId());
        if (projectVar.sortOrder > TargetAudienceService.audienceCounter) TargetAudienceService.audienceCounter = projectVar.sortOrder++;
        // const relatedGeoVars = project.getImpGeofootprintVars().filter(gv => gv.customVarExprDisplay === audience.audienceName);
        // for (const geoVar of relatedGeoVars) {
        //   if (!this.dataCache.hasOwnProperty(geoVar.geocode)) {
        //     this.dataCache[geoVar.geocode] = { geocode: geoVar.geocode };
        //   }
        //   if (geoVar.isString) {
        //     this.dataCache[geoVar.geocode][geoVar.customVarExprDisplay] = geoVar.valueString;
        //   } else {
        //     this.dataCache[geoVar.geocode][geoVar.customVarExprDisplay] = geoVar.valueNumber.toLocaleString();
        //   }
        // }
        console.log('onLoadProject - addAudience ' + projectVar.fieldname);
        this.audienceService.addAudience(audience, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
      }
    }
    } catch (error) {
      console.error(error);
    }
  // }
  }

  private createGeofootprintVar(geocode: string, column: string, value: string, fileName: string, geoCache: Map<string, ImpGeofootprintGeo[]>) : ImpGeofootprintVar[] {
    // console.log('CreateGeofootprintVar called');
    const fullId = `Custom/${fileName}/${column}`;
    let newVarPk = null;
// if (column == null)
// {
//   console.error("### createGeofootprintVar - column was null, geocode:", geocode,", value:", value,", filename:", fileName,", geoCache:", geoCache);
//   return [];
// }
   // If we have a varPk defined for this column already, use it, if not create one
// console.log("createGeofootprintVar custom checking varPkCache(" + this.varPkCache.size + ") for " + column);
    if (this.varPkCache.has(column)) {
      newVarPk = this.varPkCache.get(column);
      //console.log("createGeofootprintVar custom varPkCache found " + column + ", varPk: " + newVarPk);
      }
    else {
      // If there is a project var for this column, use the varPk from it.
      const projectVar = this.projectVarService.get().filter(pv => pv.fieldname === column);
      if (projectVar != null && projectVar.length > 0) {
          newVarPk = projectVar[0].varPk;
      }
      else {
        newVarPk = this.varService.getNextStoreId();
        const maxVarPk = Math.max.apply(Math, Array.from(this.varPkCache.values()));
        while (newVarPk <= maxVarPk) {
          newVarPk = this.varService.getNextStoreId();
        }
      }
      this.varPkCache.set(column, newVarPk);
      //console.log("createGeofootprintVar custom varPkCache did NOT find " + column + ", new varPk: " + newVarPk, ", varPkCache:", this.varPkCache);
    }
    const results: ImpGeofootprintVar[] = [];
    const numberAttempt = Number(value);
    const fieldDescription: string = `${column}`;

    // Determine the type and value for the variable
    let fieldType: FieldContentTypeCodes;
    let fieldValue: string | number;
    if (Number.isNaN(numberAttempt)) {
      fieldValue = value;
      fieldType = FieldContentTypeCodes.Char;
    } else {
      fieldValue = numberAttempt;
      fieldType = FieldContentTypeCodes.Index;
    }

    // For each geo matching this geocode, determine if it needs a geo var
    this.geoService.get().filter(geo => geo.geocode === geocode).forEach(geo => {
      // If there is no geo var for this geocode / varPk / location, create one
      if (this.varService.get().findIndex(gvar => gvar.geocode === geocode && gvar.varPk === newVarPk && gvar.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber) === -1
                     && results.findIndex(gvar => gvar.geocode === geocode && gvar.varPk === newVarPk && gvar.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber) === -1) {
        const currentResult: ImpGeofootprintVar = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, newVarPk, fieldValue, fullId, fieldDescription, fieldType);
        currentResult.impGeofootprintLocation = geo.impGeofootprintLocation; // TODO: This should be part of the factory method
        console.log('createGeofootprintVar custom - created a var: loc: ' + currentResult.impGeofootprintLocation.locationNumber + ', geocode: ' + currentResult.geocode + ', varPk: ' + currentResult.varPk);
        results.push(currentResult);
      }
    });
    this.varService.add(results); //, null, null, InTransaction.silent);
    return results;
/*
   // If we do not have a geo var for this varPk / geocode, create it
//   if (!this.varService.get().filter(gvar => gvar.geocode === geocode && gvar.varPk === newVarPk))
   if (this.varService.get().findIndex(gvar => gvar.geocode === geocode && gvar.varPk === newVarPk) === -1) {
      // For each geo matching this geocode, create a variable
      this.geoService.get().filter(geo => geo.geocode === geocode).forEach(geo => {
      console.log("createGeofootprintVar - created a var: loc: " + geo.impGeofootprintLocation.locationNumber + ", geocode: " + geo.geocode + ", varPk: " + newVarPk);
         const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, newVarPk, fieldValue, fullId, fieldDescription, fieldType);
        results.push(currentResult);
   });
   this.varService.add(results);
   return results;
   }
   else
   {
//      console.log("createGeofootprintVar - did NOT create a var");
      return [];
   }*/
   /*
   if (geoCache.has(geocode)) {
     geoCache.get(geocode).forEach(geo => {
       const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, newVarPk, fieldValue, fullId, fieldDescription, fieldType);
       if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
         results.push(currentResult);
     });
   }
   this.varPkCache.set(column, newVarPk);
   return results;*/
 }

  public parseFileData(dataBuffer: string, fileName: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    try {
      const data: ParseResponse<CustomAudienceData> = FileService.parseDelimitedData(header, rows, audienceUpload);
      const failCount = data.failedRows.length;
      const successCount = data.parsedData.length;
      //console.log("parseFileData.data = ", data);

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
            // console.log("parseFileData - addAudience for " + column);
            this.audienceService.addAudience(audDataDefinition, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
            const metricText = 'CUSTOM' + '~' + audDataDefinition.audienceName + '~' + audDataDefinition.audienceSourceName + '~' + currentAnalysisLevel;
            this.store$.dispatch(new CreateAudienceUsageMetric('custom', 'upload', metricText, successCount));
          }
          this.store$.dispatch(new SuccessNotification({ message: 'Upload Complete', notificationTitle: 'Custom Audience Upload'}));
        }
      }
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  public reloadCustomVars() {
      console.log('reloadCustomVars fired - total prefs: ' + this.appProjectPrefService.getAllPrefs().length);
      try {
         //console.log("currentProject = ", this.stateService.currentProject$.getValue());
         if (this.stateService.currentProject$.getValue() != null)
            console.log('this.stateService.currentProject$.getValue().impProjectPrefs = ', ((this.stateService.currentProject$.getValue().impProjectPrefs != null) ? this.stateService.currentProject$.getValue().impProjectPrefs.length : null));

         // Retrieve all of the custom vars from project prefs
         const prefs: ImpProjectPref[] = this.appProjectPrefService.getPrefsByGroup(ProjectPrefGroupCodes.CustomVar);
         console.log('custom var prefs.Count = ' + ((prefs != null) ? prefs.length : null));

         if (prefs != null && prefs.length > 0)
         {
            // let removeVars:ImpProjectVar[] = this.varService.get().filter(pv => pv.source === "Online_Audience-TA" || pv.isCustom);
            //    console.log("addAudiences going to remove " + removeVars.length + " project vars");
            // removeVars.forEach(rvar => rvar.impProject = null);
/*
            this.varService.get().forEach(pv => console.log("BEFORE: projectVar: ", pv));
//            this.varService.clearAll(false);  // TODO: Attempting to just clear them all
            this.varService.remove(this.varService.get().filter(pv => pv.varSource === "Online_Audience-TA" || pv.isCustom));

            console.log("projectVars after remove: " + this.varService.get().length);
            this.varService.get().forEach(pv => console.log("AFTER: projectVar: ", pv));
            console.log("Current project, project vars before: ");
            this.stateService.currentProject$.getValue().impProjectVars.forEach(pv => console.log("project project var: ", pv));
            this.stateService.currentProject$.getValue().impProjectVars = this.stateService.currentProject$.getValue().impProjectVars.filter(pv => pv.source !== "Online_Audience-TA" && !pv.isCustom)
            //this.stateService.currentProject$.getValue().impProjectVars = [];
            //tradeAreas.forEach(ta => ta.impGeofootprintGeos = ta.impGeofootprintGeos.filter(g => !geoSet.has(g)));
            console.log("Current project, project vars after remove: ");
            this.stateService.currentProject$.getValue().impProjectVars.forEach(pv => console.log("project project var: ", pv));
*/
            // Just clearing out custom
            const projectVarsDict = this.stateService.projectVarsDict$;
            this.varService.remove(this.varService.get().filter(pv => (projectVarsDict[pv.varPk] || safe).isCustom));
            // const varsToDelete = this.stateService.currentProject$.getValue().impProjectVars.filter(pv => pv.isCustom);
            // this.appProjectService.deleteProjectVars(varsToDelete);

// Clearing out online and custom
//            this.varService.remove(this.varService.get().filter(pv => pv.varSource === "Online_Audience-TA" || pv.isCustom));
//            this.stateService.currentProject$.getValue().impProjectVars = this.stateService.currentProject$.getValue().impProjectVars.filter(pv => pv.source !== "Online_Audience-TA" && !pv.isCustom)

            // prefs.forEach(customVarPref => console.log('reloadCustomVars - name: ', customVarPref.pref, ', Custom Var Pref: ', customVarPref));
            // prefs.forEach(customVarPref => this.parseFileData(this.appProjectPrefService.getPrefVal(customVarPref.pref, true), customVarPref.pref));
            this.targetAudienceService.applyAudienceSelection();
         }
      }
      catch (e) {
         console.error('Error loading custom vars: ' + e);
      }
  }

  private buildGeoCache() : Map<string, ImpGeofootprintGeo[]> {
    const currentProject = this.stateService.currentProject$.getValue();
    return groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
  }

  private handleError(message: string) : void {
    this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'Custom Audience Upload'}));
  }

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    console.log('Refresh callback', geocodes, identifiers);
    // console.log("addAudience - target-audience-custom - audienceRefreshCallback fired - ");
    if (identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const geoSet = new Set(geocodes);
    const geoCache = this.buildGeoCache();
    const allNewVars = [];
    const projectVarsDict = this.stateService.projectVarsDict$.getValue();
    geoSet.forEach(geo => {
      if (this.dataCache.hasOwnProperty(geo)) {
        identifiers.forEach(varPk => {
          const column = (projectVarsDict[varPk] || safe).fieldname;
          const newVars = this.createGeofootprintVar(geo, column, this.dataCache[geo][column], this.currentFileName, geoCache);
          allNewVars.push(...newVars);
        });
      }
    });
    // console.groupCollapsed("New custom vars: " + allNewVars.length);
    // console.log("allNewVars:", allNewVars);
    // console.groupEnd();
    return Observable.create(o => {
      o.next(allNewVars);
      o.complete();
    });
  }
}
