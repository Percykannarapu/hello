import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics } from '@val/common';
import { EsriMapService, EsriQueryService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { LocalAppState, BatchMapPayload } from '../state/app.interfaces';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { SetCurrentSiteNum } from 'app/state/batch-map/batch-map.actions';

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
              private restService: RestDataService,
              private store$: Store<LocalAppState>) { }

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
    return this.setMapLocation(project.methAnalysis, project.getImpGeofootprintGeos()).pipe(
      map(() => result)
    );
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
      switchMap((polys) => {
        const xStats = calculateStatistics(polys.reduce((p, c) => {
          p.push(c.geometry.extent.xmax, c.geometry.extent.xmin);
          return p;
        }, []));
        const yStats = calculateStatistics(polys.reduce((p, c) => {
          p.push(c.geometry.extent.ymax, c.geometry.extent.ymin);
          return p;
        }, []));
        xStats.min -= 0.01;
        xStats.max += 0.01;
        yStats.min -= 0.01;
        yStats.max += 0.01;
        const polyCount = activeGeos.length > 0 ? activeGeos.length + 1 : 0;
        return this.esriMapService.zoomOnMap(xStats, yStats, polyCount);
      })
    );
  }
}
