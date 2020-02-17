import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { calculateStatistics, filterArray, getUuid } from '@val/common';
import {
  ColorPalette,
  ConfigurationTypes,
  createDataArcade,
  EsriLayerService,
  EsriMapService,
  generateContinuousValues,
  generateDynamicClassBreaks,
  generateUniqueValues,
  getColorPalette,
  isComplexShadingDefinition,
  loadShadingDefinitions,
  resetShading,
  RgbTuple,
  setFeaturesOfInterest,
  ShadingDefinition,
  shadingSelectors,
  updateShadingDefinition,
  upsertShadingDefinitions
} from '@val/esri';
import { AppConfig } from 'app/app.config';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, take, tap, withLatestFrom } from 'rxjs/operators';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { GfpShaderKeys } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { TradeAreaTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

@Injectable()
export class AppRendererService {
  private selectedWatcher: Subscription;
  private ownerWatcher: Subscription;

  constructor(private appStateService: AppStateService,
              private appPrefService: AppProjectPrefService,
              private impGeoService: ImpGeofootprintGeoService,
              private dataService: TargetAudienceService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private config: AppConfig,
              private logger: LoggingService,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      if (!this.config.isBatchMode) {
        this.setupAnalysisLevelWatcher();
        this.setupProjectPrefsWatcher();
      }
      this.setupGeoWatchers(this.impGeoService.storeObservable);
      this.setupMapVarWatcher();
    });
  }

  private static getHomeGeoTradeAreaDescriptor(tradeAreaTypesInPlay: Set<TradeAreaTypeCodes>) : string {
    if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.Radius)) {
      return 'Trade Area 1';
    } else if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.Custom)) {
      return 'Custom';
    } else if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.Manual)) {
      return 'Manual';
    } else if (tradeAreaTypesInPlay.has(TradeAreaTypeCodes.MustCover)) {
      return 'Must Cover';
    }
  }

  private setupProjectPrefsWatcher() : void {
    this.store$.select(shadingSelectors.allLayerDefs).subscribe(sd => {
      this.appPrefService.createPref('esri', 'map-shading-defs', JSON.stringify(sd));
    });
  }

  private setupAnalysisLevelWatcher() : void {
    this.appStateService.analysisLevel$.pipe(
      withLatestFrom(this.appStateService.applicationIsReady$),
      filter(([al, ready]) => al != null && ready),
      map(([al]) => al),
      distinctUntilChanged(),
      withLatestFrom(this.appStateService.currentProject$)
    ).subscribe(([al, project]) => {
      this.store$.dispatch(resetShading());
      const shadingDefinitions = this.getShadingDefinitions(project);
      shadingDefinitions.forEach(sd => {
        this.updateForAnalysisLevel(sd, al);
      });
      if (shadingDefinitions.length === 0) {
        shadingDefinitions.push(this.createSelectionShadingDefinition(al, false));
      }
      this.store$.dispatch(loadShadingDefinitions({ shadingDefinitions }));
    });
  }

  private setupGeoWatchers(geoDataStore: Observable<ImpGeofootprintGeo[]>) : void {
    if (this.selectedWatcher) this.selectedWatcher.unsubscribe();
    this.selectedWatcher = geoDataStore.pipe(
      filter(geos => geos != null),
      debounceTime(500),
      map(geos => Array.from(new Set(geos.reduce((a, c) => {
        if (c.impGeofootprintLocation.isActive && c.impGeofootprintTradeArea.isActive && c.isActive) a.push(c.geocode);
        return a;
      }, [])))),
      tap(geocodes => geocodes.sort())
    ).subscribe(features => this.store$.dispatch(setFeaturesOfInterest({ features })));
  }

  private setupMapVarWatcher() {
    this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(this.store$.select(shadingSelectors.allLayerDefs), this.appStateService.uniqueSelectedGeocodes$)
    ).subscribe(([mapVars, layerDefs, geocodes]) => {
      const varPks = Object.keys(mapVars[0]).filter(key => key !== 'geocode').map(key => Number(key));
      if (varPks != null) {
        const currentGfpGeos = new Set(geocodes);
        const filteredMapVars = mapVars.filter(mv => currentGfpGeos.has(mv.geocode));
        varPks.forEach(varPk => {
          const shadingLayers = layerDefs.filter(ld => ld.dataKey === varPk.toString());
          if (shadingLayers != null) {
            shadingLayers.forEach(shadingLayer => {
              const currentMapVars = shadingLayer.filterByFeaturesOfInterest ? filteredMapVars : mapVars;
              const shadingDefinition: Update<ShadingDefinition> = { id: shadingLayer.id, changes: null };
              const uniqueStrings = new Set<string>();
              const valuesForStats: number[] = [];
              const mapVarDictionary: Record<string, string | number> = currentMapVars.reduce((result, mapVar) => {
                result[mapVar.geocode] = mapVar[varPk];
                switch (shadingLayer.shadingType) {
                  case ConfigurationTypes.Unique:
                    uniqueStrings.add(mapVar[varPk] == null ? '' : `${mapVar[varPk]}`);
                    break;
                  case ConfigurationTypes.Ramp:
                  case ConfigurationTypes.ClassBreak:
                    valuesForStats.push(Number(mapVar[varPk]));
                    break;
                }
                return result;
              }, {});
              const arcadeExpression = createDataArcade(mapVarDictionary);
              let palette: RgbTuple[] = [];
              if (isComplexShadingDefinition(shadingLayer)) {
                palette = getColorPalette(shadingLayer.theme, shadingLayer.reverseTheme);
              }
              switch (shadingLayer.shadingType) {
                case ConfigurationTypes.Unique:
                  const uniqueValues = Array.from(uniqueStrings);
                  shadingDefinition.changes = {
                    arcadeExpression,
                    breakDefinitions: generateUniqueValues(uniqueValues, palette)
                  };
                  break;
                case ConfigurationTypes.Ramp:
                  shadingDefinition.changes = {
                    arcadeExpression,
                    breakDefinitions: generateContinuousValues(calculateStatistics(valuesForStats), palette)
                  };
                  break;
                case ConfigurationTypes.DotDensity:
                  shadingDefinition.changes = {
                    arcadeExpression
                  };
                  break;
                case ConfigurationTypes.ClassBreak:
                  if (shadingLayer.dynamicallyAllocate) {
                    const stats = calculateStatistics(valuesForStats, shadingLayer.dynamicAllocationSlots || 4);
                    shadingDefinition.changes = {
                      arcadeExpression,
                      breakDefinitions: generateDynamicClassBreaks(stats, palette, shadingLayer.dynamicAllocationType)
                    };
                  }
                  break;
              }
              if (shadingDefinition.changes != null) {
                this.store$.dispatch(updateShadingDefinition({ shadingDefinition }));
              }
            });
          }
        });
      }
    });
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

  updateForAnalysisLevel(definition: ShadingDefinition, newAnalysisLevel: string) : void {
    const layerConfig = this.config.getLayerConfigForAnalysisLevel(newAnalysisLevel);
    if (definition.sourcePortalId == null) {
      definition.sourcePortalId = this.config.getLayerIdForAnalysisLevel(newAnalysisLevel, true);
      definition.minScale = layerConfig.boundaries.minScale;
    }
    if (definition.dataKey === 'selection-shading' && definition.layerName == null) {
      definition.layerName = `Selected ${newAnalysisLevel}s`;
      definition.defaultSymbolDefinition.legendName = `Selected ${newAnalysisLevel}s`;
    }
  }

  registerGeoOwnerWatcher() : void {
    if (this.ownerWatcher) return;

    this.ownerWatcher = this.impGeoService.storeObservable.pipe(
      filterArray(g => g.impGeofootprintLocation && g.impGeofootprintLocation.isActive && g.impGeofootprintTradeArea && g.impGeofootprintTradeArea.isActive && g.isActive && g.isDeduped === 1),
      withLatestFrom(this.appStateService.currentProject$)
    ).subscribe(([geos, project]) => {
      const ownerKeys = new Set<string>([GfpShaderKeys.OwnerSite, GfpShaderKeys.OwnerTA]);
      const definitions = this.getShadingDefinitions(project).filter(sd => ownerKeys.has(sd.dataKey));
      const newDefs = definitions.reduce((updates, definition) => {
        if (definition != null && isComplexShadingDefinition(definition)) {
          const newDef = { ...definition };
          switch (newDef.dataKey) {
            case GfpShaderKeys.OwnerSite:
              this.updateForOwnerSite(newDef, geos);
              break;
            case GfpShaderKeys.OwnerTA:
              this.updateForOwnerTA(newDef, geos);
          }
          updates.push(newDef);
        }
        return updates;
      }, []);
      if (newDefs.length > 0) {
        this.store$.dispatch(upsertShadingDefinitions({ shadingDefinitions: newDefs }));
      }
    });
  }

  updateForOwnerSite(definition: ShadingDefinition, geos: ImpGeofootprintGeo[]) : void {
    if (definition != null && definition.shadingType === ConfigurationTypes.Unique) {
      definition.theme = ColorPalette.Cpqmaps;
      const data: Record<string, string> = geos.reduce((result, geo) => {
        if (geo.isDeduped === 1) {
          const secondaryKey = definition.secondaryDataKey || 'locationNumber';
          if (geo.impGeofootprintLocation.hasOwnProperty(secondaryKey)) {
            result[geo.geocode] = geo.impGeofootprintLocation[secondaryKey];
          } else {
            const matchingAttribute = geo.impGeofootprintLocation.impGeofootprintLocAttribs.filter(a => a.attributeCode === secondaryKey)[0];
            result[geo.geocode] = matchingAttribute == null ? null : matchingAttribute.attributeValue;
          }
        }
        return result;
      }, {});
      definition.arcadeExpression = createDataArcade(data);
      const legendEntries = new Set(Object.values(data));
      definition.breakDefinitions = generateUniqueValues(Array.from(legendEntries), getColorPalette(definition.theme, definition.reverseTheme));
    }
  }

  updateForOwnerTA(definition: ShadingDefinition, geos: ImpGeofootprintGeo[]) : void {

    if (definition != null && isComplexShadingDefinition(definition)) {
      definition.theme = ColorPalette.Cpqmaps;
      const deferredHomeGeos: ImpGeofootprintGeo[] = [];
      const tradeAreaTypesInPlay = new Set<TradeAreaTypeCodes>();
      const data: Record<string, string> = geos.reduce((result, geo) => {
        switch (geo.impGeofootprintTradeArea.taType.toUpperCase()) {
          case TradeAreaTypeCodes.Radius.toUpperCase():
            const taNumber = geo.geocode === geo.impGeofootprintLocation.homeGeocode ? 1 : geo.impGeofootprintTradeArea.taNumber;
            result[geo.geocode] = `Trade Area ${taNumber}`;
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.Radius);
            break;
          case TradeAreaTypeCodes.HomeGeo.toUpperCase():
            deferredHomeGeos.push(geo);
            break;
          case TradeAreaTypeCodes.Custom.toUpperCase():
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              result[geo.geocode] = 'Custom';
            }
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.Custom);
            break;
          case TradeAreaTypeCodes.Manual.toUpperCase():
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              result[geo.geocode] = 'Manual';
            }
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.Manual);
            break;
          case TradeAreaTypeCodes.MustCover.toUpperCase():
            if (geo.geocode === geo.impGeofootprintLocation.homeGeocode) {
              deferredHomeGeos.push(geo);
            } else {
              result[geo.geocode] = 'Must Cover';
            }
            tradeAreaTypesInPlay.add(TradeAreaTypeCodes.MustCover);
            break;
        }
        return result;
      }, {});
      deferredHomeGeos.forEach(hg => {
        data[hg.geocode] = AppRendererService.getHomeGeoTradeAreaDescriptor(tradeAreaTypesInPlay);
      });
      definition.arcadeExpression = createDataArcade(data);
      const legendEntries = new Set(Object.values(data));
      definition.breakDefinitions = generateUniqueValues(Array.from(legendEntries), getColorPalette(definition.theme, definition.reverseTheme));
    }
  }
}
