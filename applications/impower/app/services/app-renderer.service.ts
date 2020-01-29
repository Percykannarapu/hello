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
  generateUniqueValues,
  getColorPalette,
  isNotSimpleShadingDefinition,
  loadShadingDefinitions,
  resetShading,
  RgbTuple,
  setFeaturesOfInterest,
  ShadingDefinition,
  shadingSelectors,
  updateShadingDefinition,
  upsertShadingDefinition
} from '@val/esri';
import { AppConfig } from 'app/app.config';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, take, tap, withLatestFrom } from 'rxjs/operators';
import { MapVar } from '../impower-datastore/state/transient/map-vars/map-vars.model';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { GfpShaderKeys } from '../models/ui-enums';
import { FullAppState } from '../state/app.interfaces';
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
  private ownerSiteWatcher: Subscription;
  private ownerTAWatcher: Subscription;

  constructor(private appStateService: AppStateService,
              private appPrefService: AppProjectPrefService,
              private impGeoService: ImpGeofootprintGeoService,
              private dataService: TargetAudienceService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private config: AppConfig,
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
      this.setupMapVarWatcher(this.impGeoService.storeObservable);
    });
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

  private setupMapVarWatcher(geoDataStore: Observable<ImpGeofootprintGeo[]>) {
    this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(this.store$.select(shadingSelectors.allLayerDefs), geoDataStore),
    ).subscribe(([mapVars, layerDefs, geos]) => {
      const varPks = Object.keys(mapVars[0]).filter(key => key !== 'geocode').map(key => Number(key));
      if (varPks != null) {
        const currentGfpGeos = new Set(geos.filter(g => g.isActive).map(g => g.geocode));
        const filteredMapVars = mapVars.filter(mv => currentGfpGeos.has(mv.geocode));
        varPks.forEach(varPk => {
          const shadingLayers = layerDefs.filter(ld => ld.dataKey === varPk.toString());
          if (shadingLayers != null) {
            shadingLayers.forEach(shadingLayer => {
              const currentMapVars = shadingLayer.filterByFeaturesOfInterest ? filteredMapVars : mapVars;
              const shadingDefinition: Update<ShadingDefinition> = { id: shadingLayer.id, changes: {} };
              const arcadeExpression = this.convertMapVarsToArcade(currentMapVars, varPk);
              let palette: RgbTuple[] = [];
              if (isNotSimpleShadingDefinition(shadingLayer)) {
                palette = getColorPalette(shadingLayer.theme);
              }
              switch (shadingLayer.shadingType) {
                case ConfigurationTypes.Unique:
                  const uniqueValues = Array.from(new Set(currentMapVars.map(v => v[varPk].toString())));
                  shadingDefinition.changes = {
                    arcadeExpression,
                    breakDefinitions: generateUniqueValues(uniqueValues, palette)
                  };
                  break;
                case ConfigurationTypes.Ramp:
                  const stats = calculateStatistics(currentMapVars.map(mv => Number(mv[varPk])));
                  shadingDefinition.changes = {
                    arcadeExpression,
                    breakDefinitions: generateContinuousValues(stats, palette)
                  };
                  break;
              }
              this.store$.dispatch(updateShadingDefinition({ shadingDefinition }));
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
      showLegendHeader: false,
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
    const result: ShadingDefinition = {
      id: getUuid(),
      dataKey: projectVar.varPk.toString(),
      sortOrder: index,
      sourcePortalId: null,
      layerName: projectVar.fieldname,
      legendHeader: projectVar.fieldname,
      showLegendHeader: !isNumeric,
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
    this.updateForAnalysisLevel(result, analysisLevel);
    return result;
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

  private convertMapVarsToArcade(mapVars: MapVar[], varPk: number) : string {
    const obj: Record<string, string | number> = mapVars.reduce((result, mapVar) => {
      result[mapVar.geocode] = mapVar[varPk];
      return result;
    }, {});
    return createDataArcade(obj);
  }

  registerOwnerSiteWatcher() : void {
    if (this.ownerSiteWatcher) {
      this.ownerSiteWatcher.unsubscribe();
      this.ownerSiteWatcher = null;
    }
    this.ownerSiteWatcher = this.impGeoService.storeObservable.pipe(
      filterArray(g => g.impGeofootprintLocation && g.impGeofootprintLocation.isActive && g.impGeofootprintTradeArea && g.impGeofootprintTradeArea.isActive && g.isActive),
      withLatestFrom(this.appStateService.currentProject$)
    ).subscribe(([geos, project]) => {
      const definition = this.getShadingDefinitions(project).filter(sd => sd.dataKey === GfpShaderKeys.OwnerSite)[0];
      if (definition != null) {
        this.updateForOwnerSite({ ...definition }, geos);
        this.store$.dispatch(upsertShadingDefinition({ shadingDefinition: definition }));
      }
    });
  }

  registerOwnerTAWatcher() : void {
    if (this.ownerTAWatcher) {
      this.ownerTAWatcher.unsubscribe();
      this.ownerTAWatcher = null;
    }
    this.ownerTAWatcher = this.impGeoService.storeObservable.pipe(
      filterArray(g => g.impGeofootprintLocation && g.impGeofootprintLocation.isActive && g.impGeofootprintTradeArea && g.impGeofootprintTradeArea.isActive && g.isActive),
      withLatestFrom(this.appStateService.currentProject$)
    ).subscribe(([geos, project]) => {
      const definition = this.getShadingDefinitions(project).filter(sd => sd.dataKey === GfpShaderKeys.OwnerTA)[0];
      if (definition != null) {
        this.updateForOwnerTA(definition, geos);
        this.store$.dispatch(upsertShadingDefinition({ shadingDefinition: definition }));
      }
    });
  }

  updateForOwnerSite(definition: ShadingDefinition, geos: ImpGeofootprintGeo[]) : void {
    if (definition != null && isNotSimpleShadingDefinition(definition)) {
      definition.theme = ColorPalette.Cpqmaps;
      const data: Record<string, string> = geos.reduce((result, geo) => {
        if (geo.isDeduped === 1) {
          result[geo.geocode] = geo.impGeofootprintLocation.locationNumber;
        }
        return result;
      }, {});
      definition.arcadeExpression = createDataArcade(data);
      const legendEntries = new Set(Object.values(data));
      definition.breakDefinitions = generateUniqueValues(Array.from(legendEntries), getColorPalette(definition.theme));
    }
  }

  updateForOwnerTA(definition: ShadingDefinition, geos: ImpGeofootprintGeo[]) : void {
    console.log('Updating for Trade Area', geos);
    if (definition != null && isNotSimpleShadingDefinition(definition)) {
      definition.theme = ColorPalette.Cpqmaps;
      const data: Record<string, string> = geos.reduce((result, geo) => {
        switch (geo.impGeofootprintTradeArea.taType.toUpperCase()) {
          case TradeAreaTypeCodes.Radius.toUpperCase():
            result[geo.geocode] = `${geo.impGeofootprintTradeArea.taNumber}`;
            break;
          case TradeAreaTypeCodes.HomeGeo.toUpperCase():
            result[geo.geocode] = '1';
            break;
          case TradeAreaTypeCodes.Custom.toUpperCase():
            result[geo.geocode] = 'Custom';
            break;
          case TradeAreaTypeCodes.Manual.toUpperCase():
            result[geo.geocode] = 'Manual';
            break;
          case TradeAreaTypeCodes.MustCover.toUpperCase():
            result[geo.geocode] = 'Must Cover';
            break;
        }
        return result;
      }, {});
      definition.arcadeExpression = createDataArcade(data);
      const legendEntries = new Set(Object.values(data));
      definition.breakDefinitions = generateUniqueValues(Array.from(legendEntries), getColorPalette(definition.theme));
    }
  }
}
