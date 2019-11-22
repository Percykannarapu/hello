import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, groupBy, mapArray } from '@val/common';
import { EsriService, InitialEsriState } from '@val/esri';
import { ErrorNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AllColorPalettes } from '../../../../modules/esri/src/models/color-palettes';
import { GeoAttribute } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { ProjectFilterChanged } from '../models/ui-enums';
import { LocalAppState } from '../state/app.interfaces';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppGeoService } from './app-geo.service';
import { AppLayerService } from './app-layer.service';
import { AppLocationService } from './app-location.service';
import { ValMetricsService } from './app-metrics.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppProjectService } from './app-project.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { TargetAudienceCustomService } from './target-audience-custom.service';
import { TargetAudienceService } from './target-audience.service';
import { ImpProjectVarService } from 'app/val-modules/targeting/services/ImpProjectVar.service';

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
              private appPrefService: AppProjectPrefService,
              private appLocationService: AppLocationService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private appStateService: AppStateService,
              private appLayerService: AppLayerService,
              private targetAudienceService: TargetAudienceService,
              private targetAudienceCustomService: TargetAudienceCustomService,
              private metricService: ValMetricsService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private esriService: EsriService,
              private store$: Store<LocalAppState>,
              private impProjVarService: ImpProjectVarService) {
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
    this.appLayerService.clearClientLayers();
    this.appStateService.clearUserInterface();
    return this.appProjectService.load(id).pipe(
      tap(project => {
        const paletteKey = this.appPrefService.getPrefVal('Theme');
        const mappedAudienceCount = project.impProjectVars.filter(pv => pv.isShadedOnMap).length;
        const varPks = (project.impProjectVars || []).filter(pv => {
          const sourceParts = pv.source.split('_');
          return sourceParts.length > 0 && (sourceParts[0].toLowerCase() === 'combined' || sourceParts[0].toLowerCase() === 'custom');
        }).map(pv => pv.varPk);
        const varWithMaxId = Math.max(...varPks);
        this.impProjVarService.currStoreId = varWithMaxId + 1; // reset dataStore counter on load
        const state: InitialEsriState = {
          shading: {
            isShaded: mappedAudienceCount > 0
          }
        };
        if (paletteKey != null) state.shading.theme = AllColorPalettes[paletteKey];
        this.esriService.loadInitialState(state);
      }),
      map(project => project.projectId)
    );
  }

  onLoadSuccess(isBatch: boolean) : void {
    this.appTradeAreaService.setCurrentDefaults();
    if (!isBatch) {
      this.appTradeAreaService.zoomToTradeArea();
    }
    /**recalculating mustcovers disabled for DE2271 */
    this.appGeoService.reloadMustCovers();
    this.appLayerService.updateLabelExpressions(false, isBatch);
  }

  onLoadFinished() : void {
    //this.targetAudienceService.applyAudienceSelection();
  }

  createNew() : number {
    this.clearAll();
    this.targetAudienceService.clearAll();
    this.appLayerService.clearClientLayers();
    this.appStateService.clearUserInterface();
    this.esriService.loadInitialState({});
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

  isProjectReload(isReload: boolean){
    //clean mustcover failure grid
    if (!isReload)
        this.impGeofootprintGeoService.uploadFailures = [];
  }
}
