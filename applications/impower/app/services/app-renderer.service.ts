import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, CommonSort, getUuid } from '@val/common';
import {
  ColorPalette,
  ConfigurationTypes,
  createDataArcade,
  EsriService,
  EsriShadingLayersService,
  FillPattern,
  generateContinuousValues,
  generateDynamicClassBreaks,
  generateDynamicSymbology,
  generateUniqueValues,
  getColorPalette,
  isArcadeCapableShadingDefinition,
  isComplexShadingDefinition,
  RgbTuple,
  ShadingDefinition,
  shadingSelectors
} from '@val/esri';
import { AppConfig } from 'app/app.config';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, take, withLatestFrom } from 'rxjs/operators';
import { getFillPalette } from '../../../../modules/esri/src/models/color-palettes';
import { ClearMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.actions';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { GetAllMappedVariables } from '../impower-datastore/state/transient/transient.actions';
import { GfpShaderKeys } from '../models/ui-enums';
import { ValSort } from '../models/valassis-sorters';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { getTypedBatchQueryParams } from '../state/shared/router.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';

@Injectable()
export class AppRendererService {
  private selectedWatcher: Subscription;

  constructor(private appStateService: AppStateService,
              private appPrefService: AppProjectPrefService,
              private impGeoService: ImpGeofootprintGeoService,
              private esriService: EsriService,
              private esriShaderService: EsriShadingLayersService,
              private config: AppConfig,
              private logger: LoggingService,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.setupAnalysisLevelWatcher();
      this.setupProjectPrefsWatcher();
      this.setupGeoWatchers(this.impGeoService.storeObservable);
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

  private setupProjectPrefsWatcher() : void {
    this.store$.select(shadingSelectors.allLayerDefs).pipe(
      withLatestFrom(this.store$.select(projectIsReady), this.store$.select(getBatchMode)),
      filter(([, ready, isBatchMode]) => ready && !isBatchMode)
    ).subscribe(([sd]) => {
      this.appPrefService.createPref('esri', 'map-shading-defs', JSON.stringify(sd));
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
      setTimeout(() => this.store$.dispatch(new GetAllMappedVariables({ analysisLevel: al })), 1000);
    });
  }

  private setupGeoWatchers(geoDataStore: Observable<ImpGeofootprintGeo[]>) : void {
    if (this.selectedWatcher) this.selectedWatcher.unsubscribe();

    this.selectedWatcher = geoDataStore.pipe(
      withLatestFrom(this.store$.select(projectIsReady)),
      filter(([, ready]) => ready),
      map(([geos]) => geos as ImpGeofootprintGeo[]),
      filter(geos => geos != null),
      debounceTime(500),
      withLatestFrom(this.store$.select(shadingSelectors.allLayerDefs), this.store$.select(getBatchMode), this.store$.select(getTypedBatchQueryParams)),
      map(([geos, layerDefs, batchMode, queryParams]) => ([ geos, layerDefs, batchMode && queryParams.duplicated ] as const))
    ).subscribe(([geos, currentLayerDefs, shouldDedupe]) => {
      const ownerKeys = new Set<string>([GfpShaderKeys.OwnerSite, GfpShaderKeys.OwnerTA]);
      const definitions = currentLayerDefs.filter(sd => ownerKeys.has(sd.dataKey));
      const newDefs = definitions.reduce((updates, definition) => {
        if (definition != null && isComplexShadingDefinition(definition)) {
          const newDef = { ...definition };
          switch (newDef.dataKey) {
            case GfpShaderKeys.OwnerSite:
              this.updateForOwnerSite(newDef, geos, shouldDedupe);
              break;
            case GfpShaderKeys.OwnerTA:
              this.updateForOwnerTA(newDef, geos, shouldDedupe);
          }
          updates.push(newDef);
        }
        return updates;
      }, []);
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

      if (newDefs.length > 0) {
        this.esriShaderService.updateShader(newDefs);
      }
    });
  }

  private setupMapVarWatcher() {
    this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(this.store$.select(shadingSelectors.allLayerDefs), this.appStateService.uniqueSelectedGeocodeSet$)
    ).subscribe(([mapVars, layerDefs, geocodes]) => {
      const varPks = Object.keys(mapVars[0]).filter(key => key !== 'geocode').map(key => Number(key));
      if (varPks != null) {
        const filteredMapVars = mapVars.filter(mv => geocodes.has(mv.geocode));
        varPks.forEach(varPk => {
          const shadingLayers = layerDefs.filter(ld => ld.dataKey === varPk.toString());
          if (shadingLayers != null) {
            shadingLayers.forEach(shadingLayer => {
              const shaderCopy: ShadingDefinition = { ...shadingLayer };
              const currentMapVars = shaderCopy.filterByFeaturesOfInterest ? filteredMapVars : mapVars;
              const uniqueStrings = new Set<string>();
              const valuesForStats: number[] = [];
              const mapVarDictionary: Record<string, string | number> = currentMapVars.reduce((result, mapVar) => {
                switch (shaderCopy.shadingType) {
                  case ConfigurationTypes.Unique:
                    result[mapVar.geocode] = mapVar[varPk];
                    if (mapVar[varPk] != null) uniqueStrings.add(`${mapVar[varPk]}`);
                    break;
                  case ConfigurationTypes.Ramp:
                  case ConfigurationTypes.ClassBreak:
                  case ConfigurationTypes.DotDensity:
                    result[mapVar.geocode] = Number(mapVar[varPk]);
                    if (mapVar[varPk] != null) {
                      valuesForStats.push(Number(mapVar[varPk]));
                    }
                    break;
                }
                return result;
              }, {});
              const arcadeExpression = createDataArcade(mapVarDictionary);
              let colorPalette: RgbTuple[] = [];
              let fillPalette: FillPattern[] = [];
              if (isArcadeCapableShadingDefinition(shaderCopy)) {
                shaderCopy.arcadeExpression = arcadeExpression;
                if (isComplexShadingDefinition(shaderCopy)) {
                  colorPalette = getColorPalette(shaderCopy.theme, shaderCopy.reverseTheme);
                  fillPalette = getFillPalette(shaderCopy.theme, shaderCopy.reverseTheme);
                }
              }
              switch (shaderCopy.shadingType) {
                case ConfigurationTypes.Unique:
                  const uniqueValues = Array.from(uniqueStrings);
                  shaderCopy.breakDefinitions = generateUniqueValues(uniqueValues, colorPalette, fillPalette);
                  break;
                case ConfigurationTypes.Ramp:
                  shaderCopy.breakDefinitions = generateContinuousValues(calculateStatistics(valuesForStats), colorPalette);
                  break;
                case ConfigurationTypes.ClassBreak:
                  if (shaderCopy.dynamicallyAllocate) {
                    const stats = calculateStatistics(valuesForStats, shaderCopy.dynamicAllocationSlots || 4);
                    let symbology = [ ...(shaderCopy.userBreakDefaults || []) ];
                    if (shaderCopy.dynamicLegend) {
                      symbology = generateDynamicSymbology(stats, colorPalette, fillPalette);
                    }
                    shaderCopy.breakDefinitions = generateDynamicClassBreaks(stats, shaderCopy.dynamicAllocationType, symbology);
                  }
                  break;
              }
              this.esriShaderService.updateShader(shaderCopy);
            });
          }
        });
      }
    });
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
      filterByFeaturesOfInterest: dataKey !== '',
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
    const legacyPrefs = (project.impProjectPrefs || []).filter(p => p.prefGroup === 'map-settings');
    const isFiltered = legacyPrefs.filter(p => p.pref === 'Thematic-Extent' && p.val === 'Selected Geos only').length > 0;
    const paletteKey = legacyPrefs.filter(p => p.pref === 'Theme')[0];
    const legacyTheme = paletteKey != null ? ColorPalette[paletteKey.val] : ColorPalette.EsriPurple;
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
      opacity: isAlsoShaded ? 1 : 0.25,
      visible: true,
      minScale: null,
      defaultSymbolDefinition: {
        fillColor: isAlsoShaded ? [0, 0, 0, 1] : [0, 255, 0, 1],
        fillType: isAlsoShaded ? 'backward-diagonal' : 'solid',
      },
      filterByFeaturesOfInterest: true,
      filterField: 'geocode',
      shadingType: ConfigurationTypes.Simple
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
    const layerConfig = this.config.getLayerConfigForAnalysisLevel(newAnalysisLevel);
    const newPortalId = this.config.getLayerIdForAnalysisLevel(newAnalysisLevel, true);
    const newSelectedLayerName = `Selected ${newAnalysisLevel}s`;
    if (definition.sourcePortalId == null || isNewAnalysisLevel) {
      definition.sourcePortalId = newPortalId;
      definition.minScale = layerConfig.boundaries.minScale;
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

  updateForOwnerSite(definition: ShadingDefinition, geos: ImpGeofootprintGeo[], showDuplicates: boolean = false) : void {
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
          const matchingAttribute = geo.impGeofootprintLocation.impGeofootprintLocAttribs.filter(a => a.attributeCode === secondaryKey)[0];
          siteEntry = matchingAttribute == null ? null : matchingAttribute.attributeValue;
        }
        const isDeduped = showDuplicates ? true : geo.isDeduped === 1;
        if (geo.impGeofootprintLocation && geo.impGeofootprintLocation.isActive &&
          geo.impGeofootprintTradeArea && geo.impGeofootprintTradeArea.isActive &&
          geo.isActive && isDeduped) {
          result[geo.geocode] = siteEntry;
          activeSiteEntries.add(siteEntry);
        }
        allSiteEntries.add(siteEntry);
        return result;
      }, {});
      definition.arcadeExpression = createDataArcade(data);
      const sorter = useCustomSorter ? CommonSort.StringsAsNumbers : null;
      const colorPalette = getColorPalette(definition.theme, definition.reverseTheme);
      const fillPalette = getFillPalette(definition.theme, definition.reverseTheme);
      definition.breakDefinitions = generateUniqueValues(Array.from(allSiteEntries), colorPalette, fillPalette, sorter);
      definition.breakDefinitions = definition.breakDefinitions.filter(b => activeSiteEntries.has(b.value));
    }
  }

  updateForOwnerTA(definition: ShadingDefinition, geos: ImpGeofootprintGeo[], showDuplicates: boolean = true) : void {
    if (definition != null && definition.shadingType === ConfigurationTypes.Unique) {
      if (definition.theme == null) definition.theme = ColorPalette.CpqMaps;
      const deferredHomeGeos: ImpGeofootprintGeo[] = [];
      const tradeAreaTypesInPlay = new Set<TradeAreaTypeCodes>();
      let radiusForFirstTa: string;
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
              if (geo.impGeofootprintTradeArea.taNumber === 1) {
                radiusForFirstTa = currentEntry;
              }
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
            activeTAEntries.add(currentEntry);
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
          activeTAEntries.add(hgEntry);
        }
        allTAEntries.add(hgEntry);
        data[hg.geocode] = AppRendererService.getHomeGeoTradeAreaDescriptor(tradeAreaTypesInPlay, radiusForFirstTa);
      });
      definition.arcadeExpression = createDataArcade(data);
      const colorPalette = getColorPalette(definition.theme, definition.reverseTheme);
      const fillPalette = getFillPalette(definition.theme, definition.reverseTheme);
      definition.breakDefinitions = generateUniqueValues(Array.from(allTAEntries), colorPalette, fillPalette, ValSort.TradeAreaByTypeString);
      definition.breakDefinitions = definition.breakDefinitions.filter(b => activeTAEntries.has(b.value));
    }
  }
}
