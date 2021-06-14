import { Injectable } from '@angular/core';
import Extent from '@arcgis/core/geometry/Extent';
import { Store } from '@ngrx/store';
import { CommonSort, filterArray, groupBy, isEmpty, isNotNil, mapArray, mapByExtended } from '@val/common';
import { BasicLayerSetup, EsriBoundaryService, EsriMapService, EsriService, InitialEsriState } from '@val/esri';
import { ErrorNotification, StopBusyIndicator, SuccessNotification, WarningNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { ProjectPrefGroupCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { LoadAudiences } from '../impower-datastore/state/transient/audience/audience.actions';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { GetLayerAttributes } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.actions';
import { GeoAttribute } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { clearTransientData } from '../impower-datastore/state/transient/transient.actions';
import { createExistingAudienceInstance } from '../models/audience-factories';
import { ProjectFilterChanged } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
import { LayerSetupComplete } from '../state/data-shim/data-shim.actions';
import { ClearTradeAreas } from '../state/rendering/rendering.actions';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
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
import { CustomDataService } from './custom-data.service';
import { PoiRenderingService } from './poi-rendering.service';
import { UnifiedAudienceService } from './unified-audience.service';

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
              private audienceService: UnifiedAudienceService,
              private customDataService: CustomDataService,
              private appStateService: AppStateService,
              private appLayerService: AppLayerService,
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
              private domainFactory: ImpDomainFactoryService,
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
    const audiences: Audience[] = [];
    const customAudiences: Audience[] = [];
    project.impProjectVars.forEach(pv => {
      if (isNotNil(pv) && pv.isActive) {
        const currentAudience = createExistingAudienceInstance(pv);
        if (isNotNil(currentAudience)) {
          audiences.push(currentAudience as Audience);
          if (currentAudience.audienceSourceType === 'Custom') customAudiences.push(currentAudience as Audience);
        } else {
          this.logger.warn.log('A project var could not be converted into an audience instance', pv);
        }
      }
    });
    if (!isEmpty(audiences)) {
      // sort and re-number the audiences to ensure we don't have any duplicates from old code
      audiences.sort((a, b) => CommonSort.GenericNumber(a.sortOrder, b.sortOrder)).forEach((v, i) => v.sortOrder = i);
      this.store$.dispatch(new LoadAudiences({ audiences }));
      if (!isEmpty(customAudiences)) {
        const customDataSourceNames = new Set<string>(customAudiences.map(a => a.audienceSourceName));
        const customDataPrefsToLoad = project.impProjectPrefs.filter(p => p.prefGroup === ProjectPrefGroupCodes.CustomVar && customDataSourceNames.has(p.pref));
        customDataPrefsToLoad.forEach(pref => {
          const currentAudiences = customAudiences.filter(c => c.audienceSourceName === pref.pref);
          this.customDataService.reloadCustomVarData(pref.largeVal ?? pref.val, currentAudiences);
        });
      }
    }
  }

  private dispatchPostLoadActions() : void {
    this.audienceService.setupAudienceListeners();
    this.store$.dispatch(new LayerSetupComplete());
  }

  private setupEsriInitialState(project: ImpProject) : Observable<ImpProject> {
    const geocodes = new Set<string>();
    const activeGeocodes = new Set<string>();
    project.getImpGeofootprintGeos().forEach(c => {
      geocodes.add(c.geocode);
      if (c.impGeofootprintLocation.isActive && c.impGeofootprintTradeArea.isActive && c.isActive) activeGeocodes.add(c.geocode);
    });
    const sortedGeocodes = Array.from(activeGeocodes);
    sortedGeocodes.sort();
    const state: InitialEsriState = {
      shading: {
        featuresOfInterest: sortedGeocodes
      }
    };
    const shadingDefinitions = this.appRendererService.getShadingDefinitions(project);
    const poiConfigurations = this.poiRenderingService.getConfigurations(project);
    const boundaryConfigurations = this.boundaryRenderingService.getConfigurations(project);
    const projectVarMap = mapByExtended(project.impProjectVars, pv => `${pv.varPk}`);
    shadingDefinitions.forEach(sd => {
      // just in case stuff was saved with a destination id
      delete sd.destinationLayerUniqueId;
      sd.refreshLegendOnRedraw = this.appConfig.isBatchMode;
      if (projectVarMap.has(sd.dataKey)) {
        sd.isCustomAudienceShader = projectVarMap.get(sd.dataKey).isCustom;
      }
      if (this.appConfig.isBatchMode) {
        const newLayerSetup = this.getLayerSetupInfo(sd.sourcePortalId);
        if (newLayerSetup != null) {
          sd.sourcePortalId = newLayerSetup.simplifiedBoundary || newLayerSetup.boundary;
          sd.minScale = newLayerSetup.batchMinScale || newLayerSetup.minScale;
        }
      } else {
        sd.sourcePortalId = this.appConfig.getRefreshedLayerId(sd.sourcePortalId);
      }
      sd.shaderNeedsDataFetched = false;
    });
    boundaryConfigurations.forEach(bc => {
      // just in case stuff was saved with a destination id
      bc.destinationBoundaryId = undefined;
      bc.destinationCentroidId = undefined;
      bc.useSimplifiedInfo = this.appConfig.isBatchMode;
      bc.portalId = this.appConfig.getRefreshedLayerId(bc.portalId);
      bc.centroidPortalId = this.appConfig.getRefreshedLayerId(bc.centroidPortalId);
      bc.simplifiedPortalId = this.appConfig.getRefreshedLayerId(bc.simplifiedPortalId);
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
      tap(() => this.store$.dispatch(new GetLayerAttributes({ geocodes }))),
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

  createNew() : number {
    this.clearAll();
    const projectId = this.appProjectService.createNew();
    this.esriService.loadInitialState({}, [], this.poiRenderingService.getConfigurations(), this.boundaryRenderingService.getConfigurations());
    this.store$.dispatch(new LayerSetupComplete());
    this.audienceService.setupAudienceListeners();
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
    this.audienceService.teardownAudienceListeners();
    this.appProjectService.clearAll();
    this.appLocationService.clearAll();
    this.appTradeAreaService.clearAll();
    this.appGeoService.clearAll();
    this.appProjectService.finalizeClear();
    this.appLayerService.clearClientLayers();
    this.appStateService.clearUserInterface();
    this.store$.dispatch(new ClearTradeAreas());
    this.store$.dispatch(clearTransientData({ fullEntityWipe: true }));
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
    const allSelectedGeos = new Set(this.appStateService.uniqueSelectedGeocodes$.getValue());
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
            g.isActive = state && audiencePreSelected && allSelectedGeos.has(g.geocode);
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
       titleText = isResubmit ? 'Must Cover Resubmit' : 'Must Cover Upload/Manually Add';
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
      const updatedId = this.appConfig.getRefreshedLayerId(currentBoundaryId);
      const dataKey = this.boundaryRenderingService.getDataKeyByBoundaryLayerId(updatedId);
      return this.boundaryRenderingService.getLayerSetupInfo(dataKey);
    } catch (e) {
      this.logger.error.log(e);
    }
    return null;
  }



}
