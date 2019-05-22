import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, groupBy, mapArray } from '@val/common';
import { ErrorNotification } from '@val/messaging';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeoAttribute } from '../impower-datastore/state/geo-attributes/geo-attributes.model';
import { ProjectFilterChanged } from '../models/ui-enums';
import { LocalAppState } from '../state/app.interfaces';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppGeoService } from './app-geo.service';
import { AppLocationService } from './app-location.service';
import { ValMetricsService } from './app-metrics.service';
import { AppProjectService } from './app-project.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { TargetAudienceCustomService } from './target-audience-custom.service';
import { TargetAudienceService } from './target-audience.service';
import { AppLayerService } from './app-layer.service';

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
              private appLayerService: AppLayerService,
              private targetAudienceService: TargetAudienceService,
              private targetAudienceCustomService: TargetAudienceCustomService,
              private metricService: ValMetricsService,
              private store$: Store<LocalAppState>) {
    this.currentProject$ = this.appProjectService.currentProject$;
    this.currentGeos$ = this.appGeoService.currentGeos$;
    this.currentGeocodeSet$ = this.appStateService.uniqueIdentifiedGeocodes$.pipe(
      map(geos => new Set(geos))
    );
    this.currentActiveGeocodeSet$ = this.appStateService.uniqueSelectedGeocodes$.pipe(
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
    this.appTradeAreaService.setCurrentDefaults();
    this.appTradeAreaService.zoomToTradeArea();
    /**recalculating mustcovers disabled for DE2271 */
    this.appGeoService.reloadMustCovers();
    this.targetAudienceCustomService.reloadCustomVars();
    this.appLayerService.updateLabelExpressions(false);
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

  filterGeos(geos: ImpGeofootprintGeo[], geoAttributes: { [geocode: string] : GeoAttribute }, currentProject: ImpProject, filterType?: ProjectFilterChanged) : void {
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
        let ignore: boolean = (filterType != null);
        let state: boolean;
        switch (currentAttribute['owner_group_primary']) {
          case 'VALASSIS':
            if (filterType === ProjectFilterChanged.Valassis) ignore = false;
            if (!includeValassis) filterReasons.push('VALASSIS');
            state = includeValassis;
            break;
          case 'ANNE':
            if (filterType === ProjectFilterChanged.Anne) ignore = false;
            if (!includeAnne) filterReasons.push('ANNE');
            state = includeAnne;
            break;
          default:
            state = true;
        }
        if (currentAttribute['cov_frequency'] === 'Solo') {
          if (filterType === ProjectFilterChanged.Solo) ignore = false;
          if (!includeSolo) filterReasons.push('SOLO');
          state = state && includeSolo;
        }
        if (currentAttribute['pob'] === 'B') {
          if (filterType === ProjectFilterChanged.Pob) ignore = false;
          if (!includePob) filterReasons.push('POB');
          state = state && includePob;
        }
        if (!ignore) {
          currentGeos.forEach(g => {
            g.isActive = state && audiencePreSelected;
            g['filterReasons'] = state ? (audiencePreSelected ? null : 'Under Audience TA threshold') : `Filtered because: ${filterReasons.join(', ')}`;
          });
        }
      }
    });

    this.appGeoService.notify();
  }
}
