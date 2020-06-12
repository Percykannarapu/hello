import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, groupBy, mapArray } from '@val/common';
import { BasicLayerSetup, EsriBoundaryService, EsriMapService, EsriService, InitialEsriState } from '@val/esri';
import { ErrorNotification, StopBusyIndicator, SuccessNotification, WarningNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpProjectVarService } from 'app/val-modules/targeting/services/ImpProjectVar.service';
import { Extent } from 'esri/geometry';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { RehydrateAudiences } from '../impower-datastore/state/transient/audience/audience.actions';
import { GeoAttribute } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { ProjectFilterChanged } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
import { LayerSetupComplete } from '../state/data-shim/data-shim.actions';
import { ClearTradeAreas } from '../state/rendering/rendering.actions';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppGeoService } from './app-geo.service';
import { AppLayerService } from './app-layer.service';
import { AppLocationService } from './app-location.service';
import { AppLoggingService } from './app-logging.service';
import { ValMetricsService } from './app-metrics.service';
import { AppProjectService } from './app-project.service';
import { AppRendererService } from './app-renderer.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { BoundaryRenderingService } from './boundary-rendering.service';
import { PoiRenderingService } from './poi-rendering.service';
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
              private poiRenderingService: PoiRenderingService,
              private boundaryRenderingService: BoundaryRenderingService,
              private esriService: EsriService,
              private esriBoundaryService: EsriBoundaryService,
              private appConfig: AppConfig,
              private store$: Store<FullAppState>,
              private logger: AppLoggingService,
              private mapService: EsriMapService,
              private impProjVarService: ImpProjectVarService,
              private impGeofootprintLocationService: ImpGeofootprintLocationService) {
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

  load(id: number) : Observable<string> {
    this.clearAll();
    return this.appProjectService.load(id).pipe(
      tap(project => this.onLoad(project)),
      switchMap(project => this.setupEsriInitialState(project)),
      tap(() => this.dispatchPostLoadActions()),
      map(project => project.methAnalysis)
    );
  }

  updateProjectWithId(id: number) : void {
    this.appProjectService.updateProjectId(id);
  }

  private onLoad(project: ImpProject) : void {
    this.processCustomVarPks(project);
  }

  private dispatchPostLoadActions() : void {
    this.store$.dispatch(new LayerSetupComplete());
    this.store$.dispatch(new RehydrateAudiences());
  }

  private processCustomVarPks(project: ImpProject) : void {
    const maxVarPk = (project.impProjectVars || []).reduce((result, projectVar) => {
      const sourceParts = projectVar.source.split('_');
      if (sourceParts.length > 0 && (sourceParts[0].toLowerCase() === 'combined' || sourceParts[0].toLowerCase() === 'converted' ||
                                     sourceParts[0].toLowerCase() === 'combined/converted' || sourceParts[0].toLowerCase() === 'custom')) {
        return Math.max(projectVar.varPk, result);
      } else {
        return result;
      }
    }, 0);
    this.impProjVarService.currStoreId = maxVarPk + 1;
  }

  private setupEsriInitialState(project: ImpProject) : Observable<ImpProject> {
    const geocodes = new Set(project.getImpGeofootprintGeos().reduce((p, c) => {
      if (c.impGeofootprintLocation.isActive && c.impGeofootprintTradeArea.isActive && c.isActive) p.push(c.geocode);
      return p;
    }, [] as string[]));
    const sortedGeocodes = Array.from(geocodes);
    sortedGeocodes.sort();
    const state: InitialEsriState = {
      shading: {
        featuresOfInterest: sortedGeocodes
      }
    };
    const shadingDefinitions = this.appRendererService.getShadingDefinitions(project);
    const poiConfigurations = this.poiRenderingService.getConfigurations(project);
    const boundaryConfigurations = this.boundaryRenderingService.getConfigurations(project);
    shadingDefinitions.forEach(sd => {
      // just in case stuff was saved with a destination id
      delete sd.destinationLayerUniqueId;
      sd.refreshLegendOnRedraw = this.appConfig.isBatchMode;
      if (this.appConfig.isBatchMode) {
        const newLayerSetup = this.getLayerSetupInfo(sd.sourcePortalId);
        if (newLayerSetup != null) {
          sd.sourcePortalId = newLayerSetup.simplifiedBoundary || newLayerSetup.boundary;
          sd.minScale = newLayerSetup.batchMinScale || newLayerSetup.minScale;
        }
      }
    });
    boundaryConfigurations.forEach(bc => {
      // just in case stuff was saved with a destination id
      bc.destinationBoundaryId = undefined;
      bc.destinationCentroidId = undefined;
      bc.useSimplifiedInfo = this.appConfig.isBatchMode;
    });
    poiConfigurations.forEach(pc => {
      pc.featureLayerId = undefined;
      pc.refreshLegendOnRedraw = this.appConfig.isBatchMode;
    });
    this.esriService.loadInitialState(state, shadingDefinitions, poiConfigurations, boundaryConfigurations);
    const savedBasemap = (project.impProjectPrefs || []).filter(pref => pref.pref === 'basemap')[0];
    if (savedBasemap != null && (savedBasemap.largeVal != null || savedBasemap.val != null)) {
      const parsedJson = JSON.parse(savedBasemap.largeVal || savedBasemap.val);
      this.esriService.setBasemap(parsedJson);
    } else {
      this.esriService.setBasemap('streets-vector');
    }
    return this.esriBoundaryService.allLoadedBoundaryConfigs$.pipe(
      withLatestFrom(this.esriBoundaryService.allVisibleBoundaryConfigs$),
      filter(([loaded, visible]) => loaded.length === visible.length),
      take(1),
      map(() => project)
    );
  }

  onLoadSuccess(isBatch: boolean) : void {
    this.impGeofootprintGeoService.uploadFailures = [];
    this.appTradeAreaService.setCurrentDefaults();
    this.appGeoService.reloadMustCovers();
    if (!isBatch) {
      const project: ImpProject = this.appStateService.currentProject$.getValue();
      const extent = (project.impProjectPrefs || []).filter(pref => pref.pref === 'extent')[0];
      if (extent != null) {
        const parsedJson = JSON.parse(extent.largeVal || extent.val);
        this.mapService.mapView.extent = Extent.fromJSON(parsedJson);
      } else {
        this.appTradeAreaService.zoomToTradeArea();
      }
    }
  }

  onLoadFinished() : void {

  }

  createNew() : number {
    this.clearAll();
    const projectId = this.appProjectService.createNew();
    this.esriService.loadInitialState({}, [], this.poiRenderingService.getConfigurations(), this.boundaryRenderingService.getConfigurations());
    this.store$.dispatch(new LayerSetupComplete());
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
    this.targetAudienceService.clearAll();
    this.appLayerService.clearClientLayers();
    this.appStateService.clearUserInterface();
    this.store$.dispatch(new ClearTradeAreas());
  }

  calcMetrics(geocodes: string[], attribute: { [geocode: string] : GeoAttribute }, project: ImpProject) : void {
    const result = this.metricService.updateDefinitions(attribute, geocodes, project);
    this.metricService.onMetricsChanged(result);
  }

  prepGeoFields(geos: ImpGeofootprintGeo[], attributes: { [geocode: string] : GeoAttribute }, project: ImpProject) : void {
    const hhcField = project.impGeofootprintMasters[0].methSeason === 'S' ? 'hhld_s' : 'hhld_w';
    geos.forEach(geo => {
      const currentAttr = attributes[geo.geocode];
      if (currentAttr != null) geo.hhc = Number(currentAttr[hhcField]);
    });
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

  persistMustCoverRollDownGeos(payLoad: any[], fileName: string, failedGeos: any[]){
   return this.impGeofootprintGeoService.persistMustCoverRollDownGeos(payLoad, failedGeos,  fileName);
  }

  rollDownComplete(isResubmit: boolean, resubmitGeo: string[], rollDownType: string){
    this.appGeoService.selectAndPersistHomeGeos(this.impGeofootprintLocationService.get(), this.appStateService.analysisLevel$.getValue(), this.appStateService.season$.getValue());
    let uploadFailures: string[];
    let titleText: string;
    if (rollDownType === 'TRADEAREA'){
       uploadFailures =  this.appTradeAreaService.uploadFailures.map(geo => geo.geocode);
       titleText = isResubmit ? 'Custom TA Resubmit' : 'Custom TA Upload';
       this.store$.dispatch(new StopBusyIndicator({ key : 'CUSTOM_TRADEAREA' }));
    }
    if (rollDownType === 'MUSTCOVER'){
      uploadFailures =  this.impGeofootprintGeoService.uploadFailures.map(geo => geo.geocode);
       titleText = isResubmit ? 'Must Cover Resubmit' : 'Must Cover Upload';
    }

    if (isResubmit && new Set(uploadFailures).has(resubmitGeo[0])){
      this.store$.dispatch(new ErrorNotification({ message: 'The resubmitted geocode is not valid, please try again', notificationTitle: titleText}));
    }
    else if (!isResubmit && uploadFailures.length > 0){
      this.store$.dispatch(new WarningNotification({ message: 'The upload file contains invalid geocodes, please refer to the failure grid for a list.', notificationTitle: titleText }));
      this.store$.dispatch(new SuccessNotification({ message: 'Completed', notificationTitle: titleText}));
    }
    else
      this.store$.dispatch(new SuccessNotification({ message: 'Completed', notificationTitle: titleText}));
  }

  private getLayerSetupInfo(currentBoundaryId: string) : BasicLayerSetup {
    try {
      const dataKey = this.boundaryRenderingService.getDataKeyByBoundaryLayerId(currentBoundaryId);
      return this.boundaryRenderingService.getLayerSetupInfo(dataKey);
    } catch (e) {
      this.logger.error.log(e);
    }
    return null;
  }

}
