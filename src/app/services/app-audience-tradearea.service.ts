import { Injectable } from '@angular/core';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppRendererService, OutlineSetup, SmartRendererSetup } from './app-renderer.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { AppMapService, Coordinates } from './app-map.service';
import { AppDiscoveryService } from './app-discovery.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AppConfig } from '../app.config';
import { RestResponse } from '../models/RestResponse';
import { TargetAudienceService } from './target-audience.service';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { AppStateService } from './app-state.service';
import { TargetAudienceAudienceTA } from './target-audience-audienceta';
import { AudienceTradeAreaConfig, AudienceTradeareaLocation } from '../models/audience-data.model';
import { AppMessagingService } from './app-messaging.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';

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
  public audienceTAConfig$: Subject<AudienceTradeAreaConfig> = new Subject<AudienceTradeAreaConfig>();
  private audienceTAConfig: AudienceTradeAreaConfig;
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
  private failedLocations: ImpGeofootprintLocation[] = [];

  /**
   * Update the audience trade area configuration
   * also push the updated config into the project for persistence
   * @param config The updated configuration
   */
  public updateAudienceTAConfig(config: AudienceTradeAreaConfig) {
    const project = this.stateService.currentProject$.getValue();
    this.audienceTAConfig = { ...this.audienceTAConfig, ...config };
    project.audTaIndexBase = this.audienceTAConfig.scoreType;
    project.audTaIsMustCover = this.audienceTAConfig.includeMustCover ? 1 : 0;
    project.audTaMaxRadiu = this.audienceTAConfig.maxRadius;
    project.audTaMinRadiu = this.audienceTAConfig.minRadius;
    project.audTaVarPk = this.audienceTAConfig.digCategoryId;
    project.audTaVarWeight = this.audienceTAConfig.weight;
    project.audTaVarSource
    this.audienceTAConfig$.next(this.audienceTAConfig);
  }


  /**
   * Attach the locations to the AudienceTAConfig
   * We don't want to do this every time we update the config,
   * only when we actually run it, since it loops over all locations
   */
  private attachLocations() {
    this.audienceTAConfig.locations = [];
    for (const location of this.locationService.get()) {
      const taLocation: AudienceTradeareaLocation = {
        LOCATIONNAME: location.locationNumber,
        XCOORD: location.xcoord,
        YCOORD: location.ycoord,
        HOMEGEOCODE: location.homeGeocode
      };
      this.audienceTAConfig.locations.push(taLocation);
    }
  }

  /**
   * Validate that the AudienceTAConfig is in a good and runnable state
   * this must be done before we invoke the backend service
   */
  private validateTradeArea() : true | string[] {
    const errors: string[] = [];
    if (!this.audienceTAConfig.minRadius || !this.audienceTAConfig.maxRadius) {
      errors.push('You must include both a minumum trade area and a maximum trade area');
    }
    if (isNaN(this.audienceTAConfig.maxRadius) || isNaN(this.audienceTAConfig.minRadius)) {
      errors.push('Invalid input, please enter a valid minimum trade area and a valid maximum trade area');
    }
    if (Number(this.audienceTAConfig.maxRadius) <= Number(this.audienceTAConfig.minRadius)) {
      errors.push('The maximum radius must be larger than the minimum radius');
    }
    if (!this.audienceTAConfig.digCategoryId) {
      errors.push('You must select a variable before creating a trade area');
    }
    if (this.stateService.analysisLevel$.getValue() == null || this.stateService.analysisLevel$.getValue().length === 0) {
      errors.push('You must select an Analysis Level before applying a trade area to Sites');
    }
    if (errors.length > 0) {
      return errors;
    }
    return true;
  }

  /**
   * Getter for the AudienceTAConfig
   */
  public getAudienceTAConfig() {
    return this.audienceTAConfig;
  }

  /**
   * Create an audience trade are for each location that has been created
   * @param minRadius The minimum, must cover radius, for the trade areas
   * @param maxRadius The maximum radius for the trade areas
   * @param tiles The currently active smart tile values selected by the user
   * @param digCategoryId The digital category ID seledcted by the user
   * @param weight The weight of the selected variable vs the distance
   * @param scoreType The score type, DMA or National
   */
  public createAudienceTradearea(audienceTAConfig: AudienceTradeAreaConfig) : Observable<boolean> {
    this.messagingService.startSpinnerDialog('AUDIENCETA', 'Creating Audience Trade Area');
    try {
      const validate: boolean | string[] = this.validateTradeArea();
      if (validate !== true) {
        let growlMessage = '';
        for (const message of validate) {
          growlMessage += message + '<br>';
        }
        this.messagingService.showGrowlError('Audience Trade Area Error', growlMessage);
        this.messagingService.stopSpinnerDialog('AUDIENCETA');
        return;
      }
    } catch (error) {
      return Observable.create(o => o.next(false));
    }

    this.attachLocations();
    if (this.audienceTAConfig.analysisLevel.toLocaleLowerCase() === 'digital atz')
      this.audienceTAConfig.analysisLevel = 'dtz';

    //for now we are going to force always fetching data,
    //there is a bug where if you add a location since the
    //last time you ran an audience TA the rerun detection doesn't work
    //this.determineRerun(minRadius, maxRadius, digCategoryId, weight);
    this.fetchData = true;

    if (this.fetchData) {
      this.sendRequest(this.audienceTAConfig).subscribe(response => {
        try {
          this.parseResponse(response);
          if (this.taResponses.size < 1) {
            console.warn('No data found when running audience trade area:', audienceTAConfig);
            this.messagingService.showGrowlWarning('Audience Trade Area Warning', 'No data was found for your input parameters');
            this.audienceTaSubject.next(true);
            return;
          }
          this.fetchData = false;
          this.geoService.clearAll();
          this.varService.clearAll();
          const newTradeAreas: ImpGeofootprintTradeArea[] = [];
          for (const location of this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.filter(l => l.clientLocationTypeCode === 'Site')) {
            const newTradeArea = this.createTradeArea(this.createGeos(audienceTAConfig, location), location);
            if (newTradeArea != null) newTradeAreas.push(newTradeArea);
          }
          if (this.failedLocations.length > 0) {
            let warningMessge = 'Unable to find data for the following locations:<br>';
            for (const failedLoc of this.failedLocations) {
              warningMessge += failedLoc.locationName + '<br>';
            }
            this.messagingService.showGrowlWarning('Audience Trade Area Warning', warningMessge);
            this.failedLocations = [];
          }
          this.tradeareaService.add(newTradeAreas);
          this.geoService.add(this.geoCache);
          this.targetAudienceTAService.addAudiences(this.taResponses, audienceTAConfig.digCategoryId, this.audienceTAConfig);
          this.drawRadiusRings(audienceTAConfig.minRadius, audienceTAConfig.maxRadius);
          this.geoCache = new Array<ImpGeofootprintGeo>();
          this.audienceTaSubject.next(true);
          this.messagingService.stopSpinnerDialog('AUDIENCETA');
        } catch (error) {
          console.error(error);
          this.audienceTaSubject.next(false);
          this.messagingService.stopSpinnerDialog('AUDIENCETA');
        }
      },
        err => {
          console.error(err);
          this.audienceTaSubject.next(false);
          this.fetchData = true;
          this.messagingService.stopSpinnerDialog('AUDIENCETA');
        });
    } else {
      this.rerunTradearea(audienceTAConfig).subscribe(res => {
        if (res) {
          this.audienceTaSubject.next(true);
        } else {
          this.audienceTaSubject.next(false);
          this.messagingService.stopSpinnerDialog('AUDIENCETA');
        }
      },
        err => {
          console.error(err);
          this.audienceTaSubject.next(false);
          this.fetchData = true;
          this.messagingService.stopSpinnerDialog('AUDIENCETA');
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
    if (maxRadius !== this.lastMaxRadius)
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
  private rerunTradearea(audienceTAConfig: AudienceTradeAreaConfig) : Observable<boolean> {
    return Observable.create(obs => {
      try {
        for (const location of this.locationService.get()) {
          this.createTradeArea(this.createGeos(audienceTAConfig, location), location);
          this.drawRadiusRings(audienceTAConfig.minRadius, audienceTAConfig.maxRadius);
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
    delete taConfig.includeMustCover; //this field is not supposed to be part of the payload
    const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
    const url: string = this.appConfig.valServiceBase + 'v1/targeting/base/audiencetradearea';
    return this.httpClient.post<RestResponse>(url, JSON.stringify(taConfig), { headers: headers });
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
      rendererData.push({ geocode: taResponse.geocode, data: geoVar });
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
      includeMustCover: mustCover
    };
    for (const location of this.locationService.get()) {
      const taLocation: AudienceTradeareaLocation = {
        LOCATIONNAME: location.locationNumber,
        XCOORD: location.xcoord,
        YCOORD: location.ycoord,
        HOMEGEOCODE: location.homeGeocode
      };
      if (taConfig.analysisLevel.toLocaleLowerCase() === 'digital atz')
        taConfig.analysisLevel = 'dtz';
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
      rendererData.push({ geocode: geofootprintVar.geocode, data: geofootprintVar.valueString });
    }
    this.rendererService.updateData(rendererData.sort((a, b) => this.compare(a, b)));
  }

  /**
   * Create the audience trade area
   * @param geos An array of geos that will be attached to the trade area being created
   * @param location the location that the trade area is associated with
   */
  private createTradeArea(geos: ImpGeofootprintGeo[], location: ImpGeofootprintLocation) : ImpGeofootprintTradeArea {
    if (!geos || geos.length < 1 || !location) {
      console.warn('No geos found when attempting to create AudienceTA');
      return null;
    }
    const tradeArea = this.domainFactory.createTradeArea(location, TradeAreaTypeCodes.Audience);
    tradeArea.impGeofootprintGeos = geos;
    geos.forEach(geo => geo.impGeofootprintTradeArea = tradeArea);
    return tradeArea;
  }

  /**
   * Create and select geos that belong to an individual location
   * @param minRadius The minimum, or must cover, radius
   * @param activeSmartTiles An array of SmartTile values that will be used to select geos
   * @returns An array of ImpGeofootprintGeo
   */
  private createGeos(audienceTAConfig, location: ImpGeofootprintLocation) : ImpGeofootprintGeo[] {
    const newGeos: ImpGeofootprintGeo[] = new Array<ImpGeofootprintGeo>();
    const taResponseMap = this.taResponses.get(location.locationNumber);
    const geoVarMap: Map<ImpGeofootprintGeo, ImpGeofootprintVar[]> = new Map<ImpGeofootprintGeo, ImpGeofootprintVar[]>();
    const audiences = this.targetAudienceService.getAudiences();
    const audience = audiences.filter(a => a.audienceSourceType === 'Online' && Number(a.secondaryId.replace(',', '')) === audienceTAConfig.digCategoryId)[0];
    if (!taResponseMap) {
      console.warn('Unable to find response for location: ', location);
      this.failedLocations.push(location);
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
      if (taResponse.distance <= audienceTAConfig.minRadius && this.sortMap.get(taResponse.combinedIndexTileName) <= 4) {
        newGeo.isActive = true;
      }
      if (audienceTAConfig.includeMustCover && taResponse.distance <= audienceTAConfig.minRadius) {
        newGeo.isActive = true;
      }
      if (taResponse.distance > audienceTAConfig.minRadius && this.sortMap.get(taResponse.combinedIndexTileName) <= 4) {
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
