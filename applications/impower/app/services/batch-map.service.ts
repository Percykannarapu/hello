import { Injectable } from '@angular/core';
import { calculateStatistics } from '@val/common';
import { EsriMapService } from '@val/esri';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';

@Injectable({
  providedIn: 'root'
})
export class BatchMapService {

  private originalGeoState: Record<number, boolean> = null;

  constructor(private geoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService) { }

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
