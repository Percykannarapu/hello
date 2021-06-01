import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { AudienceTradeAreaConfig } from '../models/audience-data.model';

// export enum SmartTile {
//   EXTREMELY_HIGH = 'Extremely High',
//   HIGH = 'High',
//   ABOVE_AVERAGE = 'Above Average',
//   AVERAGE = 'Average',
//   BELOW_AVERAGE = 'Below Average',
//   LOW = 'Low',
//   EXTREMELY_LOW = 'Extremely Low'
// }

// interface AudienceTradeareaResponse {
//   maxRadius: number;
//   indexRank: number;
//   geoLevel: string;
//   distance: number;
//   scoreType: string;
//   source: string;
//   taxonomy: string;
//   categoryName: string;
//   indexTileName: string;
//   tradeareaLocation: string;
//   locationName: string;
//   geocodeHHC: number;
//   distanceRank: number;
//   zScore: number;
//   minRadius: number;
//   distanceTile: number;
//   weightedIndexValue: number;
//   std: number;
//   var: number;
//   indexTileSeq: number;
//   totalHHC: number;
//   weight: number;
//   combinedScore: number;
//   runningTotal: number;
//   median: number;
//   weightedDistance: number;
//   geocode: string;
//   distanceTileSeq: number;
//   combinedIndex: number;
//   indexValue: number;
//   indexTile: number;
//   combinedIndexTileName: string;
//   combinedIndexTile: number;
// }

// const analysisLevelToLengthMap = {
//   'zip': 5,
//   'atz': 7,
//   'pcr': 9,
//   'digital atz': 7
// };

// const analysisLevelToHomeGeocodeMap = {
//   'zip': 'Home Zip Code',
//   'atz': 'Home ATZ',
//   'pcr': 'Home Carrier Route',
//   'digital atz': 'Home Digital ATZ'
// };

@Injectable({
  providedIn: 'root'
})
export class ValAudienceTradeareaService {
  // public audienceTAConfig$: Subject<AudienceTradeAreaConfig> = new Subject<AudienceTradeAreaConfig>();
  // private audienceTAConfig: AudienceTradeAreaConfig;
  // private mockVars: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
  // private audienceTaSubject: Subject<boolean> = new Subject<boolean>();
  // private sortMap: Map<string, number> = new Map<string, number>();
  // private taResponses: Map<string, Map<number, AudienceTradeareaResponse>> = new Map<string, Map<number, AudienceTradeareaResponse>>();
  // private locationsWithNoScores: Map<ImpGeofootprintLocation, boolean> = new Map<ImpGeofootprintLocation, boolean>();
  // // variables to determine whether or not we need to fetch data from the server
  // private fetchData = true;
  // private lastMinRadius: number;
  // private lastMaxRadius: number;
  // private lastDigCategoryId: number;
  // private lastWeight: number;
  // private geoCache: ImpGeofootprintGeo[] = new Array<ImpGeofootprintGeo>();
  // private failedLocations: ImpGeofootprintLocation[] = [];

  /**
   * Update the audience trade area configuration
   * also push the updated config into the project for persistence
   * @param config The updated configuration
   */
  public updateAudienceTAConfig(config: AudienceTradeAreaConfig) {
    // const project = this.stateService.currentProject$.getValue();
    // this.audienceTAConfig = { ...this.audienceTAConfig, ...config };
    // project.audTaIndexBase = this.audienceTAConfig.scoreType;
    // project.audTaIsMustCover = this.audienceTAConfig.includeMustCover ? 1 : 0;
    // project.audTaMaxRadiu = toNullOrNumber(this.audienceTAConfig.maxRadius);
    // project.audTaMinRadiu = toNullOrNumber(this.audienceTAConfig.minRadius);
    // project.audTaVarPk = this.audienceTAConfig.digCategoryId;
    // project.audTaVarWeight = this.audienceTAConfig.weight;
    // project.audTaVarSource = this.audienceTAConfig.audienceName;
    // this.audienceTAConfig$.next(this.audienceTAConfig);
  }

  /**
   * When a project is loaded we need to create an
   * AudienceTAConfig if we have the data available
   */
  // private onLoad() {
  //   const project = this.stateService.currentProject$.getValue();
  //   if (project != null) {
  //     const audienceTAConfig: AudienceTradeAreaConfig = {
  //       analysisLevel: this.stateService.analysisLevel$.getValue(),
  //       digCategoryId: project.audTaVarPk,
  //       includeMustCover: project.audTaIsMustCover === 1,
  //       maxRadius: project.audTaMaxRadiu,
  //       minRadius: project.audTaMinRadiu,
  //       scoreType: project.audTaIndexBase,
  //       weight: project.audTaVarWeight,
  //       locations: null, // we don't populate this until we run the trade area
  //       audienceName: project.audTaVarSource
  //     };
  //     if (audienceTAConfig.scoreType == null || audienceTAConfig.scoreType.length > 0) audienceTAConfig.scoreType = 'DMA';
  //     this.updateAudienceTAConfig(audienceTAConfig);
  //   }
  // }

  /**
   * Attach the locations to the AudienceTAConfig
   * We don't want to do this every time we update the config,
   * only when we actually run it, since it loops over all locations
   */
  // private attachLocations() {
  //   this.audienceTAConfig.locations = [];
  //   for (const location of this.locationService.get()) {
  //     if (analysisLevelToLengthMap[this.audienceTAConfig.analysisLevel] === location.homeGeocode.length) {
  //       const taLocation: AudienceTradeareaLocation = {
  //         LOCATIONNAME: location.locationNumber,
  //         XCOORD: location.xcoord,
  //         YCOORD: location.ycoord,
  //         HOMEGEOCODE: location.homeGeocode == null ?  location.locZip.includes('-') ? location.locZip.substring(0, 5) : location.locZip : location.homeGeocode
  //         //HOMEGEOCODE:  location.homeGeocode == null ?  location.locZip.substring(0, 5) : location.homeGeocode
  //       };
  //       this.audienceTAConfig.locations.push(taLocation);
  //     } else {
  //       const taLocation: AudienceTradeareaLocation = {
  //         LOCATIONNAME: location.locationNumber,
  //         XCOORD: location.xcoord,
  //         YCOORD: location.ycoord,
  //         HOMEGEOCODE: location.impGeofootprintLocAttribs.filter(attrb => attrb.attributeCode == analysisLevelToHomeGeocodeMap[this.audienceTAConfig.analysisLevel])[0].attributeValue
  //       };
  //       this.audienceTAConfig.locations.push(taLocation);
  //     }
  //   }
  // }

  /**
   * Validate that the AudienceTAConfig is in a good and runnable state
   * this must be done before we invoke the backend service
   */
  // private validateTradeArea() : true | string[] {
  //   const errors: string[] = [];
  //
  //   if (this.locationService.get().length < 1) {
  //     errors.push('You must have at least 1 site before applying a trade area');
  //   }
  //   if (this.stateService.analysisLevel$.getValue() == null || this.stateService.analysisLevel$.getValue().length === 0) {
  //     errors.push('You must select an Analysis Level before applying a trade area to Sites');
  //   }
  //   if (!this.audienceTAConfig.digCategoryId) {
  //     errors.push('You must select a variable before creating a trade area');
  //   }
  //   if (!this.audienceTAConfig.minRadius || !this.audienceTAConfig.maxRadius) {
  //     errors.push('You must enter both a minimum must cover radius and maximum radius ');
  //   }
  //   if (this.audienceTAConfig.maxRadius > 100){
  //     errors.push('Maximum Radius must be <= 100');
  //   }
  //   if ((isNaN(this.audienceTAConfig.maxRadius) && this.audienceTAConfig.maxRadius != null) || (isNaN(this.audienceTAConfig.minRadius) && this.audienceTAConfig.minRadius != null)) {
  //     errors.push('Invalid input, please enter a valid minimum trade area and a valid maximum trade area. ');
  //   }
  //   if (Number(this.audienceTAConfig.maxRadius) <= Number(this.audienceTAConfig.minRadius)) {
  //     errors.push('The maximum radius must be larger than the minimum radius ');
  //   }
  //   if (this.audienceTAConfig.maxRadius > 100){
  //     errors.push('Maximum Radius must be <= 100');
  //   }
  //   if (this.audienceTAConfig.weight == null) {
  //     errors.push('You must enter a value for Weight % of the variable');
  //   }
  //   if (errors.length > 0) {
  //     return errors;
  //   }
  //   return true;
  // }

  /**
   * Getter for the AudienceTAConfig
   */
  public getAudienceTAConfig() {
    //return this.audienceTAConfig;
  }

  /**
   * Create an audience trade are for each location that has been created
   */
  public createAudienceTradearea(/*audienceTAConfig: AudienceTradeAreaConfig*/) : Observable<boolean> {
 //    const key = 'AUDIENCETA';
 //    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Creating Audience Trade Area'}));
 //
 //    try {
 //      const validate: boolean | string[] = this.validateTradeArea();
 //      if (validate !== true) {
 //        const growlMessage = [] ;
 //        for (const message of validate) {
 //          growlMessage.push(message);
 //        }
 // //      this.logger.debug.log('growlMessage::::', growlMessage);
 //        for (let i = 0; i < growlMessage.length; i++) {
 //          this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Audience Trade Area Error', message: growlMessage[i] }));
 //        }
 //        this.store$.dispatch(new StopBusyIndicator({ key }));
 //        return Observable.create(o => o.next(false));
 //      }
 //    }
 //    catch (error) {
 //      return Observable.create(o => o.next(false));
 //    }
 //
 //    this.attachLocations();
 //
 //    if (this.audienceTAConfig.analysisLevel != null && this.audienceTAConfig.analysisLevel.toLocaleLowerCase() === 'digital atz')
 //      this.audienceTAConfig.analysisLevel = 'dtz';
 //
 //    //for now we are going to force always fetching data,
 //    //there is a bug where if you add a location since the
 //    //last time you ran an audience TA the rerun detection doesn't work
 //    //this.determineRerun(minRadius, maxRadius, digCategoryId, weight);
 //    this.fetchData = true;
 //
 //    if (this.fetchData) {
 //      const projectVarsDict = this.stateService.projectVarsDict$;
 //
 //      this.projectVarService.remove(this.projectVarService.get().filter(pv => pv.source === 'Online_Audience-TA' /*&& !pv.fieldname.includes("Index Value")*/ || pv.isCustom), InTransaction.silent);
 //
 //      this.stateService.currentProject$.getValue().impProjectVars = this.stateService.currentProject$.getValue().impProjectVars.filter(pv => /*(*/pv.source !== 'Online_Audience-TA'  /*|| pv.fieldname.includes("Index Value"))*/ && !pv.isCustom);
 //
 //      this.varService.remove(this.varService.get().filter(pv => (projectVarsDict[pv.varPk] || safe).varSource === 'Online_Audience-TA' || (projectVarsDict[pv.varPk] || safe).isCustom), InTransaction.silent);
 //
 //      this.stateService.currentProject$.getValue().getImpGeofootprintTradeAreas().forEach(ta => ta.impGeofootprintVars = ta.impGeofootprintVars
 //        .filter(gv => (projectVarsDict[gv.varPk] || safe).varSource  !== 'Online_Audience-TA' && !(projectVarsDict[gv.varPk] || safe).isCustom));
 //
 //      this.sendRequest(this.audienceTAConfig).subscribe(response => {
 //        try {
 //          this.parseResponse(response, audienceTAConfig.audienceName);
 //          if (this.taResponses.size < 1) {
 //            this.logger.warn.log('No data found when running audience trade area:', this.audienceTAConfig);
 //            this.store$.dispatch(new WarningNotification({ notificationTitle: 'Audience Trade Area Warning', message: 'No data was found for your input parameters' }));
 //            this.store$.dispatch(new StopBusyIndicator({ key }));
 //            this.audienceTaSubject.next(true);
 //            return;
 //          }
 //          this.fetchData = false;
 //          const allLocations = this.stateService.currentMaster$.getValue().impGeofootprintLocations.filter(l => l.clientLocationTypeCode === 'Site' && l.baseStatus !== 'DELETE');
 //          const existingAudienceTAs = simpleFlatten(allLocations.map(l => l.impGeofootprintTradeAreas)).filter(ta => ta.taType === 'AUDIENCE' || ta.taType === 'HOMEGEO');
 //          if (existingAudienceTAs.length > 0) {
 //            this.appTradeAreaService.deleteTradeAreas(existingAudienceTAs);
 //          }
 //          const newTradeAreas: ImpGeofootprintTradeArea[] = [];
 //          for (const location of allLocations) {
 //            this.createGeos(audienceTAConfig, location);
 //          }
 //
 //          const selectedGeocodes = new Set(this.geoCache.filter(g => g.isActive).map(g => g.geocode));
 //          this.geoCache.forEach(g => {
 //            if (selectedGeocodes.has(g.geocode)) g.isActive = true;
 //          });
 //
 //          for (const location of allLocations) {
 //            const locationGeos = this.geoCache.filter((val) => val.impGeofootprintLocation.locationNumber === location.locationNumber);
 //            const newTradeArea = this.createTradeArea(locationGeos, location);
 //            if (newTradeArea != null) newTradeAreas.push(newTradeArea);
 //          }
 //          if (this.failedLocations.length > 0) {
 //            let warningMessage = 'Unable to find data for the following locations:\n';
 //            for (const failedLoc of this.failedLocations) {
 //              warningMessage += failedLoc.locationNumber + '\n';
 //            }
 //            this.store$.dispatch(new WarningNotification({ notificationTitle: 'Audience Trade Area Warning', message: warningMessage }));
 //            this.failedLocations = [];
 //          }
 //          this.appTradeAreaService.insertTradeAreas(newTradeAreas);
 //          this.geoService.add(this.geoCache);
 //          this.appTradeAreaService.zoomToTradeArea();
 //          this.targetAudienceTAService.addAudiences(this.taResponses, audienceTAConfig.digCategoryId, this.audienceTAConfig);
 //          //this.logger.debug.log('Geos before finalizing Audience TA', this.geoCache.map(g => ({ geocode: g.geocode, isActive: g.isActive })));
 //          this.geoCache = new Array<ImpGeofootprintGeo>();
 //          this.audienceTaSubject.next(true);
 //          this.store$.dispatch(new StopBusyIndicator({ key }));
 //        }
 //        catch (error) {
 //          this.logger.error.log(error);
 //          this.audienceTaSubject.next(false);
 //          this.store$.dispatch(new StopBusyIndicator({ key }));
 //        }
 //      },
 //      err => {
 //        this.logger.error.log(err);
 //        this.audienceTaSubject.next(false);
 //        this.fetchData = true;
 //        this.store$.dispatch(new StopBusyIndicator({ key }));
 //      });
 //    }
 //    else {
 //      this.rerunTradearea(audienceTAConfig).subscribe(res => {
 //        if (res) {
 //          this.audienceTaSubject.next(true);
 //        }
 //        else {
 //          this.audienceTaSubject.next(false);
 //          this.store$.dispatch(new StopBusyIndicator({ key }));
 //        }
 //      },
 //      err => {
 //        this.logger.error.log(err);
 //        this.audienceTaSubject.next(false);
 //        this.fetchData = true;
 //        this.store$.dispatch(new StopBusyIndicator({ key }));
 //      });
 //    }
 //    return this.audienceTaSubject.asObservable();
    return EMPTY;
  }

  /**
   * Determine if we need to fetch data from the Fuse service
   * or if we can rerun the trade area with cached data
   * @param minRadius The minimum, must cover radius, for the trade areas
   * @param maxRadius The maximum radius for the trade areas
   * @param digCategoryId The ID of the targeting variable currently in use
   * @param weight The weight of the selected variable vs the distance
   */
  // private determineRerun(minRadius: number, maxRadius: number, digCategoryId: number, weight: number) {
  //   if (minRadius !== this.lastMinRadius)
  //     this.fetchData = true;
  //   if (maxRadius !== this.lastMaxRadius)
  //     this.fetchData = true;
  //   if (digCategoryId !== this.lastDigCategoryId)
  //     this.fetchData = true;
  //   if (weight !== this.lastWeight)
  //     this.fetchData = true;
  // }

  /**
   * Recreate trade areas without requesting data again from the Fuse service
   * We can do this as long as no locations have changed since the last run
   */
  // private rerunTradearea(audienceTAConfig: AudienceTradeAreaConfig) : Observable<boolean> {
  //   return Observable.create(obs => {
  //     try {
  //       for (const location of this.locationService.get()) {
  //         this.createGeos(audienceTAConfig, location);
  //       }
  //
  //       const selectedGeocodes = new Set(this.geoCache.filter(g => g.isActive).map(g => g.geocode));
  //       this.geoCache.forEach(g => {
  //         if (selectedGeocodes.has(g.geocode)) g.isActive = true;
  //       });
  //
  //       for (const location of this.locationService.get()) {
  //         const locationGeos = this.geoCache.filter((val) => val.impGeofootprintLocation.locationNumber === location.locationNumber);
  //         this.createTradeArea(locationGeos, location);
  //       }
  //       obs.next(true);
  //     } catch (error) {
  //       obs.error(error);
  //     }
  //   });
  // }

  /**
   * Send the request to the Fuse service to get the geo scores around each location
   * @param taConfig The AudienceTradeareaConfig to send to Fuse
   */
  // private sendRequest(taConfig: AudienceTradeAreaConfig) : Observable<RestResponse> {
  //   const payload: AudienceTradeAreaConfig = Object.assign({}, taConfig);
  //   delete payload.includeMustCover;
  //   delete payload.audienceName;
  //   const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
  //   const url: string = this.appConfig.valServiceBase + 'v1/targeting/base/audiencetradearea';
  //   return this.httpClient.post<RestResponse>(url, JSON.stringify(payload), { headers: headers });
  // }

  /**
   * Parse the response from Fuse and build the array of audienceTradeareaResponses
   * This method will also create the renderer data that is required for map shading
   */
  // private parseResponse(restResponse: RestResponse, alternateCategoryName: string) {
  //   this.taResponses = new Map<string, Map<number, AudienceTradeareaResponse>>();
  //   let rendererData: Array<any> = new Array<any>();
  //   let count: number = 0;
  //   for (const taResponse of restResponse.payload.rows) {
  //     if (taResponse.categoryName == null) {
  //       taResponse.categoryName = alternateCategoryName;
  //     }
  //     if (this.taResponses.has(taResponse.locationName)) {
  //       this.taResponses.get(taResponse.locationName).set(count, taResponse);
  //       count++;
  //     } else {
  //       count = 0; // reset the counter for each new location
  //       const addResponse: Map<number, AudienceTradeareaResponse> = new Map<number, AudienceTradeareaResponse>();
  //       addResponse.set(count, taResponse);
  //       this.taResponses.set(taResponse.locationName, addResponse);
  //       count++;
  //     }
  //     const geoVar: ImpGeofootprintVar = new ImpGeofootprintVar();
  //     geoVar.value = taResponse.combinedIndexTileName;
  //     rendererData.push({ geocode: taResponse.geocode, data: geoVar });
  //   }
  //   rendererData = rendererData.sort((a, b) => this.compare(a, b));
  //
  //   // We are not enabling thematic shading by default anymore
  //   //this.rendererService.updateData(rendererData);
  // }

  /**
   * Build an AudienceTradeareaConfig that will be used to send input parameters to the Fuse service
   * @param minRadius The minimum, must cover radius, for the trade area
   * @param maxRadius The maximum radius for the trade area
   * @param digCategoryId The ID of the online audience variable that has been selected by the user
   * @param weight The weight of the variable vs distance that has been set by the user
   * @param scoreType Score type, DMA or national
   * @param mustCover
   */
  // private buildTAConfig(minRadius: number, maxRadius: number, digCategoryId: number, weight: number, scoreType: string, mustCover: boolean) : AudienceTradeAreaConfig {
  //   const audienceTALocations: Array<AudienceTradeareaLocation> = new Array<AudienceTradeareaLocation>();
  //   const taConfig: AudienceTradeAreaConfig = {
  //     analysisLevel: this.stateService.analysisLevel$.getValue().toLocaleLowerCase(),
  //     digCategoryId: digCategoryId,
  //     locations: audienceTALocations,
  //     maxRadius: Number(maxRadius),
  //     minRadius: Number(minRadius),
  //     scoreType: scoreType,
  //     weight: weight / 100,
  //     includeMustCover: mustCover
  //   };
  //   for (const location of this.locationService.get()) {
  //     const taLocation: AudienceTradeareaLocation = {
  //       LOCATIONNAME: location.locationNumber,
  //       XCOORD: location.xcoord,
  //       YCOORD: location.ycoord,
  //       HOMEGEOCODE: location.homeGeocode
  //     };
  //     if (taConfig.analysisLevel.toLocaleLowerCase() === 'digital atz')
  //       taConfig.analysisLevel = 'dtz';
  //     audienceTALocations.push(taLocation);
  //   }
  //   return taConfig;
  // }

  /**
   * Create a Map that will hold the sort order for the SmartTile values
   * this sort order will be used for the legen on the map, to preverse order
   */
  // private initializeSortMap() {
  //   this.sortMap.set(SmartTile.EXTREMELY_HIGH, 1);
  //   this.sortMap.set(SmartTile.HIGH, 2);
  //   this.sortMap.set(SmartTile.ABOVE_AVERAGE, 3);
  //   this.sortMap.set(SmartTile.AVERAGE, 4);
  //   this.sortMap.set(SmartTile.BELOW_AVERAGE, 5);
  //   this.sortMap.set(SmartTile.LOW, 6);
  //   this.sortMap.set(SmartTile.EXTREMELY_LOW, 7);
  // }

  /**
   * Compare smart tile values together to determine sort oder
   */
  // private compare(a, b) {
  //   if (this.sortMap.get(a.data.valueString) > this.sortMap.get(b.data.valueString)) {
  //     return -1;
  //   }
  //   if (this.sortMap.get(a.data.valueString) < this.sortMap.get(b.data.valueString)) {
  //     return 1;
  //   }
  //   return 0;
  // }

  /**
   * Create the rederer we will need by invoking the AppRendererService
   */
  // private createRenderer() {
  //   const rendererData: Array<any> = new Array<any>();
  //   for (const geofootprintVar of this.mockVars) {
  //     rendererData.push({ geocode: geofootprintVar.geocode, data: geofootprintVar.valueString });
  //   }
  //   this.rendererService.updateData(rendererData.sort((a, b) => this.compare(a, b)));
  // }

  /**
   * Create the audience trade area
   * @param geos An array of geos that will be attached to the trade area being created
   * @param location the location that the trade area is associated with
   */
  // private createTradeArea(geos: ImpGeofootprintGeo[], location: ImpGeofootprintLocation) : ImpGeofootprintTradeArea {
  //   if (!geos || geos.length < 1 || !location) {
  //     this.logger.warn.log('No geos found when attempting to create AudienceTA');
  //     return null;
  //   }
  //   const tradeArea = this.domainFactory.createTradeArea(location, TradeAreaTypeCodes.Audience);
  //   tradeArea.impGeofootprintGeos = geos;
  //   geos.forEach(geo => geo.impGeofootprintTradeArea = tradeArea);
  //   return tradeArea;
  // }

  /**
   * Create and select geos that belong to an individual location
   * @returns An array of ImpGeofootprintGeo
   */
  // private createGeos(audienceTAConfig, location: ImpGeofootprintLocation) : ImpGeofootprintGeo[] {
  //   // DE2124: if a location got no data back from the service we need to skip it
  //   if (!this.taResponses.has(location.locationNumber)) {
  //     this.store$.dispatch(new WarningNotification({ notificationTitle: 'Audience Trade Area Warning', message: `Location number ${location.locationNumber} has no available data, unable to create Audience TA for this location` }));
  //     return;
  //   }
  //   const newGeos: ImpGeofootprintGeo[] = new Array<ImpGeofootprintGeo>();
  //   const taResponseMap = this.taResponses.get(location.locationNumber);
  //   const newAttributes: GeoAttribute[] = [];
  //
  //   for (let i = 0; i < taResponseMap.size; i++) {
  //     const newGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
  //     const taResponse = taResponseMap.get(i);
  //     if (!taResponse || !taResponse.geocode) {
  //       this.logger.warn.log('Unable to find valid audience TA response for location: ', location);
  //       continue;
  //     }
  //     newGeo.geocode = taResponse.geocode;
  //     newGeo.impGeofootprintLocation = location;
  //     newGeo.distance = taResponse.distance;
  //
  //     newGeo.isActive = this.targetAudienceTAService.setActiveGeos(taResponse.combinedIndexTile, audienceTAConfig, taResponse.distance);
  //     if (!newGeo.isActive) {
  //       const filterReasons: string[] = [];
  //       filterReasons.push('Under Audience TA threshold');
  //       newGeo['filterReasons'] = filterReasons;
  //     }
  //
  //     newAttributes.push({ geocode: newGeo.geocode, preSelectedForAudience: newGeo.isActive });
  //
  //     if (!this.locationsWithNoScores.has(location)) {
  //       this.locationsWithNoScores.set(location, taResponse.indexValue != null);
  //     } else {
  //       if (taResponse.indexValue != null && this.locationsWithNoScores.get(location) === false) {
  //         this.locationsWithNoScores.set(location, true);
  //       }
  //     }
  //     newGeo.ggId = this.geoService.getNextStoreId();
  //     newGeos.push(newGeo);
  //   }
  //
  //   if (newAttributes.length > 0) this.store$.dispatch(new UpsertGeoAttributes({ geoAttributes: newAttributes }));
  //
  //   this.logger.info.log('locationsWithNoScores:::', this.locationsWithNoScores);
  //   if (this.locationsWithNoScores.size > 0 && this.locationsWithNoScores.get(location) === false){
  //     this.logger.warn.log('Unable to find response for location: ', location);
  //     this.failedLocations.push(location);
  //   }
  //   this.geoCache.push(...newGeos);
  //   return newGeos;
  // }

  // private searchVarId(fieldDisplay: string) : number {
  //   const projectVarsDict = this.stateService.projectVarsDict$;
  //
  //   for (const geoVar of this.varService.get()) {
  //     if ((projectVarsDict[geoVar.varPk] || safe).customVarExprDisplay === fieldDisplay) {
  //       return geoVar.varPk;
  //     }
  //   }
  //   return null;
  // }

  /**
   * Attach the mock variables to the 48152 location
   */
  // private attachVariables() {
  //   for (const geofootprintVar of this.mockVars) {
  //     geofootprintVar.impGeofootprintLocation = this.locationService.get().filter(l => l.homeGeocode === '48152')[0];
  //   }
  // }

  /**
   * The Constructor will build out mock data until there is a REST service available that can deliver this data back to the application
   */
  constructor(
              // private varService: ImpGeofootprintVarService,
              // private projectVarService: ImpProjectVarService,
              // private stateService: AppStateService,
              // private appTradeAreaService: AppTradeAreaService,
              // private locationService: ImpGeofootprintLocationService,
              // private geoService: ImpGeofootprintGeoService,
              // private rendererService: AppRendererService,
              // private mapService: AppMapService,
              // private httpClient: HttpClient,
              // private appConfig: AppConfig,
              // private targetAudienceService: TargetAudienceService,
              // private targetAudienceTAService: TargetAudienceAudienceTA,
              // private domainFactory: ImpDomainFactoryService,
              // private appGeoService: AppGeoService,
              // private store$: Store<FullAppState>,
              // private logger: LoggingService
            ) {
      // this.audienceTAConfig = {
      //   analysisLevel: null,
      //   digCategoryId: null,
      //   includeMustCover: null,
      //   locations: null,
      //   maxRadius: null,
      //   minRadius: null,
      //   scoreType: 'DMA',
      //   weight: null
      // };
      // this.initializeSortMap();
      // this.locationService.storeObservable.subscribe(() => {
      //   // if location data changes, we will need to Fetch data from fuse the next time we create trade areas
      //   this.fetchData = true;
      // });
      // this.stateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoad());
  }
}