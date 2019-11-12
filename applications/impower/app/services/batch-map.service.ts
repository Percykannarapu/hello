import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, expandRange } from '@val/common';
import { EsriMapService, EsriQueryService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { SetCurrentSiteNum, SetMapReady } from 'app/state/batch-map/batch-map.actions';
import { Observable, race, timer } from 'rxjs';
import { debounceTime, filter, map, reduce, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { getMapAudienceIsFetching } from '../impower-datastore/state/transient/audience/audience.selectors';
import { BatchMapPayload, LocalAppState } from '../state/app.interfaces';
import { getBatchMapReady } from '../state/batch-map/batch-map.selectors';
import { ProjectLoad } from '../state/data-shim/data-shim.actions';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppMapService } from './app-map.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class BatchMapService {

  private originalGeoState: Record<number, boolean> = null;
  readonly printUrl: string = 'v1/impower/business/print';

  constructor(private geoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService,
              private esriQueryService: EsriQueryService,
              private config: AppConfig,
              private appStateService: AppStateService,
              private appMapService: AppMapService,
              private restService: RestDataService,
              private store$: Store<LocalAppState>) { }

  initBatchMapping(projectId: number) : void {
    this.appStateService.notifyMapReady();

    this.esriMapService.watchMapViewProperty('updating').pipe(
      debounceTime(1000),
      withLatestFrom(this.store$.select(getMapAudienceIsFetching)),
      map(([result, isFetching]) => !isFetching && !result.newValue)
    ).subscribe(ready => this.store$.dispatch(new SetMapReady({ mapReady: ready })));


    this.esriMapService.watchMapViewProperty('stationary').pipe(
      filter(result => result.newValue),
    ).subscribe(() => this.appStateService.refreshVisibleGeos());
    this.appMapService.setupMap(true);
    this.store$.select(getBatchMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.store$.dispatch(new ProjectLoad({ projectId, isReload: false })));
  }

  requestBatchMap(payload: BatchMapPayload) : Observable<any> {
    return this.restService.post(this.printUrl, payload);
  }

  validateProjectReadiness(project: ImpProject) : boolean {
    const notificationTitle = 'Batch Map Issue';
    const projectNotSaved = 'The project must be saved before you can generate a batch map.';
    const tooManySites = 'Batch Maps can only be generated for projects with 100 sites or less.';
    let result = true;
    if (project.projectId == null) {
      this.store$.dispatch(new ErrorNotification({ message: projectNotSaved, notificationTitle }));
      result = false;
    }
    if (project.getImpGeofootprintLocations().length > 100) {
      this.store$.dispatch(new ErrorNotification({ message: tooManySites, notificationTitle }));
      result = false;
    }
    return result;
  }

  moveToSite(project: ImpProject, siteNum: string) : Observable<{ siteNum: string, isLastSite: boolean }> {
    if (this.originalGeoState == null) {
      this.recordOriginalState(project);
    }
    const locations = [ ...project.getImpGeofootprintLocations()];
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
        this.store$.dispatch(new SetCurrentSiteNum({ currentSiteNum: currentSite.locationNumber }));
      } else {
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
    const mapReady$ = this.esriMapService.watchMapViewProperty('updating').pipe(
      debounceTime(500),
      map(result => result.newValue),
      filter(result => !result),
    );

    const timeout$ = timer(180000).pipe(
      map(() => false)
    ); // 3 minutes

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

  private setMapLocation(analysisLevel: string, geos: ReadonlyArray<ImpGeofootprintGeo>) : Observable<void> {
    const activeGeos = geos.filter(g => g.isActive);
    const geocodes = activeGeos.map(g => g.geocode);
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    return this.esriQueryService.queryAttributeIn(layerId, 'geocode', geocodes, true).pipe(
      reduce((a, c) => [...a, ...c], []),
      switchMap((polys) => {
        let xStats = calculateStatistics(polys.reduce((p, c) => {
          p.push(c.geometry.extent.xmax, c.geometry.extent.xmin);
          return p;
        }, []));
        let yStats = calculateStatistics(polys.reduce((p, c) => {
          p.push(c.geometry.extent.ymax, c.geometry.extent.ymin);
          return p;
        }, []));
        xStats = expandRange(xStats, xStats.distance * 0.1);
        yStats = expandRange(yStats, yStats.distance * 0.1);
        const polyCount = activeGeos.length > 0 ? activeGeos.length + 1 : 0;
        return this.esriMapService.zoomOnMap(xStats, yStats, polyCount);
      })
    );
  }
}
