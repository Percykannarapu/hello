import { Injectable } from '@angular/core';
import { filterArray, groupBy, mapArray } from '@val/common';
import { map } from 'rxjs/operators';
import { GeoAttribute } from '../impower-datastore/state/geo-attributes/geo-attributes.model';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { AppLocationService } from './app-location.service';
import { ValMetricsService } from './app-metrics.service';
import { AppProjectService } from './app-project.service';
import { TargetAudienceService } from './target-audience.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { AppGeoService } from './app-geo.service';
import { Observable } from 'rxjs';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { ErrorNotification } from '@val/messaging';
import { TargetAudienceCustomService } from './target-audience-custom.service';

/**
 * This service is a temporary shim to aggregate the operations needed for saving & loading data
 * until the data is held natively in NgRx and can be removed after that
 */

@Injectable({
  providedIn: 'root'
})
export class AppDataShimService {

  currentProject$: Observable<ImpProject>;
  currentGeocodeSet$: Observable<Set<string>>;
  currentActiveGeocodeSet$: Observable<Set<string>>;
  currentGeos$: Observable<ImpGeofootprintGeo[]>;

  currentHomeGeocodes$: Observable<Set<string>>;
  currentMustCovers$: Observable<Set<string>>;

  constructor(private appProjectService: AppProjectService,
              private appLocationService: AppLocationService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private appStateService: AppStateService,
              private targetAudienceService: TargetAudienceService,
              private targetAudienceCustomService: TargetAudienceCustomService,
              private metricService: ValMetricsService,
              private store$: Store<LocalAppState>) {
    this.currentProject$ = this.appProjectService.currentProject$;
    this.currentGeos$ = this.appGeoService.currentGeos$;
    this.currentGeocodeSet$ = this.currentGeos$.pipe(
      mapArray(geo => geo.geocode),
      map(geos => new Set(geos))
    );
    this.currentActiveGeocodeSet$ = this.currentGeos$.pipe(
      filterArray(geo => geo.isActive),
      mapArray(geo => geo.geocode),
      map(geos => new Set(geos))
    );
    this.currentHomeGeocodes$ = this.appLocationService.allClientLocations$.pipe(
      mapArray(loc => loc.homeGeocode),
      filterArray(geocode => geocode != null && geocode.length > 0),
      map(geos => new Set(geos))
    );
    this.currentMustCovers$ = this.appGeoService.allMustCovers$.pipe(
      map(geos => new Set(geos))
    );
  }

  save() : Observable<number> {
    return this.appProjectService.save();
  }

  load(id: number) : Observable<number> {
    this.clearAll();
    this.targetAudienceService.clearAll();
    this.appStateService.clearUserInterface();
    return this.appProjectService.load(id);
  }

  onLoadSuccess() : void {
    this.targetAudienceService.applyAudienceSelection();
    this.appTradeAreaService.zoomToTradeArea();
    this.appGeoService.reloadMustCovers();
    this.targetAudienceCustomService.reloadCustomVars();

  }

  createNew() : number {
    this.clearAll();
    this.targetAudienceService.clearAll();
    this.appStateService.clearUserInterface();
    return this.appProjectService.createNew();
  }

  validateProject(project: ImpProject) : boolean {
    const errors = this.appProjectService.validateProject(project);
    if (errors.length > 0) {
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Invalid Project', message: errors.join('\n') }));
      return false;
    }
    return true;
  }

  clearAll() : void {
    this.appProjectService.clearAll();
    this.appLocationService.clearAll();
    this.appTradeAreaService.clearAll();
    this.appGeoService.clearAll();
    this.appProjectService.finalizeClear();
  }

  calcMetrics(geocodes: string[], attribute: { [geocode: string] : GeoAttribute }, project: ImpProject) : void {
    const result = this.metricService.updateDefinitions(attribute, geocodes, project);
    this.metricService.onMetricsChanged(result);
  }

  prepGeoFields(geos: ImpGeofootprintGeo[], attributes: { [geocode: string] : GeoAttribute }, project: ImpProject) : Set<string> {
    const geocodes = new Set<string>();
    const hhcField = project.impGeofootprintMasters[0].methSeason === 'S' ? 'hhld_s' : 'hhld_w';
    geos.forEach(geo => {
      const currentAttr = attributes[geo.geocode];
      if (currentAttr != null) geo.hhc = Number(currentAttr[hhcField]);
      if (geo.isActive) geocodes.add(geo.geocode);
    });
    return geocodes;
  }

  filterGeos(geos: ImpGeofootprintGeo[], geoAttributes: { [geocode: string] : GeoAttribute }, currentProject: ImpProject) : void {
    if (currentProject == null || geoAttributes == null || geos == null || geos.length === 0) return;
    const includeValassis = currentProject.isIncludeValassis;
    const includeAnne = currentProject.isIncludeAnne;
    const includeSolo = currentProject.isIncludeSolo;
    const includePob = !currentProject.isExcludePob;
    const geosByGeocode: Map<string, ImpGeofootprintGeo[]> = groupBy(geos, 'geocode');

    geosByGeocode.forEach((currentGeos, geocode) => {
      const currentAttribute = geoAttributes[geocode];
      if (currentAttribute != null) {
        const audiencePreSelected = currentAttribute.hasOwnProperty('preSelectedForAudience') ? currentAttribute['preSelectedForAudience'] as boolean : true;
        const filterReasons: string[] = [];
        let state: boolean;
        switch (currentAttribute['owner_group_primary']) {
          case 'VALASSIS':
            if (!includeValassis) filterReasons.push('VALASSIS');
            state = includeValassis;
            break;
          case 'ANNE':
            if (!includeAnne) filterReasons.push('ANNE');
            state = includeAnne;
            break;
          default:
            state = true;
        }
        if (currentAttribute['cov_frequency'] === 'Solo') {
          if (!includeSolo) filterReasons.push('SOLO');
          state = state && includeSolo;
        }
        if (currentAttribute['pob'] === 'B') {
          if (!includePob) filterReasons.push('POB');
          state = state && includePob;
        }
        currentGeos.forEach(g => {
          g.isActive = state && audiencePreSelected;
          g['filterReasons'] = state ? (audiencePreSelected ? null : 'Under Audience TA threshold') : `Filtered because: ${filterReasons.join(', ')}`;
        });
      }
    });

    this.appGeoService.notify();
  }
}
