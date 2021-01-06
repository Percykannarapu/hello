import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, CommonSort, getUuid } from '@val/common';
import {
  ColorPalette,
  ConfigurationTypes,
  createDataArcade,
  createTextArcade,
  duplicateShadingDefinition,
  EsriLayerService,
  EsriService,
  EsriShadingService,
  FillPattern,
  generateContinuousValues,
  generateDynamicClassBreaks,
  generateDynamicSymbology,
  generateUniqueValues,
  getColorPalette,
  getFillPalette,
  isArcadeCapableShadingDefinition,
  isComplexShadingDefinition,
  RgbTuple,
  ShadingDefinition,
  shadingSelectors
} from '@val/esri';
import { AppConfig } from 'app/app.config';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, take, withLatestFrom } from 'rxjs/operators';
import * as ValSort from '../common/valassis-sorters';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { ClearMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.actions';
import { MapVar } from '../impower-datastore/state/transient/map-vars/map-vars.model';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { GetAllMappedVariables } from '../impower-datastore/state/transient/transient.actions';
import { getAllMappedAudiences } from '../impower-datastore/state/transient/transient.reducer';
import { GfpShaderKeys } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { getTypedBatchQueryParams } from '../state/shared/router.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';
import { BoundaryRenderingService } from './boundary-rendering.service';

@Injectable()
export class AppRendererService {

  private selectedWatcher: Subscription;
  private currentBatchDedupeFlag: boolean = false;

  constructor(private appStateService: AppStateService,
              private appPrefService: AppProjectPrefService,
              private boundaryRenderingService: BoundaryRenderingService,
              private impGeoService: ImpGeofootprintGeoService,
              private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private esriService: EsriService,
              private esriShaderService: EsriShadingService,
              private esriLayerService: EsriLayerService,
              private config: AppConfig,
              private logger: LoggingService,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.setupBatchWatcher();
      this.setupAnalysisLevelWatcher();
      this.setupProjectPrefsWatcher();
      this.setupGeoWatchers(this.impGeoService.storeObservable, this.impTradeAreaService.storeObservable);
      this.setupMapWatcher(this.impGeoService.storeObservable, this.impTradeAreaService.storeObservable);
      this.setupMapVarWatcher();
    });
  }

  private static getHomeGeoTradeAreaDescriptor(tradeAreaTypesInPlay: Set<TradeAreaTypeCodes>, radiusDescriptor: string) : string {
    if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.Radius)) {
      return radiusDescriptor;
    } else if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.Custom)) {
      return 'Custom';
    } else if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.Manual)) {
      return 'Manual';
    } else if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.MustCover)) {
      return 'Must Cover';
    }
  }

  private setupBatchWatcher() : void {
    combineLatest([
      this.store$.select(getBatchMode),
      this.store$.select(getTypedBatchQueryParams)
    ]).subscribe(([batchMode, params]) => this.currentBatchDedupeFlag = batchMode && params.duplicated);
  }

  private setupProjectPrefsWatcher() : void {
    this.store$.select(shadingSelectors.allLayerDefs).pipe(
      withLatestFrom(this.store$.select(projectIsReady), this.store$.select(getBatchMode)),
      filter(([, ready, isBatchMode]) => ready && !isBatchMode)
    ).subscribe(([sd]) => {
      const newDefs: ShadingDefinition[] = sd.map(s => duplicateShadingDefinition(s));
      newDefs.forEach(s => {
        s.destinationLayerUniqueId = undefined;
        if (isArcadeCapableShadingDefinition(s)) {
          s.arcadeExpression = undefined;
        }
      });
      this.appPrefService.createPref('esri', 'map-shading-defs', JSON.stringify(newDefs), 'STRING', true);
    });
  }

  private setupAnalysisLevelWatcher() : void {
    this.appStateService.analysisLevel$.pipe(
      withLatestFrom(this.appStateService.applicationIsReady$, this.store$.select(getBatchMode)),
      filter(([al, ready, isBatchMode]) => al != null && ready && !isBatchMode),
      map(([al]) => al),
      distinctUntilChanged(),
      withLatestFrom(this.appStateService.currentProject$)
    ).subscribe(([al, project]) => {
      const shadingDefinitions = this.getShadingDefinitions(project);
      shadingDefinitions.forEach(sd => {
        this.updateForAnalysisLevel(sd, al, true);
      });
      if (shadingDefinitions.length === 0) {
        shadingDefinitions.push(this.createSelectionShadingDefinition(al, false));
      }
      this.store$.dispatch(new ClearMapVars());
      this.esriShaderService.loadShaders(shadingDefinitions);
      setTimeout(() => this.store$.dispatch(new GetAllMappedVariables({ analysisLevel: al, additionalGeos: this.appStateService.uniqueSelectedGeocodes$.getValue() })), 1000);
    });
  }

  private setupGeoWatchers(geoDataStore: Observable<ImpGeofootprintGeo[]>, tradeAreaDataStore: Observable<ImpGeofootprintTradeArea[]>) : void {
    if (this.selectedWatcher) this.selectedWatcher.unsubscribe();

    this.selectedWatcher = combineLatest([geoDataStore, this.store$.select(projectIsReady)]).pipe(
      filter(([geos, ready]) => ready && geos != null),
      map(([geos]) => geos as ImpGeofootprintGeo[]),
      debounceTime(500),
      withLatestFrom(
        tradeAreaDataStore,
        this.store$.select(shadingSelectors.visibleLayerDefs),
        this.appStateService.uniqueSelectedGeocodeSet$
      ),
      map(([geos, tas, layerDefs, visibleGeos]) => ([ geos, tas, layerDefs, visibleGeos ] as const))
    ).subscribe(([geos, tas, currentLayerDefs, visibleGeos]) => {
      const newDefs: ShadingDefinition[] = [];
      currentLayerDefs.forEach(definition => {
        const newDef = duplicateShadingDefinition(definition);
        if (newDef != null && isComplexShadingDefinition(newDef)) {
          switch (newDef.dataKey) {
            case GfpShaderKeys.OwnerSite:
              newDef.arcadeExpression = null;
              this.updateForOwnerSite(newDef, geos, visibleGeos);
              newDefs.push(newDef);
              break;
            case GfpShaderKeys.OwnerTA:
              newDef.arcadeExpression = null;
              this.updateForOwnerTA(newDef, geos, tas, visibleGeos);
              newDefs.push(newDef);
              break;
            case GfpShaderKeys.Selection:
              // noop
              break;
            default:
              if (newDef.filterByFeaturesOfInterest) {
                newDef.arcadeExpression = null;
                newDefs.push(newDef);
              }
          }
        }
      });
      const deDuper = new Set<string>();
      const features = geos.reduce((a, c) => {
        if (c.impGeofootprintLocation.isActive && c.impGeofootprintTradeArea.isActive && c.isActive && !deDuper.has(c.geocode)) {
          deDuper.add(c.geocode);
          a.push(c.geocode);
        }
        return a;
      }, []);
      features.sort();
      this.esriService.setFeaturesOfInterest(features);
      setTimeout(() => {
        this.store$.dispatch(new GetAllMappedVariables({ analysisLevel: this.appStateService.analysisLevel$.getValue(), additionalGeos: features }));
      }, 1000);

      if (newDefs.length > 0) {
        this.esriShaderService.upsertShader(newDefs);
      }
    });
  }

  private setupMapWatcher(geoDataStore: Observable<ImpGeofootprintGeo[]>, tradeAreaDataStore: Observable<ImpGeofootprintTradeArea[]>) : void {
    this.esriService.visibleFeatures$.pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(
        this.store$.select(shadingSelectors.visibleLayerDefs),
        this.appStateService.uniqueIdentifiedGeocodeSet$,
        this.store$.select(getAllMappedAudiences),
        this.store$.select(getMapVars),
        geoDataStore,
        tradeAreaDataStore
      )
    ).subscribe(([features, layerDefs, geocodes, audiences, mapVars, geos, tradeAreas]) => {
      const visibleGeos = new Set<string>(features.map(f => f.attributes.geocode));
      this.updateAudiences(mapVars, visibleGeos, layerDefs, geocodes, audiences, geos, tradeAreas);
    });
  }

  private setupMapVarWatcher() {
    this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(
        this.store$.select(shadingSelectors.visibleLayerDefs),
        this.appStateService.uniqueIdentifiedGeocodeSet$,
        this.store$.select(getAllMappedAudiences),
        this.esriService.visibleFeatures$
      )
    ).subscribe(([mapVars, layerDefs, geocodes, audiences, features]) => {
      const visibleGeos = new Set(features.map(f => f.attributes.geocode));
      this.updateAudiences(mapVars, visibleGeos, layerDefs, geocodes, audiences, null, null);
    });
  }

  private updateAudiences(mapVars: MapVar[], visibleGeoSet: Set<string>, layerDefs: ShadingDefinition[], geocodes: Set<string>, audiences: Audience[], geos: ImpGeofootprintGeo[], tradeAreas: ImpGeofootprintTradeArea[]) : void {
    const varPks = audiences.map(audience => Number(audience.audienceIdentifier));
    const shadersForUpsert: ShadingDefinition[] = [];
    if (varPks != null && mapVars != null && mapVars.length > 0) {
      const gfpFilteredMapVars = mapVars.filter(mv => geocodes.has(mv.geocode));
      varPks.forEach(varPk => {
        const shadingLayers = layerDefs.filter(ld => ld.dataKey === varPk.toString());
        if (shadingLayers != null) {
          shadingLayers.forEach(shadingLayer => {
            const shaderCopy: ShadingDefinition = duplicateShadingDefinition(shadingLayer);
            const currentMapVars = shaderCopy.filterByFeaturesOfInterest
              ? gfpFilteredMapVars
              : mapVars;
            this.updateForAudience(shaderCopy, currentMapVars, visibleGeoSet, varPk);
            shadersForUpsert.push(shaderCopy);
          });
        }
      });
    }
    if (geos != null && tradeAreas != null) {
      layerDefs.forEach(shadingLayer => {
        const shaderCopy: ShadingDefinition = duplicateShadingDefinition(shadingLayer);
        switch (shaderCopy.dataKey) {
          case GfpShaderKeys.OwnerSite:
            this.updateForOwnerSite(shaderCopy, geos, visibleGeoSet);
            shadersForUpsert.push(shaderCopy);
            break;
          case GfpShaderKeys.OwnerTA:
            this.updateForOwnerTA(shaderCopy, geos, tradeAreas, visibleGeoSet);
            shadersForUpsert.push(shaderCopy);
            break;
        }
      });
    }
    if (shadersForUpsert.length > 0) {
      this.esriShaderService.upsertShader(shadersForUpsert);
    }
  }

  createNewShader(dataKey: string, layerName?: string) : Partial<ShadingDefinition> {
    const shadingTypeMap = {
      [GfpShaderKeys.Selection]: ConfigurationTypes.Simple,
      [GfpShaderKeys.OwnerSite]: ConfigurationTypes.Unique,
      [GfpShaderKeys.OwnerTA]: ConfigurationTypes.Unique,
    };
    const newForm: Partial<ShadingDefinition> = {
      id: getUuid(),
      dataKey,
      visible: true,
      layerName,
      opacity: dataKey === GfpShaderKeys.Selection ? 0.25 : 0.5,
      filterField: 'geocode',
      filterByFeaturesOfInterest: shadingTypeMap[dataKey] != null,
      shadingType: shadingTypeMap[dataKey]
    };
    if (dataKey === GfpShaderKeys.OwnerSite && newForm.shadingType === ConfigurationTypes.Unique) {
      newForm.secondaryDataKey = 'locationNumber';
    }
    if (dataKey === GfpShaderKeys.Selection) {
      newForm.defaultSymbolDefinition = {
        fillType: 'solid',
        fillColor: [0, 255, 0, 1]
      };
    }
    return newForm;
  }

  getShadingDefinitions(project: ImpProject) : ShadingDefinition[] {
    let shadingDefinitions: ShadingDefinition[];
    const newPref = this.appPrefService.getPrefVal('map-shading-defs');
    if (newPref) {
      shadingDefinitions = JSON.parse(newPref);
    } else {
      shadingDefinitions = this.createShadingDefinitionsFromLegacy(project);
      if (shadingDefinitions.length > 0) {
        // update the project to the new shading API
        project.impProjectVars.forEach(pv => pv.isShadedOnMap = false);
        this.appPrefService.createPref('esri', 'map-shading-defs', JSON.stringify(shadingDefinitions));
      }
    }
    return shadingDefinitions;
  }

  private createShadingDefinitionsFromLegacy(project: ImpProject) : ShadingDefinition[] {
    const result: ShadingDefinition[] = [];
    if (project.methAnalysis == null || project.methAnalysis.length === 0) return result;

    const shadingData: ImpProjectVar[] = project.impProjectVars.filter(p => p.isShadedOnMap);
    const legacyPrefs: ImpProjectPref[] = (project.impProjectPrefs || []).filter(p => p.prefGroup === 'map-settings');
    const isFiltered = legacyPrefs.filter(p => p.pref === 'Thematic-Extent' && p.getVal() === 'Selected Geos only').length > 0;
    const paletteKey = legacyPrefs.filter(p => p.pref === 'Theme')[0];
    const legacyTheme = paletteKey != null ? ColorPalette[paletteKey.getVal()] : ColorPalette.EsriPurple;
    const selectionDefinition = this.createSelectionShadingDefinition(project.methAnalysis, shadingData.length > 0);
    let indexOffset = 1;
    if (shadingData.length === 0 || !isFiltered) {
      result.push(selectionDefinition);
      indexOffset = 2;
    }
    shadingData.forEach((sd, index) => {
      result.push(this.createVariableShadingDefinition(sd, project.methAnalysis, isFiltered, index + indexOffset, legacyTheme));
    });
    return result;
  }

  private createSelectionShadingDefinition(analysisLevel: string, isAlsoShaded: boolean) : ShadingDefinition {
    const result: ShadingDefinition = {
      id: getUuid(),
      dataKey: 'selection-shading',
      sortOrder: 1,
      sourcePortalId: null,
      layerName: null,
      opacity: isAlsoShaded ? 1 : 0.75,
      visible: true,
      minScale: null,
      defaultSymbolDefinition: {
        fillColor: isAlsoShaded ? [0, 0, 0, 1] : [0, 255, 0, 1],
        fillType: isAlsoShaded ? 'backward-diagonal' : 'solid',
      },
      filterByFeaturesOfInterest: true,
      filterField: 'geocode',
      shadingType: ConfigurationTypes.Simple,
      isCustomAudienceShader: false
    };
    this.updateForAnalysisLevel(result, analysisLevel);
    return result;
  }

  private createVariableShadingDefinition(projectVar: ImpProjectVar, analysisLevel: string, isFiltered: boolean, index: number, theme: ColorPalette) : ShadingDefinition {
    const isNumeric = projectVar.fieldconte !== 'CHAR';
    const result: Partial<ShadingDefinition> = {
      id: getUuid(),
      dataKey: projectVar.varPk.toString(),
      sortOrder: index,
      sourcePortalId: null,
      layerName: projectVar.fieldname,
      opacity: 0.5,
      visible: true,
      minScale: null,
      defaultSymbolDefinition: {
        fillColor: [0, 0, 0, 0],
        fillType: 'solid'
      },
      filterByFeaturesOfInterest: isFiltered,
      filterField: 'geocode',
      shadingType: isNumeric ? ConfigurationTypes.Ramp : ConfigurationTypes.Unique,
      theme
    };
    if (result.shadingType === ConfigurationTypes.Unique) {
      result.secondaryDataKey = null;
    }
    this.updateForAnalysisLevel(result as ShadingDefinition, analysisLevel);
    return result as ShadingDefinition;
  }

  updateForAnalysisLevel(definition: ShadingDefinition, newAnalysisLevel: string, isNewAnalysisLevel: boolean = false) : void {
    const layerKey = this.config.analysisLevelToLayerKey(newAnalysisLevel);
    const layerData = this.boundaryRenderingService.getLayerSetupInfo(layerKey);
    const newSelectedLayerName = `Selected ${newAnalysisLevel}s`;
    if (definition.sourcePortalId == null || isNewAnalysisLevel) {
      definition.sourcePortalId = layerData.boundary;
      definition.minScale = layerData.batchMinScale;
    }
    if (definition.dataKey === 'selection-shading' && (definition.layerName == null || isNewAnalysisLevel)) {
      definition.layerName = newSelectedLayerName;
      definition.defaultSymbolDefinition.legendName = newSelectedLayerName;
    }
    if (isNewAnalysisLevel) {
      delete definition.destinationLayerUniqueId;
      if (isComplexShadingDefinition(definition)) {
        delete definition.arcadeExpression;
        switch (definition.shadingType) {
          case ConfigurationTypes.Unique:
          case ConfigurationTypes.Ramp:
            delete definition.breakDefinitions;
            break;
          case ConfigurationTypes.ClassBreak:
            if (definition.dynamicallyAllocate) delete definition.breakDefinitions;
            break;
        }
      }
    }
  }

  updateForOwnerSite(definition: ShadingDefinition, geos: ImpGeofootprintGeo[], visibleGeos: Set<string>) : void {
    if (definition != null && definition.shadingType === ConfigurationTypes.Unique) {
      if (definition.theme == null) definition.theme = ColorPalette.CpqMaps;
      const secondaryKey = definition.secondaryDataKey || 'locationNumber';
      const useCustomSorter = (secondaryKey === 'locationNumber');
      const allSiteEntries = new Set<string>();
      const activeSiteEntries = new Set<string>();
      const data: Record<string, string> = geos.reduce((result, geo) => {
        let siteEntry;
        if (geo.impGeofootprintLocation.hasOwnProperty(secondaryKey)) {
          siteEntry = geo.impGeofootprintLocation[secondaryKey];
        } else {
          const matchingAttribute = geo.impGeofootprintLocation.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === secondaryKey)[0];
          siteEntry = matchingAttribute == null ? null : matchingAttribute.attributeValue;
        }
        const isDeduped = this.currentBatchDedupeFlag ? true : geo.isDeduped === 1;
        if (geo.impGeofootprintLocation && geo.impGeofootprintLocation.isActive &&
          geo.impGeofootprintTradeArea && geo.impGeofootprintTradeArea.isActive &&
          geo.isActive && isDeduped) {
          result[geo.geocode] = siteEntry;
          if (visibleGeos.has(geo.geocode)) activeSiteEntries.add(siteEntry);
        }
        allSiteEntries.add(siteEntry);
        return result;
      }, {});
      const sorter = useCustomSorter ? CommonSort.StringsAsNumbers : undefined;
      const colorPalette = getColorPalette(definition.theme, definition.reverseTheme);
      const fillPalette = getFillPalette(definition.theme, definition.reverseTheme);
      const sortedSiteEntries = Array.from(allSiteEntries);
      sortedSiteEntries.sort(sorter);
      // const shouldGenerateArcade = !definition.filterByFeaturesOfInterest || isEmpty(definition.arcadeExpression);
      // if (shouldGenerateArcade) {
      //   definition.arcadeExpression = createTextArcade(data, sortedSiteEntries);
      // }
      definition.arcadeExpression = createTextArcade(data, sortedSiteEntries);
      definition.breakDefinitions = generateUniqueValues(sortedSiteEntries, colorPalette, fillPalette, true, activeSiteEntries);
    }
  }

  updateForOwnerTA(definition: ShadingDefinition, geos: ImpGeofootprintGeo[], tradeAreas: ImpGeofootprintTradeArea[], visibleGeos: Set<string>, showDuplicates: boolean = true) : void {
    if (definition != null && definition.shadingType === ConfigurationTypes.Unique) {
      if (definition.theme == null) definition.theme = ColorPalette.CpqMaps;
      const deferredHomeGeos: ImpGeofootprintGeo[] = [];
      const tradeAreaTypesInPlay = new Set<TradeAreaTypeCodes>();
      const firstRadiusTradeArea = tradeAreas.filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius && ta.taNumber === 1)[0];
      const radiusForFirstTa: string = firstRadiusTradeArea != null ? `${firstRadiusTradeArea.taRadius} Mile Radius` : '';
      const allTAEntries = new Set<string>();
      const activeTAEntries = new Set<string>();
      const data: Record<string, string> = geos.reduce((result, geo) => {
        let currentEntry = null;
        switch (TradeAreaTypeCodes.parse(geo.impGeofootprintTradeArea.taType)) {
          case TradeAreaTypeCodes.Radius:
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              currentEntry = `${geo.impGeofootprintTradeArea.taRadius} Mile Radius`;
              tradeAreaTypesInPlay.add(TradeAreaTypeCodes.Radius);
            }
            break;
          case TradeAreaTypeCodes.HomeGeo:
            deferredHomeGeos.push(geo);
            break;
          case TradeAreaTypeCodes.Custom:
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              currentEntry = 'Custom';
            }
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.Custom);
            break;
          case TradeAreaTypeCodes.Manual:
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              currentEntry = 'Manual';
            }
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.Manual);
            break;
          case TradeAreaTypeCodes.MustCover:
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              currentEntry = 'Must Cover';
            }
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.MustCover);
            break;
        }
        if (currentEntry != null) {
          const isDeduped = showDuplicates ? true : geo.isDeduped === 1;
          if (geo.impGeofootprintLocation && geo.impGeofootprintLocation.isActive &&
            geo.impGeofootprintTradeArea && geo.impGeofootprintTradeArea.isActive &&
            geo.isActive && isDeduped) {
            result[geo.geocode] = currentEntry;
            if (visibleGeos.has(geo.geocode)) activeTAEntries.add(currentEntry);
          }
          allTAEntries.add(currentEntry);
        }

        return result;
      }, {});

      deferredHomeGeos.forEach(hg => {
        const isDeduped = showDuplicates ? true : hg.isDeduped === 1;
        const hgEntry = AppRendererService.getHomeGeoTradeAreaDescriptor(tradeAreaTypesInPlay, radiusForFirstTa);
        if (hg.impGeofootprintLocation && hg.impGeofootprintLocation.isActive &&
          hg.impGeofootprintTradeArea && hg.impGeofootprintTradeArea.isActive &&
          hg.isActive && isDeduped) {
          data[hg.geocode] = hgEntry;
          if (visibleGeos.has(hg.geocode)) activeTAEntries.add(hgEntry);
        }
        allTAEntries.add(hgEntry);
      });
      const colorPalette = getColorPalette(definition.theme, definition.reverseTheme);
      const fillPalette = getFillPalette(definition.theme, definition.reverseTheme);
      const sortedTAEntries = Array.from(allTAEntries);
      sortedTAEntries.sort(ValSort.TradeAreaByTypeString);
      // const shouldGenerateArcade = !definition.filterByFeaturesOfInterest || isEmpty(definition.arcadeExpression);
      // if (shouldGenerateArcade) {
      //   definition.arcadeExpression = createTextArcade(data, sortedTAEntries);
      // }
      definition.arcadeExpression = createTextArcade(data, sortedTAEntries);
      definition.breakDefinitions = generateUniqueValues(sortedTAEntries, colorPalette, fillPalette, true, activeTAEntries);
    }
  }

  updateForAudience(definition: ShadingDefinition, currentMapVars: MapVar[], currentVisibleGeos: Set<string>, varPk: number) : void {
    const allUniqueValues = new Set<string>();
    const uniquesToKeep = new Set<string>();
    const allValuesForStats: number[] = [];
    const mapVarDictionary: Record<string, string | number> = currentMapVars.reduce((result, mapVar) => {
      switch (definition.shadingType) {
        case ConfigurationTypes.Unique:
          result[mapVar.geocode] = mapVar[varPk];
          if (mapVar[varPk] != null) {
            allUniqueValues.add(`${mapVar[varPk]}`);
            if (currentVisibleGeos.has(mapVar.geocode)) uniquesToKeep.add(`${mapVar[varPk]}`);
          }
          break;
        case ConfigurationTypes.Ramp:
        case ConfigurationTypes.ClassBreak:
        case ConfigurationTypes.DotDensity:
          result[mapVar.geocode] = Number(mapVar[varPk]);
          if (mapVar[varPk] != null) {
            allValuesForStats.push(Number(mapVar[varPk]));
          }
          break;
      }
      return result;
    }, {});

    let colorPalette: RgbTuple[] = [];
    let fillPalette: FillPattern[] = [];
    if (isComplexShadingDefinition(definition)) {
      colorPalette = getColorPalette(definition.theme, definition.reverseTheme);
      fillPalette = getFillPalette(definition.theme, definition.reverseTheme);
    }

    let uniqueValues: string[] = [];
    if (isArcadeCapableShadingDefinition(definition)) {
      let arcadeGenerator: () => string;
      if (definition.shadingType === ConfigurationTypes.Unique) {
        uniqueValues = Array.from(allUniqueValues);
        uniqueValues.sort();
        arcadeGenerator = () => createTextArcade(mapVarDictionary, uniqueValues);
      } else {
        arcadeGenerator = () => createDataArcade(mapVarDictionary);
      }
      definition.arcadeExpression = arcadeGenerator();
      // const shouldGenerateArcade = definition.isCustomAudienceShader || !definition.filterByFeaturesOfInterest || isEmpty(definition.arcadeExpression);
      // if (shouldGenerateArcade) {
      //   definition.arcadeExpression = arcadeGenerator();
      // }
    }

    switch (definition.shadingType) {
      case ConfigurationTypes.Unique:
        definition.breakDefinitions = generateUniqueValues(uniqueValues, colorPalette, fillPalette, true, uniquesToKeep);
        break;
      case ConfigurationTypes.Ramp:
        if (allValuesForStats.length > 0) {
          definition.breakDefinitions = generateContinuousValues(calculateStatistics(allValuesForStats), colorPalette);
        }
        break;
      case ConfigurationTypes.ClassBreak:
        if (definition.dynamicallyAllocate && allValuesForStats.length > 0) {
          const stats = calculateStatistics(allValuesForStats, definition.dynamicAllocationSlots || 4);
          let symbology = [ ...(definition.userBreakDefaults || []) ];
          if (definition.dynamicLegend) {
            symbology = generateDynamicSymbology(stats, colorPalette, fillPalette);
          }
          definition.breakDefinitions = generateDynamicClassBreaks(stats, definition.dynamicAllocationType, symbology);
        }
        break;
    }
  }
}
