import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { groupByExtended } from '@val/common';
import { EsriMapService, EsriQueryService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { SetCurrentSiteNum, SetMapReady } from 'app/state/batch-map/batch-map.actions';
import { BatchMapQueryParams, FitTo } from 'app/state/shared/router.interfaces';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpClientLocationTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import { Observable, race, timer } from 'rxjs';
import { debounceTime, delay, filter, map, reduce, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { getMapAudienceIsFetching } from '../impower-datastore/state/transient/audience/audience.selectors';
import { ValSort } from '../models/valassis-sorters';
import { BatchMapPayload, LocalAppState, SinglePageBatchMapPayload } from '../state/app.interfaces';
import { getBatchMapReady } from '../state/batch-map/batch-map.selectors';
import { ProjectLoad } from '../state/data-shim/data-shim.actions';
import { RenderLocations, RenderTradeAreas } from '../state/rendering/rendering.actions';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppMapService } from './app-map.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class BatchMapService {

  private originalGeoState: Record<number, boolean> = null;

  constructor(private geoService: ImpGeofootprintGeoService,
              private locationService: ImpGeofootprintLocationService,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService,
              private config: AppConfig,
              private appStateService: AppStateService,
              private appMapService: AppMapService,
              private restService: RestDataService,
              private store$: Store<LocalAppState>,
              private appProjectPrefService: AppProjectPrefService,
              private http: HttpClient) { }

  initBatchMapping(projectId: number) : void {
    this.appStateService.notifyMapReady();

    this.esriMapService.watchMapViewProperty('updating').pipe(
      debounceTime(500),
      withLatestFrom(this.store$.select(getMapAudienceIsFetching)),
      map(([result, isFetching]) => !isFetching && !result.newValue)
    ).subscribe(ready => this.store$.dispatch(new SetMapReady({ mapReady: ready })));

    this.esriMapService.watchMapViewProperty('stationary').pipe(
      filter(result => result.newValue),
    ).subscribe(() => this.appStateService.refreshVisibleGeos());
    this.appMapService.setupMap(true);
    this.store$.select(getBatchMapReady).pipe(
      filter(ready => ready),
      take(1),
      delay(15000)
    ).subscribe(() => this.store$.dispatch(new ProjectLoad({ projectId, isBatchMode: true })));
  }

  requestBatchMap(payload: BatchMapPayload | SinglePageBatchMapPayload, project: ImpProject) : Observable<any> {
    if (payload.calls[0].args['printJobConfiguration'] != null) {
      const requestedSiteIds = new Set(payload.calls[0].args['printJobConfiguration'].siteIds);
      project.getImpGeofootprintLocations().forEach( l => {
      if ((l.clientLocationTypeCode === 'Failed Site' || l.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor) && requestedSiteIds.has(l.locationNumber))
        requestedSiteIds.delete(l.locationNumber); //we don't want to print failed sites
      });
      payload.calls[0].args['printJobConfiguration'].siteIds = Array.from(requestedSiteIds);
    }
    return this.http.put(this.config.printServiceUrl, payload);
  }

  validateProjectReadiness(project: ImpProject) : boolean {
    const notificationTitle = 'Batch Map Issue';
    const projectNotSaved = 'The project must be saved before you can generate a batch map.';
    const tooManySites = 'Batch Maps can only be generated for projects with 600 active sites or less.';
    let result = true;
    if (project.projectId == null) {
      this.store$.dispatch(new ErrorNotification({ message: projectNotSaved, notificationTitle }));
      result = false;
    }
    if (project.getImpGeofootprintLocations().filter(l => l.isActive && l.clientLocationTypeCode === ImpClientLocationTypeCodes.Site).length > 600) {
      this.store$.dispatch(new ErrorNotification({ message: tooManySites, notificationTitle }));
      result = false;
    }
    return result;
  }

  startBatchMaps(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    if (this.originalGeoState == null) {
      this.geoService.calculateGeoRanks();
      this.recordOriginalState(project);
    }
    if (params.groupByAttribute != null)
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
          l.isActive = false;
          l.impGeofootprintTradeAreas.forEach(t => t.isActive = false);
        } else {
          l.isActive = true;
          l.impGeofootprintTradeAreas.forEach(t => t.isActive = true);
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
    this.geoService.update(null, null);
    this.forceMapUpdate();
    return this.setMapLocation(project.methAnalysis, project.getImpGeofootprintGeos(), params, sitesToMap.map(s => s.locationNumber), project).pipe(
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
    const result = { siteNum: project.getImpGeofootprintLocations()[project.getImpGeofootprintLocations().length - 1].locationNumber, isLastSite: true };
    if (project.getImpGeofootprintGeos().length > 100)
      params.fitTo = FitTo.TA; //if we have too many geos we need to fit the map to the TA rings
    return this.setMapLocation(project.methAnalysis, project.getImpGeofootprintGeos(), params, project.getImpGeofootprintLocations().map(l => l.locationNumber), project).pipe(
      map(() => result)
    );
  }

  moveToSite(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    const locations = [ ...project.getImpGeofootprintLocations().filter(l => l.isActive) ];
    const result = { siteNum: siteNum, isLastSite: false };
    locations.sort(ValSort.LocationBySiteNum);
    for (let i = 0; i < locations.length; ++i) {
      const currentSite = locations[i];
      const currentGeos = currentSite.getImpGeofootprintGeos();
      const nextSiteNum = i + 1 < locations.length ? locations[i + 1].locationNumber : null;
      if (currentSite.locationNumber === siteNum || (siteNum == null && i === 0)) {
        result.siteNum = nextSiteNum || '';
        result.isLastSite = nextSiteNum == null;
        if (!params.duplicated) { // deduped map
          currentGeos.forEach(g => {
            if (g.isDeduped === 1) {
              g.isActive = this.originalGeoState[g.ggId];
            }
          });
        } else { // duplicated map
          currentGeos.forEach(g => g.isActive = true);
        }

        if (params.hideNeighboringSites) {
          this.store$.dispatch(new RenderLocations({ locations: [currentSite] }));
          this.store$.dispatch(new RenderTradeAreas( { tradeAreas: currentSite.impGeofootprintTradeAreas.filter(ta => ta.isActive) }));
        } else if (params.shadeNeighboringSites) {
          this.geoService.update(null, null);
          this.forceMapUpdate();
          return this.setMapLocation(project.methAnalysis, currentSite.getImpGeofootprintGeos(), params, [siteNum], project).pipe(
            map(() => result)
          );
        }
        this.store$.dispatch(new SetCurrentSiteNum({ currentSiteNum: currentSite.locationNumber }));
      } else if (!params.shadeNeighboringSites) {
        currentGeos.forEach(g => g.isActive = false);
      }
    }
    this.geoService.update(null, null);
    this.forceMapUpdate();
    return this.setMapLocation(project.methAnalysis, project.getImpGeofootprintGeos(), params, [siteNum], project).pipe(
      map(() => result)
    );
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
    this.originalGeoState = {};
    currentGeos.forEach(geo => {
      this.originalGeoState[geo.ggId] = geo.isActive;
    });
  }

  private setMapLocation(analysisLevel: string, geos: ReadonlyArray<ImpGeofootprintGeo>, params: BatchMapQueryParams, siteNums: Array<string>, project: ImpProject) : Observable<void> {
    if (params.fitTo === FitTo.GEOS) {
      const activeGeos = geos.filter(g => g.isActive);
      const geocodes = activeGeos.map(g => g.geocode);
      const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
      return this.esriQueryService.queryAttributeIn(layerId, 'geocode', geocodes, true).pipe(
        reduce((a, c) => [...a, ...c], []),
        switchMap((polys) => {
          return this.esriMapService.zoomToPolys(polys, params.buffer / 100);
        })
      );
    } else if (params.fitTo === FitTo.TA) {
      const siteNumsSet: Set<string> = new Set(siteNums);
      const circles = [];
      project.getImpGeofootprintLocations().forEach(l => {
        let largestRadius = 0;
        if (siteNumsSet.has(l.locationNumber)) {
          l.impGeofootprintTradeAreas.forEach(ta => {
            if (ta.taRadius > largestRadius)
              largestRadius = ta.taRadius;
          });
          const circle = this.esriMapService.createCircleGraphic(l.xcoord, l.ycoord, largestRadius);
          circles.push(circle);
        }
      });
      return this.esriMapService.zoomToPolys(circles, params.buffer / 100);
    }

  }
}
