import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, groupBy, mapArray } from '@val/common';
import { clearFeaturesOfInterest, clearShadingDefinitions, ColorPalette, EsriService, InitialEsriState } from '@val/esri';
import { ErrorNotification, SuccessNotification, WarningNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpProjectVarService } from 'app/val-modules/targeting/services/ImpProjectVar.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { GeoAttribute } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { ProjectFilterChanged } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppGeoService } from './app-geo.service';
import { AppLayerService } from './app-layer.service';
import { AppLocationService } from './app-location.service';
import { ValMetricsService } from './app-metrics.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppProjectService } from './app-project.service';
import { AppRendererService } from './app-renderer.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { TargetAudienceCustomService } from './target-audience-custom.service';
import { TargetAudienceService } from './target-audience.service';

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
              private appRendererService: AppRendererService,
              private esriService: EsriService,
              private store$: Store<FullAppState>,
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
    this.store$.dispatch(clearFeaturesOfInterest());
    this.store$.dispatch(clearShadingDefinitions());
    return this.appProjectService.load(id).pipe(
      tap(project => this.onLoad(project)),
      map(project => project.projectId)
    );
  }

  private onLoad(project: ImpProject) : void {
    const maxVarPk = (project.impProjectVars || []).reduce((result, projectVar) => {
      const sourceParts = projectVar.source.split('_');
      if (sourceParts.length > 0 && (sourceParts[0].toLowerCase() === 'combined' || sourceParts[0].toLowerCase() === 'custom')) {
        return Math.max(projectVar.varPk, result);
      } else {
        return result;
      }
    }, -1);
    this.impProjVarService.currStoreId = maxVarPk + 1; // reset dataStore counter on load
    console.log('Data store seed', this.impProjVarService.currStoreId);
    const paletteKey = this.appPrefService.getPrefVal('Theme');
    const theme = ColorPalette[paletteKey];
    const geocodes = new Set(project.getImpGeofootprintGeos().map(g => g.geocode));
    const state: InitialEsriState = {
      shading: {
        featuresOfInterest: Array.from(geocodes),
        theme
      }
    };
    const shadingDefinitions = this.appRendererService.createShadingDefinitionsFromLegacy(project);
    this.esriService.loadInitialState(state, shadingDefinitions);
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
    const projectId = this.appProjectService.createNew();
    this.esriService.loadInitialState({}, []);
    return projectId;
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
    if (!isReload)
        this.impGeofootprintGeoService.uploadFailures = [];
  }

  persistMustCoverRollDownGeos(payLoad: any[], fileName: string, failedGeos: any[]){
     return this.impGeofootprintGeoService.persistMustCoverRollDownGeos(payLoad, failedGeos,  fileName);
  }

  rollDownComplete(isResubmit: boolean, resubmitGeo: string[], rollDownType: string){
    let uploadFailures: string[];
    let titleText: string;
    if (rollDownType === 'TRADEAREA'){
       uploadFailures =  this.appTradeAreaService.uploadFailures.map(geo => geo.geocode);
       titleText = isResubmit ? 'Custom TA Resubmit' : 'Custom TA Upload';
    }
    if (rollDownType === 'MUSTCOVER'){
      uploadFailures =  this.impGeofootprintGeoService.uploadFailures.map(geo => geo.geocode);
       titleText = isResubmit ? 'Must Cover Resubmit' : 'Must Cover Upload';
    }
    
    if (isResubmit && new Set(uploadFailures).has(resubmitGeo[0])){
      this.store$.dispatch(new ErrorNotification({ message: 'The resubmitted geocode is not valid, please try again', notificationTitle: titleText}));
    }
    else if (!isResubmit && uploadFailures.length > 0)
      this.store$.dispatch(new WarningNotification({ message: 'The upload file contains invalid geocodes, please refer to the failure grid for a list.', notificationTitle: titleText }));
    else
      this.store$.dispatch(new SuccessNotification({ message: 'Completed', notificationTitle: titleText}));
  }

}
