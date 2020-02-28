import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { groupByExtended, UniversalCoordinates, toUniversalCoordinates, groupBy } from '@val/common';
import { EsriMapService, EsriQueryService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { SetCurrentSiteNum, SetMapReady } from 'app/state/batch-map/batch-map.actions';
import { Observable, race, timer } from 'rxjs';
import { debounceTime, delay, filter, map, reduce, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { getMapAudienceIsFetching } from '../impower-datastore/state/transient/audience/audience.selectors';
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
import { BatchMapQueryParams } from 'app/state/shared/router.interfaces';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from 'app/val-modules/targeting/models/ImpGeofootprintTradeArea';

@Injectable({
  providedIn: 'root'
})
export class BatchMapService {

  private originalGeoState: Record<number, boolean> = null;
  readonly printUrl: string = 'v1/impower/business/print';

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
    ).subscribe(() => this.store$.dispatch(new ProjectLoad({ projectId, isReload: false, isBatchMode: true })));
  }

  requestBatchMap(payload: BatchMapPayload | SinglePageBatchMapPayload) : Observable<any> {
    return this.http.put(this.config.printServiceUrl, payload);
  }

  validateProjectReadiness(project: ImpProject) : boolean {
    const notificationTitle = 'Batch Map Issue';
    const projectNotSaved = 'The project must be saved before you can generate a batch map.';
    const tooManySites = 'Batch Maps can only be generated for projects with 200 active sites or less.';
    let result = true;
    if (project.projectId == null) {
      this.store$.dispatch(new ErrorNotification({ message: projectNotSaved, notificationTitle }));
      result = false;
    }
    if (project.getImpGeofootprintLocations().filter(l => l.isActive).length > 200) {
      this.store$.dispatch(new ErrorNotification({ message: tooManySites, notificationTitle }));
      result = false;
    }
    return result;
  }

  startBatchMaps(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    if (params.groupByAttribute != null)
      return this.mapByAttribute(project, siteNum, params);
    else if (!params.singlePage)
      return this.moveToSite(project, siteNum, params);
    else
      return this.showAllSites(project);
  }

  mapByAttribute(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    if (this.originalGeoState == null) {
      this.recordOriginalState(project);
    }
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
    const attrArray = Array.from(groupedSites.keys());
    const sitesToMap = groupedSites.get(attrArray[siteNum]);
    const last: boolean = Number(siteNum) === attrArray.length - 1 ? true : false;
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
      this.store$.dispatch(new RenderLocations({ locations: sitesToMap, impProjectPrefs: this.appProjectPrefService.getPrefsByGroup('label') }));
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
    return this.esriMapService.zoomToPoints(toUniversalCoordinates(sitesToMap), .5).pipe(
      map(() => result)
    );
  }

  showAllSites(project: ImpProject) : Observable<{ siteNum: string, isLastSite: boolean }> {
    const result = { siteNum: project.getImpGeofootprintLocations()[project.getImpGeofootprintLocations().length - 1].locationNumber, isLastSite: true };
    if (project.getImpGeofootprintGeos().length > 100)
      return this.esriMapService.zoomToPoints(toUniversalCoordinates(project.getImpGeofootprintLocations().concat())).pipe(
        map(() => result)
      );
    else
      return this.setMapLocation(project.methAnalysis, project.getImpGeofootprintGeos()).pipe(
        map(() => result)
      );
  }

  moveToSite(project: ImpProject, siteNum: string, params: BatchMapQueryParams) : Observable<{ siteNum: string, isLastSite: boolean }> {
    if (this.originalGeoState == null) {
      this.recordOriginalState(project);
    }
    const locations = [ ...project.getImpGeofootprintLocations().filter(l => l.isActive) ];
    const result = { siteNum: siteNum, isLastSite: false };
    locations.sort((a, b) => a.locationNumber.localeCompare(b.locationNumber));
    for (let i = 0; i < locations.length; ++i) {
      const currentSite = locations[i];
      const currentGeos = currentSite.getImpGeofootprintGeos();
      const nextSiteNum = i + 1 < locations.length ? locations[i + 1].locationNumber : null;
      if (currentSite.locationNumber === siteNum || (siteNum == null && i === 0)) {
        result.siteNum = nextSiteNum || '';
        result.isLastSite = nextSiteNum == null;
        currentGeos.forEach(g => {
          g.isActive = this.originalGeoState[g.ggId];
        });
        if (params.hideNeighboringSites) {
          this.store$.dispatch(new RenderLocations({ locations: [currentSite], impProjectPrefs: this.appProjectPrefService.getPrefsByGroup('label') }));
          this.store$.dispatch(new RenderTradeAreas( { tradeAreas: currentSite.impGeofootprintTradeAreas.filter(ta => ta.isActive) }));
        } else if (params.shadeNeighboringSites) {
          this.geoService.update(null, null);
          this.forceMapUpdate();
          return this.setMapLocation(project.methAnalysis, currentSite.getImpGeofootprintGeos()).pipe(
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
    return this.setMapLocation(project.methAnalysis, project.getImpGeofootprintGeos()).pipe(
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
    const geosByGeocode = groupByExtended(currentGeos, g => g.geocode);
    // this is a hack to "dedupe" geos that are assigned to multiple sites
    geosByGeocode.forEach(commonGeos => {
      if (commonGeos.length > 1) {
        commonGeos.sort((a, b) => a.distance - b.distance);
        const originalState = commonGeos[0].isActive;
        commonGeos.forEach(g => g.isActive = false);
        commonGeos[0].isActive = originalState;
      }
    });
    // end hack
    this.originalGeoState = {};
    currentGeos.forEach(geo => {
      this.originalGeoState[geo.ggId] = geo.isActive;
    });
  }

  private setMapLocation(analysisLevel: string, geos: ReadonlyArray<ImpGeofootprintGeo>) : Observable<void> {
    const activeGeos = geos.filter(g => g.isActive);
    const geocodes = activeGeos.map(g => g.geocode);
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    return this.esriQueryService.queryAttributeIn(layerId, 'geocode', geocodes, true).pipe(
      reduce((a, c) => [...a, ...c], []),
      switchMap((polys) => {
        return this.esriMapService.zoomToPolys(polys);
      })
    );
  }
}
