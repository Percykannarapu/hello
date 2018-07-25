import { Injectable } from '@angular/core';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { AppRendererService, OutlineSetup, SmartRendererSetup } from './app-renderer.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { AppMapService, Coordinates } from './app-map.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AppConfig } from '../app.config';
import { RestResponse } from '../models/RestResponse';
import { TargetAudienceService } from './target-audience.service';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { AppStateService } from './app-state.service';
import { TargetAudienceAudienceTA } from './target-audience-audienceta';
import { AudienceTradeAreaConfig, AudienceTradeareaLocation } from '../models/audience-data.model';
import { AppMessagingService } from './app-messaging.service';
import { ImpDomainFactoryService, TradeAreaTypes } from '../val-modules/targeting/services/imp-domain-factory.service';

export enum SmartTile {
  EXTREMELY_HIGH = 'Extremely High',
  HIGH = 'High',
  ABOVE_AVERAGE = 'Above Average',
  AVERAGE = 'Average',
  BELOW_AVERAGE = 'Below Average',
  LOW = 'Low',
  EXTREMELY_LOW = 'Extrememly Low'
}

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
export class ValAudienceTradeareaService {
  private mockVars: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
  private audienceTaSubject: Subject<boolean> = new Subject<boolean>();
  private sortMap: Map<string, number> = new Map<string, number>();
  private taResponses: Map<string, Map<number, AudienceTradeareaResponse>> = new Map<string, Map<number, AudienceTradeareaResponse>>();
  private mustCover: boolean;
  // variables to determine whether or not we need to fetch data from the server
  private fetchData = true;
  private lastMinRadius: number;
  private lastMaxRadius: number;
  private lastDigCategoryId: number;
  private lastWeight: number;
  private geoCache: ImpGeofootprintGeo[] = new Array<ImpGeofootprintGeo>();

  /**
   * Create an audience trade are for each location that has been created
   * @param minRadius The minimum, must cover radius, for the trade areas
   * @param maxRadius The maximum radius for the trade areas
   * @param tiles The currently active smart tile values selected by the user
   * @param digCategoryId The digital category ID seledcted by the user
   * @param weight The weight of the selected variable vs the distance
   * @param scoreType The score type, DMA or National
   */
  public createAudienceTradearea(minRadius: number, maxRadius: number, tiles: Array<SmartTile>, digCategoryId: number, weight: number, scoreType: string, mustCover: boolean) : Observable<boolean> {
    const taConfig: AudienceTradeAreaConfig = this.buildTAConfig(minRadius, maxRadius, digCategoryId, weight, scoreType, mustCover);
    this.attachVariables();
    this.determineRerun(minRadius, maxRadius, digCategoryId, weight);

    //for now we are going to force always fetching data,
    //there is a bug where if you add a location since the
    //last time you ran an audience TA the rerun detection doesn't work
    this.fetchData = true;

    if (this.fetchData) {
    this.sendRequest(taConfig).subscribe(response => {
        try {
          this.parseResponse(response);
          if (this.taResponses.size < 1) {
            console.warn('No data found when running audience trade area:', taConfig);
            this.messagingService.showGrowlWarning('Audience Trade Area Warning', 'No data was found for your input parameters');
            this.audienceTaSubject.next(true);
            return;
          }
          this.fetchData = false;
          this.geoService.clearAll();
          this.varService.clearAll();
          for (const location of this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.filter(l => l.clientLocationTypeCode === 'Site')) {
            this.createTradeArea(this.createGeos(minRadius, tiles, location, mustCover, digCategoryId), location);
          }
          this.geoService.add(this.geoCache);
          this.targetAudienceTAService.addAudiences(this.taResponses, digCategoryId, taConfig);
          this.drawRadiusRings(minRadius, maxRadius);
          this.lastMinRadius = minRadius;
          this.lastMaxRadius = maxRadius;
          this.lastDigCategoryId = digCategoryId;
          this.lastWeight = weight;
          this.geoCache = new Array<ImpGeofootprintGeo>();
          this.audienceTaSubject.next(true);
        } catch (error) {
          console.error(error);
          this.audienceTaSubject.next(false);
        }
      },
      err => {
        console.error(err);
        this.audienceTaSubject.next(false);
        this.fetchData = true;
      });
    } else {
      this.rerunTradearea(minRadius, maxRadius, tiles, digCategoryId, weight, scoreType, mustCover).subscribe(res => {
        if (res) {
          this.audienceTaSubject.next(true);
        } else {
          this.audienceTaSubject.next(false);
        }
      },
      err => {
        console.error(err);
        this.audienceTaSubject.next(false);
        this.fetchData = true;
      });
    }
    return this.audienceTaSubject.asObservable();
  }

  /**
   * Determine if we need to fetch data from the Fuse service
   * or if we can rerun the trade area with cached data
   * @param minRadius The minimum, must cover radius, for the trade areas
   * @param maxRadius The maximum radius for the trade areas
   * @param digCategoryId The ID of the targeting variable currently in use
   * @param weight The weight of the selected variable vs the distance
   */
  private determineRerun(minRadius: number, maxRadius: number, digCategoryId: number, weight: number) {
    if (minRadius !== this.lastMinRadius)
      this.fetchData = true;
    if (maxRadius !==  this.lastMaxRadius)
      this.fetchData = true;
    if (digCategoryId !== this.lastDigCategoryId)
      this.fetchData = true;
    if (weight !== this.lastWeight)
      this.fetchData = true;
  }

  /**
   * Recreate trade areas without requesting data again from the Fuse service
   * We can do this as long as no locations have changed since the last run
   * @param minRadius The minimum, must cover radius, for the trade areas
   * @param maxRadius The maximum radius for the trade areas
   * @param tiles The currently active smart tile values selected by the user
   * @param digCategoryId The digital category ID seledcted by the user
   * @param weight The weight of the selected variable vs the distance
   * @param scoreType The score type, DMA or National
   */
  private rerunTradearea(minRadius: number, maxRadius: number, tiles: Array<SmartTile>, digCategoryId: number, weight: number, scoreType: string, mustCover: boolean) : Observable<boolean> {
    return Observable.create(obs => {
      try {
        for (const location of this.locationService.get()) {
          this.createTradeArea(this.createGeos(minRadius, tiles, location, mustCover, digCategoryId), location);
          this.drawRadiusRings(minRadius, maxRadius);
        }
        obs.next(true);
      } catch (error) {
        obs.error(error);
      }
    });
  }

  /**
   * Send the request to the Fuse service to get the geo scores around each location
   * @param taConfig The AudienceTradeareaConfig to send to Fuse
   */
  private sendRequest(taConfig: AudienceTradeAreaConfig) : Observable<RestResponse> {
    const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
    const url: string = this.appConfig.valServiceBase + 'v1/targeting/base/audiencetradearea';
    //const url: string = 'https://servicesdev.valassislab.com/services/v1/targeting/base/audiencetradearea';
    return this.httpClient.post<RestResponse>(url, JSON.stringify(taConfig), {headers: headers});
  }

  /**
   * Parse the response from Fuse and build the array of audienceTradeareaResponses
   * This method will also create the renderer data that is required for map shading
   * @param restResponse The response from Fuse returned from the trade area service
   */
  private parseResponse(restResponse: RestResponse) {
    this.taResponses = new Map<string, Map<number, AudienceTradeareaResponse>>();
    let rendererData: Array<any> = new Array<any>();
    let count: number = 0;
    for (const taResponse of restResponse.payload.rows) {
      if (this.taResponses.has(taResponse.locationName)) {
        this.taResponses.get(taResponse.locationName).set(count, taResponse);
        count++;
      } else {
        count = 0; // reset the counter for each new location
        const addResponse: Map<number, AudienceTradeareaResponse> = new Map<number, AudienceTradeareaResponse>();
        addResponse.set(count, taResponse);
        this.taResponses.set(taResponse.locationName, addResponse);
        count++;
      }
      const geoVar: ImpGeofootprintVar = new ImpGeofootprintVar();
      geoVar.valueString = taResponse.combinedIndexTileName;
      rendererData.push({geocode: taResponse.geocode, data: geoVar});
    }
    rendererData = rendererData.sort((a, b) => this.compare(a, b));

    // We are not enabling thematic shading by default anymore
    //this.rendererService.updateData(rendererData);
  }

  /**
   * Build an AudienceTradeareaConfig that will be used to send input parameters to the Fuse service
   * @param minRadius The minimum, must cover radius, for the trade area
   * @param maxRadius The maximum radius for the trade area
   * @param digCategoryId The ID of the online audience variable that has been selected by the user
   * @param weight The weight of the variable vs distance that has been set by the user
   * @param scoreType Score type, DMA or national
   */
  private buildTAConfig(minRadius: number, maxRadius: number, digCategoryId: number, weight: number, scoreType: string, mustCover: boolean) : AudienceTradeAreaConfig {
    const audienceTALocations: Array<AudienceTradeareaLocation> = new Array<AudienceTradeareaLocation>();
    const taConfig: AudienceTradeAreaConfig = {
      analysisLevel: this.stateService.analysisLevel$.getValue().toLocaleLowerCase(),
      digCategoryId: digCategoryId,
      locations: audienceTALocations,
      maxRadius: Number(maxRadius),
      minRadius: Number(minRadius),
      scoreType: scoreType,
      weight: weight / 100,
    };
    for (const location of this.locationService.get()) {
      const taLocation: AudienceTradeareaLocation = {
        LOCATIONNAME: location.locationNumber,
        XCOORD: location.xcoord,
        YCOORD: location.ycoord,
        HOMEGEOCODE: location.homeGeocode
      };
      audienceTALocations.push(taLocation);
    }
    return taConfig;
  }

  /**
   * Create a Map that will hold the sort order for the SmartTile values
   * this sort order will be used for the legen on the map, to preverse order
   */
  private initializeSortMap() {
    this.sortMap.set(SmartTile.EXTREMELY_HIGH, 1);
    this.sortMap.set(SmartTile.HIGH, 2);
    this.sortMap.set(SmartTile.ABOVE_AVERAGE, 3);
    this.sortMap.set(SmartTile.AVERAGE, 4);
    this.sortMap.set(SmartTile.BELOW_AVERAGE, 5);
    this.sortMap.set(SmartTile.LOW, 6);
    this.sortMap.set(SmartTile.EXTREMELY_LOW, 7);
  }

  /**
   * Compare smart tile values together to determine sort oder
   */
  private compare(a, b) {
    if (this.sortMap.get(a.data.valueString) > this.sortMap.get(b.data.valueString)) {
      return -1;
    }
    if (this.sortMap.get(a.data.valueString) < this.sortMap.get(b.data.valueString)) {
      return 1;
    }
    return 0;
  }

  /**
   * Draw the radius rings on the map
   * @param minRadius The minumum, or must cover, radius for the trade area
   * @param maxRadius The maximum radius for the trade area
   * @param location The location associated with the trade are
   */
  private drawRadiusRings(minRadius: number, maxRadius: number) {
    const ringMap: Map<Coordinates, number[]> = new Map<Coordinates, number[]>();
    for (const location of this.locationService.get().filter(l => l.clientLocationTypeCode === 'Site')) {
      const coordinates: Coordinates = { xcoord: location.xcoord, ycoord: location.ycoord };
      const radii: Array<number> = new Array<number>();
      radii.push(minRadius);
      radii.push(maxRadius);
      ringMap.set(coordinates, radii);
    }
    this.mapService.drawRadiusBuffers(ringMap, true, 'Site');
  }

  /**
   * Create the rederer we will need by invoking the AppRendererService
   */
  private createRenderer() {
    const rendererData: Array<any> = new Array<any>();
    for (const geofootprintVar of this.mockVars) {
      rendererData.push({geocode: geofootprintVar.geocode, data: geofootprintVar.valueString});
    }
    this.rendererService.updateData(rendererData.sort((a, b) => this.compare(a, b)));
  }

  /**
   * Create the audience trade area
   * @param geos An array of geos that will be attached to the trade area being created
   * @param location the location that the trade area is associated with
   */
  private createTradeArea(geos: ImpGeofootprintGeo[], location: ImpGeofootprintLocation) {
    const tradeArea = this.domainFactory.createTradeArea(location, -1, TradeAreaTypes.Audience, true);
    tradeArea.impGeofootprintGeos = geos;
    geos.forEach(geo => geo.impGeofootprintTradeArea = tradeArea);
  }

  /**
   * Create and select geos that belong to an individual location
   * @param minRadius The minimum, or must cover, radius
   * @param activeSmartTiles An array of SmartTile values that will be used to select geos
   * @returns An array of ImpGeofootprintGeo
   */
  private createGeos(minRadius: number, activeSmartTiles: SmartTile[], location: ImpGeofootprintLocation, mustCover: boolean, digCategoryId: number) : ImpGeofootprintGeo[] {
    const newGeos: ImpGeofootprintGeo[] = new Array<ImpGeofootprintGeo>();
    const taResponseMap = this.taResponses.get(location.locationNumber);
    const geoVarMap: Map<ImpGeofootprintGeo, ImpGeofootprintVar[]> = new Map<ImpGeofootprintGeo, ImpGeofootprintVar[]>();
    const audiences = this.targetAudienceService.getAudiences();
    const audience = audiences.filter(a => a.audienceSourceType === 'Online' && Number(a.secondaryId.replace(',', '')) === digCategoryId)[0];
    if (!taResponseMap) {
      console.warn('Unable to find response for location: ', location);
      return;
    }
    for (let i = 0; i < taResponseMap.size; i++) {
      const newGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
      const newVars: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
      const taResponse = taResponseMap.get(i);
      if (!taResponse || !taResponse.geocode) {
        console.warn('Unable to find valid audience TA response for location: ', location);
        continue;
      }
      newGeo.geocode = taResponse.geocode;
      newGeo.impGeofootprintLocation = location;
      newGeo.isActive = false;
      newGeo.distance = taResponse.distance;
      if (taResponse.distance <= minRadius && this.sortMap.get(taResponse.combinedIndexTileName) <= 4) {
        newGeo.isActive = true;
      }
      if (mustCover && taResponse.distance <= minRadius) {
        newGeo.isActive = true;
      }
      if (taResponse.distance > minRadius && this.sortMap.get(taResponse.combinedIndexTileName) <= 4) {
        newGeo.isActive = true;
      }
      if (!newGeo.isActive) {
        const filterReasons: string[] = [];
        filterReasons.push('Under Audience TA threshold');
        newGeo['filterReasons'] = filterReasons;
      }
      newGeo.ggId = this.geoService.getNextStoreId();
      newGeos.push(newGeo);
    }
    this.geoCache.push(...newGeos);
    return newGeos;
  }

  private searchVarId(fieldDisplay: string) : number {
    for (const geoVar of this.varService.get()) {
      if (geoVar.customVarExprDisplay === fieldDisplay) {
        return geoVar.varPk;
      }
    }
    return null;
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
   * Attach the mock variables to the 48152 location
   */
  private attachVariables() {
    for (const geofootprintVar of this.mockVars) {
      geofootprintVar.impGeofootprintLocation = this.locationService.get().filter(l => l.homeGeocode === '48152')[0];
    }
  }

  /**
   * The Constructor will build out mock data until there is a REST service available that can deliver this data back to the application
   * @param varService
   * @param locationService
   * @param tradeareaService
   * @param geoService
   * @param rendererService
   * @param geoAttribService
   */
  constructor(private varService: ImpGeofootprintVarService,
    private stateService: AppStateService,
    private locationService: ImpGeofootprintLocationService,
    private tradeareaService: ImpGeofootprintTradeAreaService,
    private geoService: ImpGeofootprintGeoService,
    private rendererService: AppRendererService,
    private geoAttribService: ImpGeofootprintGeoAttribService,
    private mapService: AppMapService,
    private httpClient: HttpClient,
    private appConfig: AppConfig,
    private targetAudienceService: TargetAudienceService,
    private targetAudienceTAService: TargetAudienceAudienceTA,
    private messagingService: AppMessagingService,
    private domainFactory: ImpDomainFactoryService) {
    this.initializeSortMap();
    this.locationService.storeObservable.subscribe(location => {
      // if location data changes, we will need to Fetch data from fuse the next time we create trade areas
      this.fetchData = true;
    });
  }
}
