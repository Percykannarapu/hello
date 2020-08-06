import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { getUuid, groupByExtended } from '@val/common';
import { EsriMapService, EsriQueryService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { ImpClientLocationTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { SetCurrentSiteNum, SetMapReady } from 'app/state/batch-map/batch-map.actions';
import { BatchMapQueryParams, FitTo } from 'app/state/shared/router.interfaces';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { Extent } from 'esri/geometry';
import { Observable, of, race, timer } from 'rxjs';
import { debounceTime, filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { getMapAudienceIsFetching } from '../impower-datastore/state/transient/audience/audience.selectors';
import { ValSort } from '../models/valassis-sorters';
import { BatchMapPayload, CurrentPageBatchMapPayload, ExtentPayload, LocalAppState, SinglePageBatchMapPayload } from '../state/app.interfaces';
import { ProjectLoad } from '../state/data-shim/data-shim.actions';
import { RenderLocations, RenderTradeAreas } from '../state/rendering/rendering.actions';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppMapService } from './app-map.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class BatchMapService {

  private originalGeoState: Record<number, boolean> = null;
  private originalTradeAreaState: Record<number, boolean> = null;
  private geoQueryId: string;

  constructor(private geoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService,
              private config: AppConfig,
              private appStateService: AppStateService,
              private appMapService: AppMapService,
              private store$: Store<LocalAppState>,
              private logService: LoggingService,
              private http: HttpClient) { }

  initBatchMapping(projectId: number) : void {
    this.esriMapService.watchMapViewProperty('updating').pipe(
      debounceTime(500),
      withLatestFrom(this.store$.select(getMapAudienceIsFetching)),
      map(([result, isFetching]) => !isFetching && !result.newValue)
    ).subscribe(ready => this.store$.dispatch(new SetMapReady({ mapReady: ready })));

    this.esriMapService.watchMapViewProperty('stationary').pipe(
      filter(result => result.newValue),
    ).subscribe(() => this.appStateService.refreshVisibleGeos());

    this.appMapService.setupMap(true);
    this.store$.dispatch(new ProjectLoad({ projectId, isBatchMode: true }));
    this.appStateService.notifyMapReady();
  }

  requestBatchMap(payload: BatchMapPayload | SinglePageBatchMapPayload | CurrentPageBatchMapPayload, project: ImpProject) : Observable<any> {
    if (payload.calls[0].args['printJobConfiguration'] != null) {
      const requestedSiteIds = new Set(payload.calls[0].args['printJobConfiguration'].siteIds);
      project.getImpGeofootprintLocations().forEach( l => {
      if ((l.clientLocationTypeCode === 'Failed Site' || !l.isActive) && requestedSiteIds.has(l.locationNumber))
        requestedSiteIds.delete(l.locationNumber); //we don't want to print failed sites, competitors, or inactive sites
      });
      payload.calls[0].args['printJobConfiguration'].siteIds = Array.from(requestedSiteIds);
    }
    return this.http.put(`${this.config.printServiceUrl}/api/service/`, payload);
  }

  getBatchMapDetailsByUser(username: string){
    return this.http.get(`${this.config.printServiceUrl}/jobdetails/username/${username}`);
  }

  getBatchMapDetailsById(jobId: number){
      return this.http.get(`${this.config.printServiceUrl}/jobdetails/byjobid/${jobId}`);
  }

  validateProjectReadiness(project: ImpProject) : boolean {
    const notificationTitle = 'Batch Map Issue';
    const projectNotSaved = 'The project must be saved before you can generate a batch map.';
    let result = true;
    if (project.projectId == null) {
      this.store$.dispatch(new ErrorNotification({ message: projectNotSaved, notificationTitle }));
      result = false;
    }
    return result;
  }

  startBatchMaps(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    if (this.originalGeoState == null) {
      this.geoService.calculateGeoRanks();
      this.recordOriginalState(project);
      this.geoQueryId = getUuid();
    }
    project.impGeofootprintMasters[0].impGeofootprintLocations.forEach(l => {
      l.impGeofootprintTradeAreas.forEach(ta => {
        if (ta.taType.toLowerCase() === TradeAreaTypeCodes.Custom.toLowerCase() && params.fitTo === FitTo.TA) {
          params.fitTo = FitTo.GEOS; //if the project has any custom trade areas we must fit to geos
          this.logService.warn.log('Project has cutsom trade areas, but selected fit to TA, forcing fit to geos instead');
        }
      });
    });
    if (params.currentView)
       return  this.zoomToCurrentView(project, params);
    else if (params.groupByAttribute != null)
      return this.mapByAttribute(project, siteNum, params);
    else if (!params.singlePage)
      return this.moveToSite(project, siteNum, params);
    else
      return this.showAllSites(project, params);
  }

  mapByAttribute(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    const groupedSites: Map<string, Array<ImpGeofootprintLocation>> = this.groupLocationsByAttribute(project, params);
    const attrArray: Array<string> = Array.from(groupedSites.keys()).sort();
    const sitesToMap = groupedSites.get(attrArray[siteNum]);
    const last: boolean = Number(siteNum) === attrArray.length - 1;
    const nextSite = last === true ? siteNum : Number(siteNum) + 1;
    const result = { siteNum: nextSite.toString(), isLastSite: last };
    const activeSiteIds: Set<string> = new Set<string>();
    sitesToMap.forEach(s => activeSiteIds.add(s.locationNumber));
    if (params.hideNeighboringSites) {
      project.getImpGeofootprintLocations().forEach(l => {
        if (!activeSiteIds.has(l.locationNumber)) {
          l.impGeofootprintTradeAreas.forEach(t => t.isActive = false);
        } else {
          l.impGeofootprintTradeAreas.forEach(t => t.isActive = this.originalTradeAreaState[t.gtaId]);
          l.getImpGeofootprintGeos().forEach(g => g.isActive = this.originalGeoState[g.ggId]);
        }
      });
      this.store$.dispatch(new RenderLocations({ locations: sitesToMap }));
      this.store$.dispatch(new RenderTradeAreas( { tradeAreas: project.getImpGeofootprintTradeAreas().filter(ta => ta.isActive) }));
    }
    if (!params.shadeNeighboringSites) {
      project.getImpGeofootprintLocations().forEach(l => {
        if (!activeSiteIds.has(l.locationNumber)) {
          l.getImpGeofootprintGeos().forEach(g => g.isActive = false);
        } else {
          l.getImpGeofootprintGeos().forEach(g => g.isActive = this.originalGeoState[g.ggId]);
        }
      });
      this.store$.dispatch(new RenderTradeAreas( { tradeAreas: project.getImpGeofootprintTradeAreas().filter(ta => ta.isActive) }));
    }
    const geosToMap = sitesToMap.reduce((p, c) => {
      return p.concat(c.getImpGeofootprintGeos());
    }, [] as ImpGeofootprintGeo[]);
    this.geoService.update(null, null);
    this.forceMapUpdate();
    return this.setMapLocation(geosToMap, params, sitesToMap, project).pipe(
      map(() => result)
    );
  }

  private groupLocationsByAttribute(project: ImpProject, params: BatchMapQueryParams) : Map<string, Array<ImpGeofootprintLocation>>{
    let groupedSites: Map<string, Array<ImpGeofootprintLocation>>;
    if (project.getImpGeofootprintLocations()[0].hasOwnProperty(params.groupByAttribute)) {
      groupedSites = groupByExtended(project.getImpGeofootprintLocations(), item => item[params.groupByAttribute]);
    } else {
      groupedSites = groupByExtended(project.getImpGeofootprintLocations(), item => {
        let key: string = null;
        item.impGeofootprintLocAttribs.forEach(a => {
          if (a.attributeCode === params.groupByAttribute) {
            key = a.attributeValue;
          }
        });
        return key;
      });
    }
    return groupedSites;
  }

  showAllSites(project: ImpProject, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    const locations = [ ...project.getImpGeofootprintLocations()
      .filter(l => ImpClientLocationTypeCodes.parse(l.clientLocationTypeCode) === ImpClientLocationTypeCodes.Site) ];
    locations.sort(ValSort.LocationBySiteNum);
    const currentGeos = project.getImpGeofootprintGeos().filter(geo => geo.impGeofootprintLocation.isActive);
    const result = { siteNum: locations[locations.length - 1].locationNumber, isLastSite: true };
    return this.setMapLocation(currentGeos, params, locations, project).pipe(
      map(() => result)
    );
  }

  zoomToCurrentView(project: ImpProject, params: BatchMapQueryParams){
    const locations = [ ...project.getImpGeofootprintLocations()
      .filter(l => ImpClientLocationTypeCodes.parse(l.clientLocationTypeCode) === ImpClientLocationTypeCodes.Site) ];
    locations.sort(ValSort.LocationBySiteNum);
    const extent: ExtentPayload = {
      spatialReference: {
        wkid : 102100
      },
      xmin: Number(params.xmin),
      ymin: Number(params.ymin),
      xmax: Number(params.xmax),
      ymax: Number(params.ymax)
    };
    this.esriMapService.mapView.extent = Extent.fromJSON(extent);
    // const coords = {x: Extent.fromJSON(extent).center.x, y: Extent.fromJSON(extent).center.y};
    // this.esriMapService.zoomToPoints([coords]);
    // this.esriMapService.zoomToPoints([this.esriMapService.mapView.extent.center]);
    this.esriMapService.mapView.zoom =  this.esriMapService.mapView.zoom + 1 ;
    return of({ siteNum: locations[locations.length - 1].locationNumber, isLastSite: true });
  }

  moveToSite(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    const locations = [ ...project.getImpGeofootprintLocations()
      .filter(l => ImpClientLocationTypeCodes.parse(l.clientLocationTypeCode) === ImpClientLocationTypeCodes.Site) ];
    const result = { siteNum: siteNum, isLastSite: true };
    locations.sort(ValSort.LocationBySiteNum);
    let currentGeosForZoom: ReadonlyArray<ImpGeofootprintGeo> = [];
    let currentSiteForZoom: ImpGeofootprintLocation;
    for (let i = 0; i < locations.length; ++i) {
      const currentSite = locations[i];
      let nextSiteNum: string = null;
      let nextSiteOffset = 1;
      while ((i + nextSiteOffset) < locations.length) {
        const nextSite = locations[i + nextSiteOffset];
        if (nextSite.isActive) {
          nextSiteNum = nextSite.locationNumber;
          break;
        } else {
          nextSiteOffset++;
        }
      }
      if (currentSite.locationNumber === siteNum || (siteNum == null && i === 0)) {
        result.siteNum = nextSiteNum || '';
        result.isLastSite = nextSiteNum == null;
        this.processCurrentSite(currentSite, params);
        currentSiteForZoom = currentSite;
        currentGeosForZoom = currentSite.getImpGeofootprintGeos();
        if (params.hideNeighboringSites) {
          const renderLocs = project.getImpGeofootprintLocations()
            .filter(loc => ImpClientLocationTypeCodes.parse(loc.clientLocationTypeCode) === ImpClientLocationTypeCodes.Competitor);
          renderLocs.push(currentSite);
          this.store$.dispatch(new RenderLocations({ locations: renderLocs }));
          this.store$.dispatch(new RenderTradeAreas( { tradeAreas: currentSite.impGeofootprintTradeAreas.filter(ta => ta.isActive) }));
        }
        this.store$.dispatch(new SetCurrentSiteNum({ currentSiteNum: currentSite.locationNumber }));
      } else {
        this.processOtherSite(currentSite, params);
      }
    }
    if (currentSiteForZoom == null) { // no current site was found, i.e. we're at the end of the list
      return of(result);
    } else {
      this.geoService.update(null, null);
      this.forceMapUpdate();
      return this.setMapLocation(currentGeosForZoom, params, [currentSiteForZoom], project).pipe(
        map(() => result)
      );
    }
  }

  private processCurrentSite(site: ImpGeofootprintLocation, params: BatchMapQueryParams) : void {
    const currentGeos = site.getImpGeofootprintGeos();
    site.impGeofootprintTradeAreas.forEach(ta => ta.isActive = this.originalTradeAreaState[ta.gtaId]);
    if (params.duplicated) {
      currentGeos.forEach(geo => geo.isActive = this.originalGeoState[geo.ggId]);
    } else {
      currentGeos.forEach(g => {
        if (g.isDeduped === 1) {
          g.isActive = this.originalGeoState[g.ggId];
        } else {
          g.isActive = false;
        }
      });
    }
  }

  private processOtherSite(site: ImpGeofootprintLocation, params: BatchMapQueryParams) : void {
    const currentGeos = site.getImpGeofootprintGeos();
    if (params.hideNeighboringSites) {
      site.impGeofootprintTradeAreas.forEach(ta => ta.isActive = false);
      currentGeos.forEach(geo => geo.isActive = false);
    } else {
      site.impGeofootprintTradeAreas.forEach(ta => ta.isActive = this.originalTradeAreaState[ta.gtaId]);
      if (params.shadeNeighboringSites) {
        currentGeos.forEach(geo => geo.isActive = this.originalGeoState[geo.ggId]);
      } else {
        currentGeos.forEach(geo => geo.isActive = false);
      }
    }
  }

  private forceMapUpdate() {
    const timeout = 120000; // 2 minutes
    const mapReady$ = this.esriMapService.watchMapViewProperty('updating').pipe(
      debounceTime(500),
      map(result => result.newValue),
      filter(result => !result),
    );

    const timeout$ = timer(timeout).pipe(
      map(() => false)
    );

    race(mapReady$, timeout$).pipe(
      take(1)
      ).subscribe(() => this.store$.dispatch(new SetMapReady({ mapReady: true })));
  }

  private recordOriginalState(project: ImpProject) : void {
    const currentGeos = project.getImpGeofootprintGeos();
    const currentTradeAreas = project.getImpGeofootprintTradeAreas();
    this.originalGeoState = {};
    this.originalTradeAreaState = {};
    currentGeos.forEach(geo => {
      this.originalGeoState[geo.ggId] = geo.isActive;
    });
    currentTradeAreas.forEach(ta => {
      this.originalTradeAreaState[ta.gtaId] = ta.isActive;
    });
  }

  private setMapLocation(geos: ReadonlyArray<ImpGeofootprintGeo>, params: BatchMapQueryParams, sites: ImpGeofootprintLocation[], project: ImpProject) : Observable<void> {
    console.log('Inside setMapLocation', params);
    let polyObservable: Observable<__esri.Graphic[]> = of(null);
    switch (params.fitTo) {
      case FitTo.GEOS:
        polyObservable = this.polysFromGeos(project.methAnalysis, geos, sites.map(s => [s.xcoord, s.ycoord]));
        break;
      case FitTo.TA:
        polyObservable = this.polysFromRadii(sites.map(s => s.locationNumber), project);
        break;
    }
    return polyObservable.pipe(
      switchMap(polys => polys != null && polys.length > 0 ? this.esriMapService.zoomToPolys(polys, params.buffer / 100) : of(null))
    );
  }

  private polysFromGeos(analysisLevel: string, geos: ReadonlyArray<ImpGeofootprintGeo>, additionalPoints: [number, number][]) : Observable<__esri.Graphic[]> {
    const activeGeos: Set<string> = new Set();
    geos.forEach(g => {
      if (g.isActive)
        activeGeos.add(g.geocode);
    });
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel, true, true);
    if (activeGeos.size > 0) {
      return this.esriQueryService.queryAttributeIn(layerId, 'geocode', Array.from(activeGeos), false, ['geocode', 'latitude', 'longitude', 'areasquaremiles'], this.geoQueryId).pipe(
        map(graphics => {
          const points: number[][] = [];
          let largestArea = 0;
          graphics.forEach(g => {
            points.push([g.getAttribute('longitude'), g.getAttribute('latitude')]);
            if (g.getAttribute('areasquaremiles') > largestArea)
              largestArea = g.getAttribute('areasquaremiles');
          });
          additionalPoints.forEach(p => points.push(p));
          const multipoint = this.esriMapService.multipointFromPoints(points);
          const bufferedPoly = this.esriMapService.bufferExtent(multipoint.extent, Math.sqrt(largestArea) / 2);
          return [this.esriMapService.graphicFromPolygon(bufferedPoly)];
        })
      );
    } else {
      return of([]);
    }
  }

  private polysFromRadii(siteNums: Array<string>, project: ImpProject) : Observable<__esri.Graphic[]> {
    const siteNumsSet: Set<string> = new Set(siteNums);
    const circles = project.getImpGeofootprintLocations().reduce((a, c) => {
      if (siteNumsSet.has(c.locationNumber) && c.clientLocationTypeCode === ImpClientLocationTypeCodes.Site) {
        const radii = c.impGeofootprintTradeAreas.filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius).map(ta => ta.taRadius);
        if (radii.length > 0) {
          const largestRadius = Math.max(...radii);
          const circle = this.esriMapService.createCircleGraphic(c.xcoord, c.ycoord, largestRadius);
          a.push(circle);
        }
      }
      return a;
    }, [] as __esri.Graphic[]);
    return of(circles);
  }
}
