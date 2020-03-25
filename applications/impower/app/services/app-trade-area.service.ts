import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort, filterArray, groupBy, isConvertibleToNumber, mapBy, simpleFlatten, toUniversalCoordinates } from '@val/common';
import { EsriMapService, EsriQueryService, EsriUtils } from '@val/esri';
import { ClearAudienceStats } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { ClearGeoVars } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { ClearMapVars } from 'app/impower-datastore/state/transient/map-vars/map-vars.actions';
import { TradeAreaRollDownGeos } from 'app/state/data-shim/data-shim.actions';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { filter, map, reduce, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { ValSort } from '../models/valassis-sorters';
import { FullAppState } from '../state/app.interfaces';
import { RenderTradeAreas } from '../state/rendering/rendering.actions';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppGeoService } from './app-geo.service';
import { AppLoggingService } from './app-logging.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';

export class TradeAreaDefinition {
  store: string;
  geocode: string;
  message: string;
}

const UsTableMap = {
  'ZIP': 'CL_ZIP_US',
  'ATZ': 'CL_ATZ_US',
  'Digital ATZ': 'VAL_DIG_US',
  'PCR': 'CL_PCR_US'
};

@Injectable()
export class AppTradeAreaService {

  public currentDefaults = new Map<(SuccessfulLocationTypeCodes), { radius: number, selected: boolean, taNumber: number }[]>();
  private validAnalysisLevel$: Observable<string>;

  public tradeareaType: string = '';
  public uploadFailures: TradeAreaDefinition[] = [];
  private uploadFailuresSub: BehaviorSubject<TradeAreaDefinition[]> = new BehaviorSubject<TradeAreaDefinition[]>([]);
  public uploadFailuresObs$: Observable<TradeAreaDefinition[]> = this.uploadFailuresSub.asObservable();

  constructor(private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impLocationService: ImpGeofootprintLocationService,
              private impLocAttrService: ImpGeofootprintLocAttribService,
              private impGeoService:  ImpGeofootprintGeoService,
              private impVarService: ImpGeofootprintVarService,
              private stateService: AppStateService,
              private appGeoService: AppGeoService,
              private appConfig: AppConfig,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService,
              private restService: RestDataService,
              private appProjectPrefService: AppProjectPrefService,
              private store$: Store<FullAppState>) {
    this.currentDefaults.set(ImpClientLocationTypeCodes.Site, []);
    this.currentDefaults.set(ImpClientLocationTypeCodes.Competitor, []);
    this.validAnalysisLevel$ = this.stateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));

    this.stateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.impTradeAreaService.storeObservable.pipe(
        filter(ta => ta != null && ta.length > 0),
        filterArray(ta => ta.impGeofootprintLocation != null && ta.impGeofootprintLocation.isActive && ta.isActive),
      ).subscribe(tradeAreas => this.store$.dispatch(new RenderTradeAreas({ tradeAreas })));

      this.setupAnalysisLevelGeoClearObservable();
    });
  }

  private setupAnalysisLevelGeoClearObservable() {
    // the core sequence only fires when analysis level changes
    this.validAnalysisLevel$.pipe(
      // need to enlist the latest geos and isLoading flag
      withLatestFrom(this.impGeoService.storeObservable, this.stateService.applicationIsReady$),
      // halt the sequence if the project is loading
      filter(([, , isReady]) => isReady),
      // halt the sequence if there are no geos
      filter(([, geos]) => geos != null && geos.length > 0),
    ).subscribe(() => this.clearGeos());
  }

  public onLocationsWithoutRadius(locations: ImpGeofootprintLocation[]) : void{
    const currentLocations = locations.filter(loc => loc.baseStatus === 'INSERT' && loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS').length === 0);
    const newSites = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Site');
    const newCompetitors = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Competitor');
    if (newSites.length > 0) {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Site), newSites);
    }
    if (newCompetitors.length > 0) {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Competitor), newCompetitors);
    }
  }

  public onAnalysisLevelChange() : void{
    const locations = this.impLocationService.get();
    const currentLocations = locations.filter(loc => loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS').length === 0);
    const newSites = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Site');
    const newCompetitors = currentLocations.filter(loc => loc.clientLocationTypeCode === 'Competitor');
    if (newSites.length > 0) {
      const siteRadiusFlag: boolean = newSites.filter(loc => isConvertibleToNumber(loc.radius1) || isConvertibleToNumber(loc.radius2) || isConvertibleToNumber(loc.radius3)).length > 0;
      if (siteRadiusFlag) {
        this.applyRadiusTradeAreaOnAnalysisChange(newSites);
      } else {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Site), newSites);
      }
    }
    if (newCompetitors.length > 0) {
      const competitorRadiusFlag: boolean = newCompetitors.filter(loc => isConvertibleToNumber(loc.radius1) || isConvertibleToNumber(loc.radius2) || isConvertibleToNumber(loc.radius3)).length > 0;
      if (competitorRadiusFlag) {
        this.applyRadiusTradeAreaOnAnalysisChange(newCompetitors);
      } else {
        this.applyRadiusTradeAreasToLocations(this.currentDefaults.get(ImpClientLocationTypeCodes.Competitor), newCompetitors);
      }
    }
  }

  clearAll() : void {
    this.currentDefaults.set(ImpClientLocationTypeCodes.Site, []);
    this.currentDefaults.set(ImpClientLocationTypeCodes.Competitor, []);
    this.impTradeAreaService.clearAll();
    this.impVarService.clearAll();
  }

  private applyRadiusTradeAreaOnAnalysisChange(data: ImpGeofootprintLocation[]) : void{
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];

    data.forEach(l => {
      const tradeAreas: { radius: number, selected: boolean, taNumber: number }[] = [];
      if (isConvertibleToNumber(l.radius1) && Number(l.radius1) > 0) {
        tradeAreas.push({ radius: Number(l.radius1), selected: true, taNumber: 1 });
      }
      if (isConvertibleToNumber(l.radius2) && Number(l.radius2) > 0) {
        tradeAreas.push({ radius: Number(l.radius2), selected: true, taNumber: 2 });
      }
      if (isConvertibleToNumber(l.radius3) && Number(l.radius3) > 0) {
        tradeAreas.push({ radius: Number(l.radius3), selected: true, taNumber: 3 });
      }
      newTradeAreas.push(...this.createRadiusTradeAreasForLocations(tradeAreas, [l], false));
    });

    newTradeAreas.forEach(ta => ta.impGeofootprintLocation.impGeofootprintTradeAreas.push(ta));
    this.insertTradeAreas(newTradeAreas);
    this.zoomToTradeArea();
  }

  public deleteTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    if (tradeAreas == null || tradeAreas.length === 0) return;

    const locations = new Set<ImpGeofootprintLocation>(tradeAreas.map(ta => ta.impGeofootprintLocation));
    const tradeAreaSet = new Set<ImpGeofootprintTradeArea>(tradeAreas);
    // remove from the hierarchy
    locations.forEach(loc => loc.impGeofootprintTradeAreas = loc.impGeofootprintTradeAreas.filter(ta => !tradeAreaSet.has(ta)));
    // delete from the data stores
    const geosToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintGeos));
    const varsToRemove = simpleFlatten(tradeAreas.map(ta => ta.impGeofootprintVars));
    tradeAreas.forEach(ta => {
      ta.impGeofootprintLocation = null;
      ta.impGeofootprintVars = [];
    });
    varsToRemove.forEach(v => v.impGeofootprintTradeArea = null);
    if (varsToRemove.length > 0) this.impVarService.remove(varsToRemove);
    this.appGeoService.deleteGeos(geosToRemove);
    this.impTradeAreaService.remove(tradeAreas);
  }

  public insertTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : void {
    this.impTradeAreaService.add(tradeAreas);
  }

  public applyRadiusTradeArea(tradeAreas: { radius: number, selected: boolean, taNumber: number }[], siteType: SuccessfulLocationTypeCodes) : void {
    if (tradeAreas == null || tradeAreas.length === 0) {
      this.logger.error.log('Invalid Trade Area request', { tradeAreas, siteType });
      throw new Error('Invalid Trade Area request');
    }
    const currentLocations = this.getLocations(siteType);
    const tradeAreaFilter = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Radius, TradeAreaTypeCodes.HomeGeo]);
    const currentTradeAreas = this.impTradeAreaService.get()
      .filter(ta => ImpClientLocationTypeCodes.parse(ta.impGeofootprintLocation.clientLocationTypeCode) === siteType &&
                    tradeAreaFilter.has(TradeAreaTypeCodes.parse(ta.taType)));
    this.deleteTradeAreas(currentTradeAreas);
    this.currentDefaults.set(siteType, tradeAreas); // reset the defaults that get applied to new locations
    this.applyRadiusTradeAreasToLocations(tradeAreas, currentLocations);
  }

  public reOrderGeosInTradeAreas(tradeAreas: { radius: number, selected: boolean, taNumber: number }[], siteType: SuccessfulLocationTypeCodes) : void {
    if (tradeAreas == null || tradeAreas.length === 0) {
      this.logger.error.log('Invalid Trade Area request', { tradeAreas, siteType });
      throw new Error('Invalid Trade Area request');
    }
    this.currentDefaults.set(siteType, tradeAreas);

    const currentTradeAreas = this.impTradeAreaService.get()
      .filter(ta => ImpClientLocationTypeCodes.parse(ta.impGeofootprintLocation.clientLocationTypeCode) === siteType &&
                    TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius);
    currentTradeAreas.forEach(current => {
      const newTA = tradeAreas.filter(ta => ta.taNumber === current.taNumber)[0];
      current.isActive = newTA != null ? newTA.selected : false;
    });
    if (siteType === ImpClientLocationTypeCodes.Site) {
      const locations = this.impLocationService.get()
        .filter(loc => ImpClientLocationTypeCodes.parse(loc.clientLocationTypeCode) === ImpClientLocationTypeCodes.Site);
      const geosToRemove = [];
      locations.forEach(currentLocation => {
        let geosToProcess = currentLocation.getImpGeofootprintGeos(TradeAreaTypeCodes.Radius);
        const radiusTradeAreas = currentLocation.impGeofootprintTradeAreas.filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius);
        radiusTradeAreas.sort(ValSort.TradeAreaByRadius);
        const upperBound = Math.max(...radiusTradeAreas.filter(ta => ta.isActive).map(ta => ta.taRadius));
        let lowerBound = 0;
        let nextGeos = [];
        radiusTradeAreas.forEach(ta => {
          ta.impGeofootprintGeos = [];
          if (ta.isActive) {
            ta.impGeofootprintGeos = geosToProcess.reduce((geos, geo) => {
              if (geo.distance <= ta.taRadius && geo.distance > lowerBound) {
                geo.impGeofootprintTradeArea = ta;
                geos.push(geo);
              } else if (geo.distance > upperBound) {
                geosToRemove.push(geo);
              } else {
                nextGeos.push(geo);
              }
              return geos;
            }, []);
            if (ta.impGeofootprintGeos.length === 0) {
              // we need to have the geos re-pulled from the layer
              delete ta['isComplete'];
            }
            lowerBound = ta.taRadius;
            geosToProcess = Array.from(nextGeos);
            nextGeos = [];
          }
        });
      });
      if (geosToRemove.length > 0) {
        this.impGeoService.remove(geosToRemove);
      } else {
        this.impGeoService.makeDirty();
      }
      this.appGeoService.ensureMustCovers();
    }
    this.impTradeAreaService.makeDirty();
  }

  public zoomToTradeArea() {
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const geoCount = this.stateService.uniqueIdentifiedGeocodes$.getValue().length;

    if (currentAnalysisLevel != null && currentAnalysisLevel.length > 0 && geoCount <= this.appConfig.maxGeosForPrecisionZoom) {
      // analysisLevel exists - zoom to Trade Area
      const layerId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel);
      if (layerId == null) return;
      this.stateService.uniqueIdentifiedGeocodes$.pipe(
        filter(geos => geos != null && geos.length > 0),
        take(1),
        switchMap(geos => this.esriQueryService.queryAttributeIn(layerId, 'geocode', geos, true)),
        reduce((a, c) => [...a, ...c], []),
        switchMap(polys => this.esriMapService.zoomToPolys(polys))
      ).subscribe();
    } else {
      this.impLocationService.storeObservable.pipe(
        map(data => data.filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site || loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor)),
        map(locations => toUniversalCoordinates(locations)),
        take(1),
        switchMap(coords => this.esriMapService.zoomToPoints(coords)),
        map(() => this.esriMapService.zoomOut()),
      ).subscribe();
    }
  }

  private clearGeos() : void {
    const allTradeAreas = this.impTradeAreaService.get();
    allTradeAreas.forEach(ta => {
      ta.impGeofootprintGeos = [];
      ta.impGeofootprintVars = [];
      if (TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius) ta['isComplete'] = undefined;
    });
    const allLocations = this.impLocationService.get();
    allLocations.forEach(l => {
      l.impGeofootprintLocAttribs = l.impGeofootprintLocAttribs.filter(a => a.attributeCode !== 'Invalid Home Geo');
    });
    const attrs = this.impLocAttrService.get().filter(a => a.attributeCode === 'Invalid Home Geo');
    const tradeAreasToRemove = new Set([TradeAreaTypeCodes.HomeGeo, TradeAreaTypeCodes.Manual, TradeAreaTypeCodes.MustCover]);
    this.logger.info.log('Clearing all Geos');
    this.impTradeAreaService.startTx();
    this.impLocAttrService.remove(attrs);
    this.store$.dispatch( new ClearMapVars());
    this.store$.dispatch( new ClearGeoVars());
    this.store$.dispatch( new ClearAudienceStats());
    this.impVarService.clearAll();
    this.appGeoService.clearAll();
    const removeTradeAreas = allTradeAreas.filter(ta => tradeAreasToRemove.has(TradeAreaTypeCodes.parse(ta.taType)));
    removeTradeAreas.length > 0 ? this.deleteTradeAreas(removeTradeAreas) : this.impTradeAreaService.makeDirty();
    //this.impTradeAreaService.remove(allTradeAreas.filter(ta => tradeAreasToRemove.has(TradeAreaTypeCodes.parse(ta.taType))));
    this.impTradeAreaService.stopTx();
  }

  public createRadiusTradeAreasForLocations(tradeAreas: { radius: number, selected: boolean, taNumber: number }[], locations: ImpGeofootprintLocation[], attachToHierarchy: boolean = true) : ImpGeofootprintTradeArea[] {
    let newTradeAreas: ImpGeofootprintTradeArea[] = [];
    if (tradeAreas != null && tradeAreas.length > 0) {
      locations.forEach(location => {
        const newDomain = tradeAreas.map(ta => this.domainFactory.createTradeArea(location, TradeAreaTypeCodes.Radius, ta.selected, ta.taNumber, ta.radius, attachToHierarchy));
        newTradeAreas = newTradeAreas.concat(newDomain);
      });
    }

    return newTradeAreas;
  }

  public applyRadiusTradeAreasToLocations(tradeAreas: { radius: number, selected: boolean, taNumber: number }[], locations: ImpGeofootprintLocation[]) : void {
    const newTradeAreas: ImpGeofootprintTradeArea[] = this.createRadiusTradeAreasForLocations(tradeAreas, locations);
    if (newTradeAreas.length > 0) {
      this.impTradeAreaService.add(newTradeAreas);
    }
  }

  private getLocations(siteType: SuccessfulLocationTypeCodes) : ImpGeofootprintLocation[] {
    return this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType);
  }

  public applyCustomTradeArea(data: TradeAreaDefinition[], fileAnalysisLevel: string = null, isResubmit: boolean = false){
    this.uploadFailures = [];
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();

    const allLocations: ImpGeofootprintLocation[] = this.impLocationService.get();
    const locationsByNumber: Map<string, ImpGeofootprintLocation> = mapBy(allLocations, 'locationNumber');
    const matchedTradeAreas = new Set<TradeAreaDefinition>();

    // make sure we can find an associated location for each uploaded data row
    data.forEach(taDef => {
      if (locationsByNumber.has(taDef.store)){
        matchedTradeAreas.add(taDef);
      } else {
        taDef.message = 'Site number not found';
        this.uploadFailures = [...this.uploadFailures, taDef];
      }
    });

    const outfields = ['geocode', 'latitude', 'longitude'];
    const queryResult = new Map<string, {latitude: number, longitude: number}>();
    const geosToQuery = new Set(Array.from(matchedTradeAreas).map(ta => ta.geocode));
    const geos = new Set<string>();
    if (fileAnalysisLevel === 'ZIP' || fileAnalysisLevel === 'ATZ' || fileAnalysisLevel === 'PCR' || fileAnalysisLevel === 'Digital ATZ'){

        const portalLayerId = fileAnalysisLevel == null ? this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel) : this.appConfig.getLayerIdForAnalysisLevel(fileAnalysisLevel);
        this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', Array.from(geosToQuery), false, outfields).pipe(
          map(graphics => graphics.map(g => g.attributes)),
          map(attrs => attrs.map(a => ({ geocode: a.geocode, latitude: Number(a.latitude), longitude: Number(a.longitude) })))
        ).subscribe(
          results => results.forEach(r => {
            queryResult.set(r.geocode, { latitude: r.latitude, longitude: r.longitude });
            geos.add(r.geocode);
          }),
          err => this.logger.debug.log('There was an error querying the ArcGIS layer', err),
          () => {
              this.store$.dispatch(new TradeAreaRollDownGeos({geos: Array.from(geos),
                                                              queryResult: queryResult,
                                                              fileAnalysisLevel: fileAnalysisLevel,
                                                              matchedTradeAreas: Array.from(matchedTradeAreas), isResubmit: isResubmit}));
          });
        }else {
        this.logger.debug.log('file analysis level', fileAnalysisLevel);
        this.store$.dispatch(new TradeAreaRollDownGeos({geos: Array.from(geosToQuery),
                                                        queryResult: queryResult,
                                                        fileAnalysisLevel: fileAnalysisLevel,
                                                        matchedTradeAreas: Array.from(matchedTradeAreas), isResubmit: isResubmit}));
      }
  }

   /**
     * select field should depend on currect analysis level
     * usTable field also need to depend on currect Analysis level
     * wherefield  should depend on file analysis level
     * hhcField should depend on current analysis level
     */
  public rollDownService(geos: string[], fileAnalysisLevel: string){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const usTable = UsTableMap[currentAnalysisLevel];
    const selectField = currentAnalysisLevel === 'Digital ATZ' ? 'DTZ' : currentAnalysisLevel;
    const whereField = fileAnalysisLevel === 'Digital ATZ' ? 'DTZ' : fileAnalysisLevel;
    const seasonField = 'HHLD_S'; //TODO: need to get the value from discovey tab
    const tab14TableName = currentAnalysisLevel === 'Digital ATZ' ? 'VAL_DIGTAB14' : `CL_${currentAnalysisLevel}TAB14`;

    const chunked_arr = [];
    let index = 0;
    while (index < geos.length) {
      chunked_arr.push(geos.slice(index, 100 + index));
      index += 100;
    }
    const obs = chunked_arr.map( geoList => {
      const reqPayload = {'usTable': usTable, 'selectField': selectField, 'whereField': whereField, 'geoList': geoList, 'seasonField': seasonField, 'tab14TableName': tab14TableName};
      return this.restService.post('v1/targeting/base/rolldown/rolldowngeocode', reqPayload);
      });

    return merge(...obs, 4).pipe(
      map( response => {
        return response.payload;
      }),
      reduce((acc, result) => [...acc, ...result], []),
    );
  }

  public validateRolldownGeos(payload: any[], queryResult: Map<string, {latitude: number, longitude: number}>,  matchedTradeAreas: any[], fileAnalysisLevel: string) {
    let failedGeos: any[] = [];
    const payloadByGeocode = mapBy(payload, 'orgGeo');
    const matchedTradeAreaByGeocode = groupBy(Array.from(matchedTradeAreas), 'geocode');
    if (fileAnalysisLevel === 'ZIP' || fileAnalysisLevel === 'ATZ' || fileAnalysisLevel === 'PCR' || fileAnalysisLevel === 'Digital ATZ'){
      matchedTradeAreas.forEach(ta => {
        if (!queryResult.has(ta.geocode)) {
            ta.message = 'Geocode not found';
            failedGeos = [...failedGeos, ta];
        }
        else if ( !payloadByGeocode.has(ta.geocode)){
            ta.message = 'Rolldown Geocode not found';
            failedGeos = [...failedGeos, ta];
        }
      });
    }
    else{
      const analysisLevel = fileAnalysisLevel === 'WRAP_MKT_ID' ? 'Wrap Zone' : fileAnalysisLevel === 'INFOSCAN_CODE' ? 'Infoscan' : fileAnalysisLevel;
      matchedTradeAreas.forEach(ta => {
         if ( !payloadByGeocode.has(ta.geocode)){
            ta.message = `Rolldown ${analysisLevel} not found`;
            failedGeos = [...failedGeos, ta];
        }
      });
    }

    payload.forEach(record => {
      const dupTradeAreas = matchedTradeAreaByGeocode.get(record.orgGeo);
      if (dupTradeAreas.length > 1){
        let i = 0;
        dupTradeAreas.forEach(rec => {
            if (i === 0)
                record.locNumber = rec.store;
            else
                payload.push({'geocode': record.geocode, 'x': record.x,
                              'y': record.y, 'season': record.season,
                              'orgGeo': record.orgGeo, 'locNumber': rec.store});
            i++;
         });
      }
      else {
        record.locNumber = matchedTradeAreaByGeocode.get(record.orgGeo)[0].store;
      }
    });

    return { failedGeos, payload };
  }

  public persistRolldownTAGeos(payload: any[], failedGeos: any[]){
    const geosToAdd: ImpGeofootprintGeo[] = [];
    const tradeAreasToAdd: ImpGeofootprintTradeArea[] = [];
    const allLocations: ImpGeofootprintLocation[] = this.impLocationService.get();
    const locationsByNumber: Map<string, ImpGeofootprintLocation> = mapBy(allLocations, 'locationNumber');
    payload.forEach(record => {
      const loc = locationsByNumber.get(record.locNumber);
      const layerData = {x: record.x, y: record.y};
      const distance = EsriUtils.getDistance(layerData.x, layerData.y, loc.xcoord, loc.ycoord);
      let currentTradeArea = loc.impGeofootprintTradeAreas.filter(current => current.taType.toUpperCase() === TradeAreaTypeCodes.Custom.toUpperCase())[0];
        if (currentTradeArea == null) {
          currentTradeArea = this.domainFactory.createTradeArea(loc, TradeAreaTypeCodes.Custom);
          tradeAreasToAdd.push(currentTradeArea);
        }
      const newGeo = this.domainFactory.createGeo(currentTradeArea, record.geocode, layerData.x, layerData.y, distance);
      geosToAdd.push(newGeo);
    });
    this.uploadFailures = this.uploadFailures.concat(failedGeos);
    // stuff all the results into appropriate data stores
    this.impGeoService.add(geosToAdd);
    this.impTradeAreaService.add(tradeAreasToAdd);
    this.appGeoService.ensureMustCovers();
    // this.uploadFailuresObs$ = of(this.uploadFailures);
    this.uploadFailuresSub.next(this.uploadFailures);
    return this.uploadFailures.map(row => row.geocode);
  }

  public setCurrentDefaults(){
    const loc = this.impLocationService.get();
    //const tradeAreas = this.impTradeAreaService.get();
    const locsMapSiteBy = mapBy(loc, 'clientLocationTypeCode');
    locsMapSiteBy.forEach((value) => {
      if (value != null && value.radius1 == null && value.radius2 == null && value.radius3 == null){
        const siteType = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(value.clientLocationTypeCode));
        const tas: { radius: number, selected: boolean, taNumber: number }[] = [];
        const radiusSet = new Set<Number>();
        value.impGeofootprintTradeAreas.forEach(ta => {
          radiusSet.add(Number(ta.taRadius));
        });
        const radiusArray = Array.from(radiusSet);
        radiusArray.sort(CommonSort.GenericNumber);
        if (radiusSet.size > 0){
          radiusArray.forEach((radius, i) => {
            tas.push({ radius: Number(radius), selected: true, taNumber: i + 1 });
          });
          this.currentDefaults.set(siteType, tas);
        }
      }
    });
  }

  public makeDirty() : void {
    this.impTradeAreaService.makeDirty();
  }
}
