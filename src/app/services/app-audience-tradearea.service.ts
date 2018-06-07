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
import { ValMapService, Coordinates } from './app-map.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AppConfig } from '../app.config';
import { RestResponse } from '../models/RestResponse';

export enum SmartTile {
  EXTREMELY_HIGH = 'Extremely High',
  HIGH = 'High',
  ABOVE_AVERAGE = 'Above Average',
  AVERAGE = 'Average',
  BELOW_AVERAGE = 'Below Average',
  LOW = 'Low',
  EXTREMELY_LOW = 'Extrememly Low'
}

interface AudienceTradeAreaConfig {
  digCategoryId: number;
  analysisLevel: string;
  scoreType: string;
  minRadius: number;
  maxRadius: number;
  weight: number;
  locations: Array<AudienceTradeareaLocation>;
}

interface AudienceTradeareaLocation {
  LOCATIONNAME: string;
  XCOORD: number;
  YCOORD: number;
  HOMEGEOCODE: string;
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
}

@Injectable({
  providedIn: 'root'
})
export class ValAudienceTradeareaService {
  private mockVars: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
  private audienceTaSubject: Subject<boolean> = new Subject<boolean>();
  private sortMap: Map<string, number> = new Map<string, number>();
  private taResponses: Map<string, Map<number, AudienceTradeareaResponse>> = new Map<string, Map<number, AudienceTradeareaResponse>>();
  
  // variables to determine whether or not we need to fetch data from the server
  private fetchData = true;
  private lastMinRadius: number;
  private lastMaxRadius: number;
  private lastDigCategoryId: number;
  private lastWeight: number;

  /**
   * Create an audience trade are for each location that has been created
   * @param minRadius The minimum, must cover radius, for the trade areas
   * @param maxRadius The maximum radius for the trade areas
   * @param tiles The currently active smart tile values selected by the user
   * @param digCategoryId The digital category ID seledcted by the user
   * @param weight The weight of the selected variable vs the distance
   * @param scoreType The score type, DMA or National
   */
  public createAudienceTradearea(minRadius: number, maxRadius: number, tiles: Array<SmartTile>, digCategoryId: number, weight: number, scoreType: string) : Observable<boolean> {
    const taConfig: AudienceTradeAreaConfig = this.buildTAConfig(minRadius, maxRadius, digCategoryId, weight, scoreType);
    this.attachVariables();
    this.determineRerun(minRadius, maxRadius, digCategoryId, weight);
    if (this.fetchData) {
    this.sendRequest(taConfig).subscribe(response => {
        try {
          this.parseResponse(response);
          this.fetchData = false;
          for (const location of this.locationService.get().filter(l => l.clientLocationTypeCode === 'Site')) {
            this.createTradeArea(this.createGeos(minRadius, tiles, location), location);
          }
          this.drawRadiusRings(minRadius, maxRadius);
          this.audienceTaSubject.next(true);
          this.lastMinRadius = minRadius;
          this.lastMaxRadius = maxRadius;
          this.lastDigCategoryId = digCategoryId;
          this.lastWeight = weight;
        } catch (error) {
          console.error(error);
          this.audienceTaSubject.error(error);
        }
      },
      err => {
        console.error(err);
        this.audienceTaSubject.error(err);
        this.fetchData = true;
      });
    } else {
      this.rerunTradearea(minRadius, maxRadius, tiles, digCategoryId, weight, scoreType).subscribe(res => {
        if (res) {
          this.audienceTaSubject.next(true);
        } else {
          this.audienceTaSubject.next(false);
        }
      },
      err => {
        console.error(err);
        this.audienceTaSubject.error(err);
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
  private rerunTradearea(minRadius: number, maxRadius: number, tiles: Array<SmartTile>, digCategoryId: number, weight: number, scoreType: string) : Observable<boolean> {
    return Observable.create(obs => {
      try {
        for (const location of this.locationService.get()) {
          this.createTradeArea(this.createGeos(minRadius, tiles, location), location);
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
    const rendererData: Array<any> = new Array<any>();
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
      }
      const geoVar: ImpGeofootprintVar = new ImpGeofootprintVar();
      geoVar.valueString = taResponse.indexTileName;
      rendererData.push({geocode: taResponse.geocode, data: geoVar});
    }
    this.rendererService.updateData(rendererData.sort((a, b) => this.compare(a, b)));
  }

  /**
   * Build an AudienceTradeareaConfig that will be used to send input parameters to the Fuse service
   * @param minRadius The minimum, must cover radius, for the trade area
   * @param maxRadius The maximum radius for the trade area
   * @param digCategoryId The ID of the online audience variable that has been selected by the user
   * @param weight The weight of the variable vs distance that has been set by the user
   * @param scoreType Score type, DMA or national
   */
  private buildTAConfig(minRadius: number, maxRadius: number, digCategoryId: number, weight: number, scoreType: string) : AudienceTradeAreaConfig {
    const audienceTALocations: Array<AudienceTradeareaLocation> = new Array<AudienceTradeareaLocation>();
    const taConfig: AudienceTradeAreaConfig = {
      analysisLevel: this.discoService.get()[0].analysisLevel.toLocaleLowerCase(),
      digCategoryId: digCategoryId,
      locations: audienceTALocations,
      maxRadius: Number(maxRadius),
      minRadius: Number(minRadius),
      scoreType: scoreType,
      weight: weight / 100
    };
    for (const location of this.locationService.get()) {
      const taLocation: AudienceTradeareaLocation = {
        LOCATIONNAME: location.locationName,
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
    if (this.sortMap.get(a.data.valueString) < this.sortMap.get(b.data.valueString)) {
      return -1;
    }
    if (this.sortMap.get(a.data.valueString) > this.sortMap.get(b.data.valueString)) {
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
  private createTradeArea(geoVarMap: Map<ImpGeofootprintGeo, ImpGeofootprintVar[]>, location: ImpGeofootprintLocation) {
    const tradeArea: ImpGeofootprintTradeArea = new ImpGeofootprintTradeArea();
    const taGeos: Array<ImpGeofootprintGeo> = new Array<ImpGeofootprintGeo>();
    const taVars: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
    for (const geo of Array.from(geoVarMap.keys())) {
      taGeos.push(geo);
      taVars.push(...geoVarMap.get(geo));
    }
    tradeArea.impGeofootprintGeos = taGeos;
    //tradeArea.impGeofootprintVars = taVars;
    tradeArea.impGeofootprintLocation = location;
    tradeArea.taType = 'AUDIENCE';
    this.tradeareaService.add([tradeArea]);
    this.varService.add(taVars);
  }

  /**
   * Create and select geos that belong to an individual location
   * @param minRadius The minimum, or must cover, radius
   * @param activeSmartTiles An array of SmartTile values that will be used to select geos
   * @returns An array of ImpGeofootprintGeo
   */
  private createGeos(minRadius: number, activeSmartTiles: SmartTile[], location: ImpGeofootprintLocation) : Map<ImpGeofootprintGeo, ImpGeofootprintVar[]> {
    this.geoService.clearAll();
    this.geoAttribService.clearAll();
    const newGeos: ImpGeofootprintGeo[] = new Array<ImpGeofootprintGeo>();
    const newAttributes: ImpGeofootprintGeoAttrib[] = new Array<ImpGeofootprintGeoAttrib>();
    const taResponseMap = this.taResponses.get(location.locationName);
    const geoVarMap: Map<ImpGeofootprintGeo, ImpGeofootprintVar[]> = new Map<ImpGeofootprintGeo, ImpGeofootprintVar[]>();
    const varPk: number = this.varService.getNextStoreId();
    if (!taResponseMap) {
      console.warn('Unable to find response for location: ', location);
      return;
    }
    for (let i = 0; i < taResponseMap.size; i++) {
      const newGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
      const newVar: ImpGeofootprintVar = new ImpGeofootprintVar();
      const newVars: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
      const taResponse = taResponseMap.get(i);
      newGeo.geocode = taResponse.geocode;
      newGeo.impGeofootprintLocation = location;
      newGeo.isActive = false;
      newGeo.distance = taResponse.distance;
      if (taResponse.distance <= minRadius && this.sortMap.get(taResponse.indexTileName) <= 4) {
        newGeo.isActive = true;
      }
      for (const tile of activeSmartTiles) {
        if (taResponse.indexTileName === tile) {
          newGeo.isActive = true;
        }
      }
      newGeo.ggId = this.geoService.getNextStoreId();
      newVar.varPk = varPk;
      newVar.gvId = this.varService.getNextStoreId();
      newVar.geocode = newGeo.geocode;
      newVar.customVarExprDisplay = 'Smart Tile Value';
      newVar.valueString = taResponse.indexTileName;
      newVar.isString = 1;
      newVar.isActive = 1;
      newVars.push(newVar);
      geoVarMap.set(newGeo, newVars);
      newGeos.push(newGeo);
    }
    this.geoService.add(newGeos);
    this.geoAttribService.add(newAttributes);
    return geoVarMap;
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
    private locationService: ImpGeofootprintLocationService,
    private tradeareaService: ImpGeofootprintTradeAreaService,
    private geoService: ImpGeofootprintGeoService,
    private rendererService: AppRendererService,
    private geoAttribService: ImpGeofootprintGeoAttribService,
    private mapService: ValMapService,
    private discoService: ImpDiscoveryService,
    private httpClient: HttpClient,
    private appConfig: AppConfig) {
    this.initializeSortMap();
    this.locationService.storeObservable.subscribe(location => {
      // if location data changes, we will need to Fetch data from fuse the next time we create trade areas
      this.fetchData = true;
    });
    const json: string = `[
      {
        "gvId": 100000,
        "geocode": "48025",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100001,
        "geocode": "48033",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100002,
        "geocode": "48034",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100003,
        "geocode": "48037",
        "isString": true,
        "valueString": "High"
      },
      {
        "gvId": 100004,
        "geocode": "48075",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100005,
        "geocode": "48076",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100006,
        "geocode": "48127",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100007,
        "geocode": "48128",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100008,
        "geocode": "48135",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100009,
        "geocode": "48136",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100010,
        "geocode": "48141",
        "isString": true,
        "valueString": "Average"
      },
      {
        "gvId": 100011,
        "geocode": "48150",
        "isString": true,
        "valueString": "Extrememly Low"
      },
      {
        "gvId": 100012,
        "geocode": "48151",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100013,
        "geocode": "48167",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100014,
        "geocode": "48168",
        "isString": true,
        "valueString": "High"
      },
      {
        "gvId": 100015,
        "geocode": "48170",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100016,
        "geocode": "48185",
        "isString": true,
        "valueString": "Extrememly Low"
      },
      {
        "gvId": 100017,
        "geocode": "48186",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100018,
        "geocode": "48187",
        "isString": true,
        "valueString": "High"
      },
      {
        "gvId": 100019,
        "geocode": "48219",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100020,
        "geocode": "48223",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100021,
        "geocode": "48227",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100022,
        "geocode": "48228",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100023,
        "geocode": "48235",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100024,
        "geocode": "48239",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100025,
        "geocode": "48240",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100026,
        "geocode": "48301",
        "isString": true,
        "valueString": "Extrememly Low"
      },
      {
        "gvId": 100027,
        "geocode": "48322",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100028,
        "geocode": "48323",
        "isString": true,
        "valueString": "Average"
      },
      {
        "gvId": 100029,
        "geocode": "48325",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100030,
        "geocode": "48331",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100031,
        "geocode": "48333",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100032,
        "geocode": "48334",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100033,
        "geocode": "48374",
        "isString": true,
        "valueString": "Low"
      },
      {
        "gvId": 100034,
        "geocode": "48375",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100035,
        "geocode": "48376",
        "isString": true,
        "valueString": "Above Average"
      },
      {
        "gvId": 100036,
        "geocode": "48377",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100037,
        "geocode": "48152",
        "isString": true,
        "valueString": "Average"
      },
      {
        "gvId": 100038,
        "geocode": "48153",
        "isString": true,
        "valueString": "Below Average"
      },
      {
        "gvId": 100039,
        "geocode": "48154",
        "isString": true,
        "valueString": "Extrememly Low"
      },
      {
        "gvId": 100040,
        "geocode": "48332",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100041,
        "geocode": "48335",
        "isString": true,
        "valueString": "Extremely High"
      },
      {
        "gvId": 100042,
        "geocode": "48336",
        "isString": true,
        "valueString": "Extremely High"
      }
    ]`;
    const vars: any = JSON.parse(json);
    for (const item of vars) {
      this.mockVars.push(item);
    }
  }
}
