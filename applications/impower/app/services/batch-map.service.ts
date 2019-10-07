import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics } from '@val/common';
import { EsriMapService } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { Observable, throwError } from 'rxjs';
import { AppConfig } from '../app.config';
import { LocalAppState } from '../state/app.interfaces';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';

@Injectable({
  providedIn: 'root'
})
export class BatchMapService {

  private originalGeoState: Record<number, boolean> = null;
  readonly printUrl: string = 'v1/impower/business/print';


  constructor(private geoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService,
              private config: AppConfig,
              private restService: RestDataService,
              private store$: Store<LocalAppState>) { }

  requestBatchMap(project: ImpProject, email: string) : Observable<any> {
    const payload = {
      projectId: project.projectId
    };
    return this.restService.post(`${this.printUrl}?size=letter&orientation=landscape&email=${email}&projectId=${project.projectId}`, {});
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

  moveToSite(project: ImpProject, siteNum: string) : { siteNum: string, isLastSite: boolean } {
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
        this.setMapLocation(currentGeos);
      } else {
        currentGeos.forEach(g => g.isActive = false);
      }
    }
    this.geoService.update(null, null);
    return result;
  }

  private recordOriginalState(project: ImpProject) : void {
    const currentGeos = project.getImpGeofootprintGeos();
    this.originalGeoState = {};
    currentGeos.forEach(geo => {
      this.originalGeoState[geo.ggId] = geo.isActive;
    });
  }

  private setMapLocation(geos: ReadonlyArray<ImpGeofootprintGeo>) : void {
    const xStats = calculateStatistics(geos.filter(g => g.isActive).map(d => d.xcoord));
    const yStats = calculateStatistics(geos.filter(g => g.isActive).map(d => d.ycoord));
    this.esriMapService.zoomOnMap(xStats, yStats, geos.filter(g => g.isActive).length);
  }
}
