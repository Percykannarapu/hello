import { Injectable } from '@angular/core';
import Extent from '@arcgis/core/geometry/Extent';
import { Store } from '@ngrx/store';
import { CommonSort, filterArray, groupBy, isEmpty, isNil, isNotNil, KeyedSet, mapArray, mapByExtended } from '@val/common';
import { EsriBoundaryService, EsriMapService, EsriService, InitialEsriState, LayerKeys } from '@val/esri';
import { ErrorNotification, StopBusyIndicator, SuccessNotification, WarningNotification } from '@val/messaging';
import { DynamicVariable } from 'app/impower-datastore/state/transient/dynamic-variable.model';
import * as FromMetricVarActions from 'app/impower-datastore/state/transient/metric-vars/metric-vars.action';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { MessageCenterService } from '../../../../modules/messaging/core/message-center.service';
import {
  ImpClientLocationTypeCodes,
  ProjectPrefGroupCodes,
  SuccessfulLocationTypeCodes
} from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { createExistingAudienceInstance } from '../common/models/audience-factories';
import { AnalysisLevel, ProjectFilterChanged } from '../common/models/ui-enums';
import { LoadAudiences } from '../impower-datastore/state/transient/audience/audience.actions';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { clearTransientData } from '../impower-datastore/state/transient/transient.actions';
import { FullAppState, MustCoverPref } from '../state/app.interfaces';
import { LayerSetupComplete } from '../state/data-shim/data-shim.actions';
import { ClearTradeAreas } from '../state/rendering/rendering.actions';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
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

const varPkMap = new Map<string, number>([
  ['cl2i00', 5020], ['cl0c00', 1001], ['cl2prh', 1086], ['city_name', 33013], ['cov_desc', 14001], ['dma_name', 40690], ['cov_frequency', 30534], ['owner_group_primary', 33024],
  ['pob', 14029], ['num_ip_addrs', 9103], ['hhld_s', 14031], ['hhld_w', 14032], ['tap049', 40912]
]);
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
              private messageCenter: MessageCenterService,
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
    const geocodes = new KeyedSet<ImpGeofootprintGeo, string>(geo => geo.geocode);
    const activeGeocodes = new Set<string>();
    project.getImpGeofootprintGeos().forEach(c => {
      geocodes.add(c);
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
    let hasSelectedGeoLayer = false;
    shadingDefinitions.forEach(sd => {
      // just in case stuff was saved with a destination id
      delete sd.destinationLayerUniqueId;
      sd.refreshLegendOnRedraw = this.appConfig.isBatchMode;
      if (projectVarMap.has(sd.dataKey)) {
        sd.isCustomAudienceShader = projectVarMap.get(sd.dataKey).isCustom;
      }
      if (isNil(sd.layerKey) && isNotNil(sd['sourcePortalId'])) {
        sd.layerKey = this.appConfig.fixupPortalIdToLayerKey(sd['sourcePortalId']);
      }
      sd.shaderNeedsDataFetched = false;
      if (sd.dataKey === 'selection-shading') hasSelectedGeoLayer = true;
    });
    if (!hasSelectedGeoLayer) {
      const selectionShading = this.appRendererService.createSelectionShadingDefinition(AnalysisLevel.parse(project.methAnalysis), false);
      selectionShading.sortOrder = 0;
      shadingDefinitions.push(selectionShading);
    }
    boundaryConfigurations.forEach(bc => {
      // just in case stuff was saved with a destination id
      bc.destinationBoundaryId = undefined;
      bc.destinationCentroidId = undefined;
      bc.destinationPOBId = undefined;
      if (isNil(bc.layerKey) && isNotNil(bc['portalId'])) {
        bc.layerKey = this.appConfig.fixupPortalIdToLayerKey(bc['portalId']);
      }
      if (bc.layerKey === LayerKeys.DTZ || bc.layerKey === LayerKeys.PCR) {
        bc.useSimplifiedInfo = this.appConfig.isBatchMode;
      }
      bc.labelDefinition.forceLabelsVisible = bc.labelDefinition?.forceLabelsVisible ?? false;
      if (isNotNil(bc.hhcLabelDefinition)) {
        bc.hhcLabelDefinition.forceLabelsVisible = bc.labelDefinition.forceLabelsVisible ?? false;
      }
      if (isNotNil(bc.pobLabelDefinition)) {
        bc.pobLabelDefinition.forceLabelsVisible = bc.pobLabelDefinition.forceLabelsVisible ?? false;
      }
    });
    poiConfigurations.forEach(pc => {
      pc.featureLayerId = undefined;
      pc.refreshLegendOnRedraw = this.appConfig.isBatchMode;
      pc.labelDefinition.forceLabelsVisible = pc.labelDefinition?.forceLabelsVisible ?? true;
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
      tap(() => {
        // this.store$.dispatch(new GetLayerAttributes({ geoLocations: Array.from(geocodes.values()) }));
      }),
      map(() => project)
    );
  }

  onLoadSuccess(isBatch: boolean) : void {
    const project: ImpProject = this.appStateService.currentProject$.getValue();
    this.impGeofootprintGeoService.uploadFailures = [];
    this.appTradeAreaService.setCurrentDefaults();
    this.reloadMustCovers(project);
    if (!isBatch) {
      const extent = (project.impProjectPrefs || []).filter(pref => pref.pref === 'extent')[0];
      if (extent != null) {
        const parsedJson = JSON.parse(extent.largeVal || extent.val);
        this.mapService.moveToExtent(Extent.fromJSON(parsedJson));
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
      this.store$.dispatch(ErrorNotification({ notificationTitle: 'Invalid Project', message: errors.join('\n') }));
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
    this.messageCenter.clearMessages();
    this.store$.dispatch(new ClearTradeAreas());
    this.store$.dispatch(clearTransientData({ fullEntityWipe: true }));
  }

  calcMetrics(geocodes: string[], attributes: { [geocode: string] : DynamicVariable }, project: ImpProject) : void {
    const geoAttributes = this.metricService.convertVariablesToGeoAttributes(attributes);
    const result = this.metricService.updateDefinitions(geoAttributes, geocodes, project);
    this.metricService.onMetricsChanged(result);
  }

   getAudience(){
    return  this.metricService.getColorBoxAudience();
  }

  getAudienceVariables(audiences: Audience[]){
    //this.store$.dispatch(new FetchMetricVars({audiences}));
   return this.metricService.getAudienceVariaables(audiences);
  }

  fetchMetricVars(metricVars: DynamicVariable[]){
    this.store$.dispatch(FromMetricVarActions.ClearMetricVars());
    this.store$.dispatch(FromMetricVarActions.FetchMetricVarsComplete({metricVars}));
  }

  filterGeos(geos: ImpGeofootprintGeo[], geoAttributes: { [geocode: string] : DynamicVariable }, currentProject: ImpProject, filterType?: ProjectFilterChanged) : void {
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
        const filterReasons: string[] = [];
        let ignore: boolean = (filterType != null);
        let state: boolean;
        switch (currentAttribute[varPkMap.get('owner_group_primary')]) {
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
        if (currentAttribute[varPkMap.get('cov_frequency')] === 'Solo') {
          if (filterType === ProjectFilterChanged.Solo) ignore = false;
          if (!includeSolo) filterReasons.push('SOLO');
          state = state && includeSolo;
        }
        if (currentAttribute[varPkMap.get('pob')] === 'B') {
          if (filterType === ProjectFilterChanged.Pob) ignore = false;
          if (!includePob) filterReasons.push('POB');
          state = state && includePob;
        }
        if (!ignore) {
          currentGeos.forEach(g => {
            g.isActive = state && (filterType != null || allSelectedGeos.has(g.geocode));
            g['filterReasons'] = state ? '' : `Filtered because: ${filterReasons.join(', ')}`;
          });
        }
      }
    });

    this.appGeoService.notify();
  }

  persistMustCoverRollDownGeos(payLoad: any[], fileName: string, failedGeos: any[]){
   return this.impGeofootprintGeoService.persistMustCoverRollDownGeos(payLoad, failedGeos,  fileName);
  }

  rollDownComplete(isResubmit: boolean, resubmitGeo: string[], rollDownType: string, siteType: SuccessfulLocationTypeCodes = ImpClientLocationTypeCodes.Site){
    const locations: ImpGeofootprintLocation[] = this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType);
    this.appGeoService.selectAndPersistHomeGeos(locations, this.appStateService.analysisLevel$.getValue(), this.appStateService.season$.getValue());
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
      this.store$.dispatch(ErrorNotification({ message: 'The resubmitted geocode is not valid, please try again', notificationTitle: titleText}));
    }
    else if (!isResubmit && uploadFailures.length > 0){
      this.store$.dispatch(WarningNotification({ message: 'The upload file contains invalid geocodes, please refer to the failure grid for a list.', notificationTitle: titleText }));
      this.store$.dispatch(SuccessNotification({ message: 'Completed', notificationTitle: titleText}));
    }
    else
      this.store$.dispatch(SuccessNotification({ message: 'Completed', notificationTitle: titleText}));
  }

  private reloadMustCovers(project: ImpProject) : void {
    try {
      const prefs: ImpProjectPref[] = project.impProjectPrefs.filter(pref => pref.prefGroup === 'MUSTCOVER');
      if (!isEmpty(prefs)) {
        const newMustCovers = prefs.reduce((acc, mustCoverPref) => {
          const prefsVal = mustCoverPref.val ?? mustCoverPref.largeVal;
          if (mustCoverPref.pref !== 'Must Cover Manual') {
            acc = acc.concat(this.impGeofootprintGeoService.parseMustCoverString(prefsVal));
          } else {
            const manualPrefs: MustCoverPref = JSON.parse(prefsVal);
            acc = acc.concat(this.impGeofootprintGeoService.parseMustCoverString(manualPrefs.fileContents));
          }
          return acc;
        }, [] as string[]);
        this.impGeofootprintGeoService.setMustCovers(newMustCovers);
      }
    } catch (e) {
      this.logger.error.groupCollapsed('Error loading must covers');
      this.logger.error.log(e);
      this.logger.error.groupEnd();
    }
  }

}
