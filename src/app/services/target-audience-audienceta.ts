import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition, AudienceTradeAreaConfig, AudienceTradeareaLocation } from '../models/audience-data.model';
import { map, shareReplay } from 'rxjs/operators';
import { EMPTY, merge, Observable, forkJoin, throwError } from 'rxjs';
import { chunkArray } from '../app.utils';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { UsageService } from './usage.service';
import { AppStateService } from './app-state.service';
import { simpleFlatten } from '../val-modules/common/common.utils';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { RestResponse } from '../models/RestResponse';

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
    private counter = 0;

    constructor(private config: AppConfig, private restService: RestDataService, private audienceService: TargetAudienceService,
        private usageService: UsageService, private appStateService: AppStateService, private varService: ImpGeofootprintVarService,
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
    }

    private createDataDefinition(name: string, digId: number, audienceTAConfig: AudienceTradeAreaConfig, digCategoryId: number) : AudienceDataDefinition {
        const audiences = this.audienceService.getAudiences().filter(a => a.audienceSourceType === 'Online' && Number(a.secondaryId.replace(',', '')) === digCategoryId);
        let audienceName = '';
        if (audiences.length > 0) {
            audienceName = audiences[0].audienceName;
        }
        const audience: AudienceDataDefinition = {
            audienceName: `${audienceName} ${name}`,
            audienceIdentifier: `${digId}-${name}`,
            audienceSourceType: 'Online',
            audienceSourceName: 'Audience-TA',
            exportInGeoFootprint: true,
            showOnGrid: true,
            showOnMap: false,
            allowNationalExport: false,
            exportNationally: false,
            secondaryId: `${name}`,
            audienceTAConfig: audienceTAConfig,
            audienceCounter: TargetAudienceService.audienceCounter
        };
        TargetAudienceService.audienceCounter++;
        return audience;
    }


    public addAudiences(taResponseCache: Map<string, Map<number, AudienceTradeareaResponse>>, digCategoryId, audienceTAConfig: AudienceTradeAreaConfig) {

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

    /**
     * 
   * @param geocode The geocode of the new variable
   * @param type The variable type, string or number
   * @param fieldDisplay The display name of the new variable
   * @param valueString If the type is a string, the string value
   * @param valueNumber If the type is a number, the number value
   * @param numberType If the number is a vlaue the number type, index or percent
   */
    private createGeofootprintVars(taResponseCache: Map<string, Map<number, AudienceTradeareaResponse>>) : ImpGeofootprintVar[] {
        let varPk = null;
        const geofootprintVars: ImpGeofootprintVar[] = [];

        for (const location of Array.from(taResponseCache.keys())) {
            const geoResponses: Map<number, AudienceTradeareaResponse> = taResponseCache.get(location);
            for (const geoResponseId of Array.from(geoResponses.keys())) {
                for (const geoVarKey of Array.from(this.geoVarMap.keys())) {
                    if (this.varPkCache.has(geoVarKey)) {
                        varPk = this.varPkCache.get(geoVarKey);
                    } else {
                        varPk = this.varService.getNextStoreId();
                        this.varPkCache.set(geoVarKey, varPk);
                    }
                    const geoResponse = geoResponses.get(geoResponseId);
                    let geoVar: ImpGeofootprintVar = new ImpGeofootprintVar();
                    if (this.geoVarMap.get(geoVarKey) === 'string') {
                        geoVar = this.createGeoVar(varPk, geoResponse.geocode, 'string', geoVarKey, geoResponse[this.geoVarFieldMap.get(geoVarKey)]);
                    } else {
                        geoVar = this.createGeoVar(varPk, geoResponse.geocode, 'number', geoVarKey, null, geoResponse[this.geoVarFieldMap.get(geoVarKey)], 'index');
                    }
                    geofootprintVars.push(geoVar);
                }

            }
        }
        this.varService.add(geofootprintVars);
        return geofootprintVars;
    }

    /**
   * Create geoffotprint variables for the for the geos that are being selected
   * @param pk The primary key of the new 
   * @param geocode The geocode of the new variable
   * @param type The variable type, string or number
   * @param fieldDisplay The display name of the new variable
   * @param valueString If the type is a string, the string value
   * @param valueNumber If the type is a number, the number value
   * @param numberType If the number is a vlaue the number type, index or percent
   */
    private createGeoVar(pk: number, geocode: string, type: 'string' | 'number', fieldDisplay: string, valueString?: string, valueNumber?: number, numberType?: 'index' | 'percent') : ImpGeofootprintVar {
        const newVar: ImpGeofootprintVar = new ImpGeofootprintVar();
        newVar.varPk = pk;
        newVar.gvId = this.varService.getNextStoreId();
        newVar.geocode = geocode;
        newVar.isActive = true;
        newVar.customVarExprDisplay = fieldDisplay;
        if (type === 'string') {
            newVar.valueString = valueString;
            newVar.isString = true;
            newVar.fieldconte = 'CHAR';
        } else {
            newVar.valueNumber = valueNumber;
            newVar.isNumber = true;
            if (numberType === 'index') {
                newVar.fieldconte = 'INDEX';
            } else {
                newVar.fieldconte = 'PERCENT';
            }
        }
        return newVar;
    }

    /**
   * Parse the response from Fuse and build the array of audienceTradeareaResponses
   * This method will also create the renderer data that is required for map shading
   * @param restResponse The response from Fuse returned from the trade area service
   */
    private parseResponse(restResponse: RestResponse) : Map<string, Map<number, AudienceTradeareaResponse>> {
        const taResponses = new Map<string, Map<number, AudienceTradeareaResponse>>();
        let count: number = 0;
        for (const taResponse of restResponse.payload.rows) {
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
        if (!audience) return new Observable<Array<ImpGeofootprintVar>>();
        const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
        const url: string = this.config.valServiceBase + 'v1/targeting/base/audiencetradearea';
        const dataObs: Observable<RestResponse> = this.httpClient.post<RestResponse>(url, JSON.stringify(audience.audienceTAConfig), { headers: headers });
        return dataObs.pipe(
            map(res => this.createGeofootprintVars(this.parseResponse(res)))
        );

    }
}