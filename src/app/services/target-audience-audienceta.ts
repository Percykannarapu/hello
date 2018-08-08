import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AudienceDataDefinition, AudienceTradeAreaConfig, AudienceTradeareaLocation } from '../models/audience-data.model';
import { RestResponse } from '../models/RestResponse';
import { mapByExtended } from '../val-modules/common/common.utils';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';
import { UsageService } from './usage.service';

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

        // We cannot currently load AudienceTA audiences since there 
        // is no support for saving the audience trade area configuration
        //this.appStateService.projectIsLoading$.subscribe(loading => this.onLoadProject(loading));

    }

    private onLoadProject(loading: boolean) {
        if (loading) return; // loading will be false when the load is actually done
        try {
            const project = this.appStateService.currentProject$.getValue();
            let projectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online');
            projectVars = projectVars.filter(v => v.source.split('_')[1].toLowerCase().includes('audience'));
            if (projectVars.length > 0) {
                this.projectVarService.clearAll();
                this.projectVarService.add(project.impProjectVars);
                for (const projectVar of projectVars) {
                    const audience: AudienceDataDefinition = {
                        audienceName: projectVar.fieldname,
                        audienceIdentifier: projectVar.varPk.toString(),
                        audienceSourceType: 'Online',
                        audienceSourceName: 'Audience-TA',
                        exportInGeoFootprint: true,
                        showOnGrid: true,
                        showOnMap: false,
                        allowNationalExport: false,
                        exportNationally: false,
                        secondaryId: this.reloadSecondaryId(projectVar),
                        audienceTAConfig: this.reloadAudienceTaConfig()
                    };
                    this.audienceService.addAudience(
                        audience,
                        (al, pks, geos, shading, audience) => this.dataRefreshCallback(null, null, null, null, audience),
                        null);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    private reloadAudienceTaConfig(): AudienceTradeAreaConfig {
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
        const audienceTAConfig: AudienceTradeAreaConfig = {
            analysisLevel: null,
            digCategoryId: null,
            locations: audienceTALocations,
            maxRadius: null,
            minRadius: null,
            scoreType: null,
            weight: null
        };
        return audienceTAConfig;
    }

    private reloadSecondaryId(projectVar: ImpProjectVar): string {
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

    private createGeofootprintVars(taResponseCache: Map<string, Map<number, AudienceTradeareaResponse>>) : ImpGeofootprintVar[] {
        let varPk = null;
        const geofootprintVars: ImpGeofootprintVar[] = [];
        const taByLocationNum = mapByExtended(this.tradeAreaService.get().filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Audience), item => item.impGeofootprintLocation.locationNumber);
        console.log('Trade Area grouping', taByLocationNum);
        for (const location of Array.from(taResponseCache.keys())) {
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
                        varPk = this.varService.getNextStoreId();
                        this.varPkCache.set(geoVarKey, varPk);
                    }
                    const geoResponse: AudienceTradeareaResponse = geoResponses.get(geoResponseId);
                    let geoVar: ImpGeofootprintVar = new ImpGeofootprintVar();
                    if (this.geoVarMap.get(geoVarKey) === 'string') {
                        geoVar = this.createGeoVar(currentTradeArea, varPk, geoResponse.geocode, 'string', geoVarKey, geoResponse.categoryName, geoResponse[this.geoVarFieldMap.get(geoVarKey)]);
                    } else {
                        geoVar = this.createGeoVar(currentTradeArea, varPk, geoResponse.geocode, 'number', geoVarKey, geoResponse.categoryName, null, geoResponse[this.geoVarFieldMap.get(geoVarKey)], 'index');
                    }
                    geofootprintVars.push(geoVar);
                }
            }
        }
        console.log('Created Audience TA geovars:', geofootprintVars);
        this.varService.add(geofootprintVars);
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
        const newVar: ImpGeofootprintVar = new ImpGeofootprintVar();
        newVar.varPk = pk;
        newVar.gvId = this.varService.getNextStoreId();
        newVar.geocode = geocode;
        newVar.isActive = true;
        newVar.customVarExprDisplay = fieldDisplay;
        newVar.fieldname = audienceName;
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
        newVar.impGeofootprintTradeArea = currentTradeArea;
        currentTradeArea.impGeofootprintVars.push(newVar);
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
