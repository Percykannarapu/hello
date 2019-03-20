import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AudienceDataDefinition, AudienceTradeAreaConfig, AudienceTradeareaLocation } from '../models/audience-data.model';
import { RestResponse } from '../models/RestResponse';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { FieldContentTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';
import { mapByExtended, groupByExtended } from '@val/common';
import { InTransaction } from '../val-modules/common/services/datastore.service';

interface AudienceTradeareaResponse {
  maxRadius: number;
  indexRank: number;
  geoLevel: string;
  distance: number;
  scoreType: string;
  source: string;
  taxonomy: string;
  categoryName: string;
  indexTileName: string;
  tradeareaLocation: string;
  locationName: string;
  geocodeHHC: number;
  distanceRank: number;
  zScore: number;
  minRadius: number;
  distanceTile: number;
  weightedIndexValue: number;
  std: number;
  var: number;
  indexTileSeq: number;
  totalHHC: number;
  weight: number;
  combinedScore: number;
  runningTotal: number;
  median: number;
  weightedDistance: number;
  geocode: string;
  distanceTileSeq: number;
  combinedIndex: number;
  indexValue: number;
  indexTile: number;
  combinedIndexTileName: string;
  combinedIndexTile: number;
}


@Injectable({
  providedIn: 'root'
})
export class TargetAudienceAudienceTA {

  private varPkCache: Map<string, number> = new Map<string, number>();
  private geoVarMap: Map<string, string> = new Map<string, string>();
  private geoVarFieldMap: Map<string, string> = new Map<string, string>();

  constructor(private config: AppConfig, private restService: RestDataService, private audienceService: TargetAudienceService,
              private appStateService: AppStateService, private varService: ImpGeofootprintVarService, private factory: ImpDomainFactoryService,
              private tradeAreaService: ImpGeofootprintTradeAreaService, private projectVarService: ImpProjectVarService, private httpClient: HttpClient) {
    this.geoVarMap.set('Index Value', 'number');
    this.geoVarMap.set('Combined Index', 'number');
    this.geoVarMap.set('Combined Tile Name', 'string');
    this.geoVarMap.set('Combined Tile Number', 'number');
    this.geoVarMap.set('In/Out', 'string');

    this.geoVarFieldMap.set('Index Value', 'indexValue');
    this.geoVarFieldMap.set('Combined Index', 'combinedIndex');
    this.geoVarFieldMap.set('Combined Tile Name', 'combinedIndexTileName');
    this.geoVarFieldMap.set('Combined Tile Number', 'combinedIndexTile');
    this.geoVarFieldMap.set('In/Out', 'tradeareaLocation');

    this.appStateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoadProject());

  }

  private onLoadProject() {
    try {
      const project = this.appStateService.currentProject$.getValue();
      let projectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online');
      projectVars = projectVars.filter(v => v.source.split('_')[1].toLowerCase().includes('audience'));
      if (projectVars.length > 0) {
        for (const projectVar of projectVars) {
          const currentAudience: AudienceDataDefinition = {
            audienceName: projectVar.fieldname,
            audienceIdentifier: projectVar.varPk.toString(),
            audienceSourceType: 'Online',
            audienceSourceName: 'Audience-TA',
            exportInGeoFootprint: true,
            showOnGrid: false,
            showOnMap: false,
            allowNationalExport: false,
            exportNationally: false,
            secondaryId: this.reloadSecondaryId(projectVar),
            audienceTAConfig: this.reloadAudienceTaConfig()
          };
          this.projectVarService.getNextStoreId(); //do this so that we don't collide with any new project vars we create
          this.audienceService.addAudience(
            currentAudience,
            (al, pks, geos, shading, audience) => this.dataRefreshCallback(null, null, null, null, audience),
            null);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  private reloadAudienceTaConfig() : AudienceTradeAreaConfig {
    const audienceTALocations = new Array<AudienceTradeareaLocation>();
    for (const location of this.appStateService.currentProject$.getValue().getImpGeofootprintLocations()) {
      const audienceTALocation: AudienceTradeareaLocation = {
        LOCATIONNAME: location.locationNumber,
        XCOORD: location.xcoord,
        YCOORD: location.ycoord,
        HOMEGEOCODE: location.homeGeocode
      };
      audienceTALocations.push(audienceTALocation);
    }
    const project = this.appStateService.currentProject$.getValue();
    return {
      analysisLevel: this.appStateService.analysisLevel$.getValue(),
      digCategoryId: project.audTaVarPk,
      locations: audienceTALocations,
      maxRadius: project.audTaMaxRadiu,
      minRadius: project.audTaMinRadiu,
      scoreType: project.audTaIndexBase,
      weight: project.audTaVarWeight,
      includeMustCover: null
    };
  }

  private reloadSecondaryId(projectVar: ImpProjectVar) : string {
    for (const key of Array.from(this.geoVarMap.keys())) {
      if (projectVar.fieldname.includes(key)) {
        return key;
      }
    }
    return '';
  }

  private createDataDefinition(name: string, digId: number, audienceTAConfig: AudienceTradeAreaConfig, digCategoryId: number) : AudienceDataDefinition {
    const audiences = this.audienceService.getAudiences().filter(a => a.audienceSourceType === 'Online' && Number(a.secondaryId.replace(',', '')) === digCategoryId);
    let audienceName = '';
    if (audiences.length > 0) {
      audienceName = audiences[0].audienceName;
    }
    TargetAudienceService.audienceCounter++;
    const audience: AudienceDataDefinition = {
      audienceName: `${audienceName} ${name}`,
      audienceIdentifier: this.projectVarService.getNextStoreId().toString(), // `${digId}-${name}`,
      audienceSourceType: 'Online',
      audienceSourceName: 'Audience-TA',
      exportInGeoFootprint: true,
      showOnGrid: false,
      showOnMap: false,
      allowNationalExport: false,
      exportNationally: false,
      secondaryId: `${name}`,
      audienceTAConfig: audienceTAConfig,
      audienceCounter: TargetAudienceService.audienceCounter
    };
    return audience;
  }


  public addAudiences(taResponseCache: Map<string, Map<number, AudienceTradeareaResponse>>, digCategoryId, audienceTAConfig: AudienceTradeAreaConfig) {
    //console.debug("addAudiences - target-audience-audienceta - fired - audienceTAConfig: ", audienceTAConfig);
    for (const key of Array.from(this.geoVarMap.keys())) {
      const model = this.createDataDefinition(key, digCategoryId, audienceTAConfig, digCategoryId);
      this.audienceService.addAudience(
        model,
        (al, pks, geos, shading, audience) => this.dataRefreshCallback(null, null, null, null, audience),
        null);
    }
    /*this.audienceService.addAudience(
        model,
        (al, pks, geos, shading) => this.apioRefreshCallback(source, al, pks, geos, shading),
        (al, pk) => this.nationalRefreshCallback(source, al, pk)
    );*/
    this.createGeofootprintVars(taResponseCache);
  }

  private createGeofootprintVars(taResponseCache: Map<string, Map<number, AudienceTradeareaResponse>>) : ImpGeofootprintVar[] {
    //console.debug("target-audience-audienceta - createGeofootprintVars - Locs: " + taResponseCache.size + ", taResponseCache: ", taResponseCache);
    let varPk = null;
    let geofootprintVars: ImpGeofootprintVar[] = [];
    const taByLocationNum = mapByExtended(this.tradeAreaService.get().filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Audience), item => item.impGeofootprintLocation.locationNumber);
    for (const location of Array.from(taResponseCache.keys())) {
      //console.log("target-audience-audienceta - createGeofootprintVars - processing location:", location);
      const geoResponses: Map<number, AudienceTradeareaResponse> = taResponseCache.get(location);
      const geoResponseKeys = Array.from(geoResponses.keys());
      if (geoResponseKeys.length > 0 && !taByLocationNum.has(location)) {
        console.error('There is a Custom Audience TA geoResponse object with no associated Trade Area object. [locationNumber, geoResponses]:', [location, geoResponses]);
        continue;
      }
      const currentTradeArea = taByLocationNum.get(location);
      for (const geoResponseId of geoResponseKeys) {
        for (const geoVarKey of Array.from(this.geoVarMap.keys())) {
          if (this.varPkCache.has(geoVarKey)) {
            varPk = this.varPkCache.get(geoVarKey);
          } else {
            // Get a new varPk, ensuring that it is bigger than max already used
            varPk = this.varService.getNextStoreId();
            let maxVarPk = Math.max.apply(Math, Array.from(this.varPkCache.values()));
            while (varPk <= maxVarPk)
              varPk = this.varService.getNextStoreId();
          }
          this.varPkCache.set(geoVarKey, varPk);

          const geoResponse: AudienceTradeareaResponse = geoResponses.get(geoResponseId);
          let geoVar: ImpGeofootprintVar;

          if (this.varService.get().findIndex(gvar => gvar.geocode === geoResponse.geocode && gvar.varPk === varPk && gvar.impGeofootprintLocation.locationNumber === location) === -1
          &&       geofootprintVars.findIndex(gvar => gvar.geocode === geoResponse.geocode && gvar.varPk === varPk && gvar.impGeofootprintLocation.locationNumber === location) === -1)
          {
            if (this.geoVarMap.get(geoVarKey) === 'string') {
              geoVar = this.createGeoVar(currentTradeArea, varPk, geoResponse.geocode, 'string', geoVarKey, geoResponse.categoryName, geoResponse[this.geoVarFieldMap.get(geoVarKey)]);
            } else {
              geoVar = this.createGeoVar(currentTradeArea, varPk, geoResponse.geocode, 'number', geoVarKey, geoResponse.categoryName, null, geoResponse[this.geoVarFieldMap.get(geoVarKey)], 'index');
            }
            geofootprintVars.push(geoVar);
          }
        }
      }
    }

    // Filter out any dupes
    geofootprintVars = (geofootprintVars.filter(gv => this.varService.get().findIndex(gvar => gvar.geocode === gv.geocode && gvar.varPk === gv.varPk && gvar.impGeofootprintLocation.locationNumber === gv.impGeofootprintLocation.locationNumber) === -1));
    if (geofootprintVars.length > 0)
      this.varService.add(geofootprintVars);//, null, null, InTransaction.silent);
    console.log("target-audience-audienceta - createGeofootprintVars - Added:", geofootprintVars.length, "new geo vars");
    // DEBUG: Print variable counts
    // console.log("target-audience-audienceta - current geo vars");
    // let variablePkCounts:Map<string,ImpGeofootprintVar[]> = groupByExtended(this.varService.get(), (i) => i.varPk + ", " + i.customVarExprDisplay);
    // if (variablePkCounts != null && variablePkCounts.size > 0)
    //   console.table(Array.from(variablePkCounts.keys()).map(v => { return {Variable: v, Count: variablePkCounts.get(v).length}}));
    return geofootprintVars;
  }

  /**
   * Create geoffotprint variables for the for the geos that are being selected
   * @param currentTradeArea The Trade Area object to attach this geovar to.
   * @param pk The primary key of the new
   * @param geocode The geocode of the new variable
   * @param type The variable type, string or number
   * @param fieldDisplay The display name of the new variable
   * @param audienceName The audience name for the variable
   * @param valueString If the type is a string, the string value
   * @param valueNumber If the type is a number, the number value
   * @param numberType If the number is a vlaue the number type, index or percent
   */
  private createGeoVar(currentTradeArea: ImpGeofootprintTradeArea, pk: number, geocode: string, type: 'string' | 'number', fieldDisplay: string, audienceName: string, valueString?: string, valueNumber?: number, numberType?: 'index' | 'percent') : ImpGeofootprintVar {
    const value = valueString == null ? valueNumber : valueString;
        const fieldType = type === 'string' ? FieldContentTypeCodes.Char : numberType === 'index' ? FieldContentTypeCodes.Index : FieldContentTypeCodes.Percent;
        const result = this.factory.createGeoVar(currentTradeArea, geocode, pk, value, '', fieldDisplay, fieldType, audienceName);
    for (const audience of this.audienceService.getAudiences()) {
      if (result.fieldname != null && result.fieldname.replace(/\s/g, '') + result.customVarExprDisplay.replace(/\s/g, '') === audience.audienceName.replace(/\s/g, '')) {
              result.varPosition = audience.audienceCounter;
      }
    }
    return result;
  }

  /**
   * Parse the response from Fuse and build the array of audienceTradeareaResponses
   * This method will also create the renderer data that is required for map shading
   */
  private parseResponse(restResponse: RestResponse, alternateCategory: string) : Map<string, Map<number, AudienceTradeareaResponse>> {
        const taResponses = new Map<string, Map<number, AudienceTradeareaResponse>>();
        let count: number = 0;
        const rows: AudienceTradeareaResponse[] = restResponse.payload.rows;
    for (const taResponse of rows) {
            if (taResponse.categoryName == null) {
              taResponse.categoryName = alternateCategory;
            }
      if (taResponses.has(taResponse.locationName)) {
        taResponses.get(taResponse.locationName).set(count, taResponse);
        count++;
      } else {
        count = 0; // reset the counter for each new location
        const addResponse: Map<number, AudienceTradeareaResponse> = new Map<number, AudienceTradeareaResponse>();
        addResponse.set(count, taResponse);
        taResponses.set(taResponse.locationName, addResponse);
        count++;
      }
      const geoVar: ImpGeofootprintVar = new ImpGeofootprintVar();
      geoVar.valueString = taResponse.combinedIndexTileName;
    }
    return taResponses;
  }

    private dataRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, audience?: AudienceDataDefinition) : Observable<ImpGeofootprintVar[]> {
      //console.debug("addAudience - target-audience-audienceta - dataRefreshCallback, audience: ", audience);
      if (!audience) return EMPTY;

      // Update the ta config
      audience.audienceTAConfig = this.reloadAudienceTaConfig();

      const payload = audience.audienceTAConfig;
      const localAudienceName = audience.audienceName.replace(audience.secondaryId, '').trim();
      delete payload.includeMustCover;
      delete payload.audienceName;

      if (payload.analysisLevel)
        payload.analysisLevel = payload.analysisLevel.toLowerCase();

      if (payload.analysisLevel.toLocaleLowerCase() === 'digital atz') {
        payload.analysisLevel = 'dtz';
      }

      //DE2057: If the digCategoryId is null get it from the project
      if (payload.digCategoryId == null) {
        payload.digCategoryId = this.appStateService.currentProject$.getValue().audTaVarPk;
    }

    const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
    const url: string = this.config.valServiceBase + 'v1/targeting/base/audiencetradearea';
    console.log('Preparing to send Audience TA payload to Fuse', payload);
    const dataObs: Observable<RestResponse> = this.httpClient.post<RestResponse>(url, JSON.stringify(payload), { headers: headers });
    return dataObs.pipe(
      map(res => this.createGeofootprintVars(this.parseResponse(res, localAudienceName)))
    );
  }
}
