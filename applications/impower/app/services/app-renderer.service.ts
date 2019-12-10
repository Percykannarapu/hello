import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { calculateStatistics } from '@val/common';
import {
  clearFeaturesOfInterest,
  clearShadingDefinitions,
  ConfigurationTypes,
  createDataArcade,
  EsriLayerService,
  EsriMapService,
  generateContinuousValues,
  generateUniqueValues,
  getColorPalette,
  loadShadingDefinitions,
  setFeaturesOfInterest,
  ShadingDefinition,
  shadingSelectors,
  updateShadingDefinition
} from '@val/esri';
import { AppConfig } from 'app/app.config';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, take, tap, withLatestFrom } from 'rxjs/operators';
import { MapVar } from '../impower-datastore/state/transient/map-vars/map-vars.model';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { FullAppState } from '../state/app.interfaces';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

@Injectable()
export class AppRendererService {
  private selectedWatcher: Subscription;

  constructor(private appStateService: AppStateService,
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
      combineLatest([this.appStateService.analysisLevel$, this.appStateService.applicationIsReady$]).pipe(
        filter(([al, ready]) => al != null && ready),
        map(([al]) => al),
        withLatestFrom(this.appStateService.currentProject$)
      ).subscribe(([al, project]) => {
        this.store$.dispatch(clearFeaturesOfInterest());
        this.store$.dispatch(clearShadingDefinitions());
        const shadingDefinitions = this.createShadingDefinitionsFromLegacy(project, al);
        this.store$.dispatch(loadShadingDefinitions({ shadingDefinitions }));
        this.appStateService.clearVisibleGeos();
        this.setupGeoWatchers(this.impGeoService.storeObservable);
        setTimeout(() => this.appStateService.refreshVisibleGeos());
      });
      this.setupMapVarWatcher();
    });
  }

  private setupGeoWatchers(geoDataStore: Observable<ImpGeofootprintGeo[]>) : void {
    if (this.selectedWatcher) this.selectedWatcher.unsubscribe();
    this.selectedWatcher = geoDataStore.pipe(
      filter(geos => geos != null),
      debounceTime(500),
      map(geos => Array.from(new Set(geos.reduce((a, c) => {
        if (c.isActive) a.push(c.geocode);
        return a;
      }, [])))),
      tap(geocodes => geocodes.sort())
    ).subscribe(features => this.store$.dispatch(setFeaturesOfInterest({ features })));
  }

  private setupMapVarWatcher() {
    this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(this.store$.select(shadingSelectors.allLayerDefs), this.store$.select(shadingSelectors.theme)),
    ).subscribe(([mapVars, layerDefs, theme]) => {
      const varPk = Object.keys(mapVars[0]).filter(key => key !== 'geocode').map(key => Number(key))[0];
      if (varPk != null) {
        const shadingLayer = layerDefs.filter(ld => ld.id === varPk)[0];
        if (shadingLayer != null) {
          const shadingDefinition: Update<ShadingDefinition> = { id: varPk, changes: {} };
          const arcadeExpression = this.convertMapVarsToArcade(mapVars, varPk);
          const palette = getColorPalette(theme);
          switch (shadingLayer.shadingType) {
            case ConfigurationTypes.Unique:
              const uniqueValues = Array.from(new Set(mapVars.map(v => v[varPk].toString())));
              shadingDefinition.changes = {
                arcadeExpression,
                breakDefinitions: generateUniqueValues(uniqueValues, palette)
              };
              break;
            case ConfigurationTypes.Ramp:
              const stats = calculateStatistics(mapVars.map(mv => Number(mv[varPk])));
              shadingDefinition.changes = {
                arcadeExpression,
                breakDefinitions: generateContinuousValues(stats, palette)
              };
              break;
          }
          this.store$.dispatch(updateShadingDefinition({ shadingDefinition }));
        }
      }
    });
  }

  createShadingDefinitionsFromLegacy(project: ImpProject, altAnalysisLevel?: string) : ShadingDefinition[] {
    const result: ShadingDefinition[] = [];
    const usableAnalysisLevel = project.methAnalysis || altAnalysisLevel;
    if (usableAnalysisLevel == null || usableAnalysisLevel.length === 0) return result;

    const shadingData: ImpProjectVar[] = project.impProjectVars.filter(p => p.isShadedOnMap);
    const legacyPrefs = (project.impProjectPrefs || []).filter(p => p.prefGroup === 'map-settings');
    const isFiltered = legacyPrefs.filter(p => p.pref === 'Thematic-Extent' && p.val === 'Selected Geos only').length > 0;
    const selectionDefinition = this.createSelectionShadingDefinition(usableAnalysisLevel, shadingData.length > 0);
    if (shadingData.length === 0 || !isFiltered) {
      result.push(selectionDefinition);
    }
    shadingData.forEach((sd, index) => {
      result.push(this.createVariableShadingDefinition(sd, usableAnalysisLevel, isFiltered, index + 1));
    });
    return result;
  }

  private createSelectionShadingDefinition(analysisLevel: string, isAlsoShaded: boolean) : ShadingDefinition {
    const layerConfig = this.config.getLayerConfigForAnalysisLevel(analysisLevel);
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel, true);
    return {
      id: 0,
      sortOrder: 0,
      sourcePortalId: layerId,
      layerName: `Selected ${analysisLevel}s`,
      showLegendHeader: false,
      opacity: isAlsoShaded ? 1 : 0.25,
      minScale: layerConfig.boundaries.minScale,
      defaultSymbolDefinition: {
        fillColor: isAlsoShaded ? [0, 0, 0, 1] : [0, 255, 0, 1],
        fillType: isAlsoShaded ? 'backward-diagonal' : 'solid',
        legendName: `Selected ${analysisLevel}s`
      },
      filterByFeaturesOfInterest: true,
      filterField: 'geocode',
      shadingType: ConfigurationTypes.Simple
    };
  }

  private createVariableShadingDefinition(projectVar: ImpProjectVar, analysisLevel: string, isFiltered: boolean, index: number) : ShadingDefinition {
    const layerConfig = this.config.getLayerConfigForAnalysisLevel(analysisLevel);
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel, true);
    const isNumeric = projectVar.fieldconte !== 'CHAR';
    return {
      id: projectVar.varPk,
      sortOrder: index,
      sourcePortalId: layerId,
      layerName: projectVar.fieldname,
      legendHeader: projectVar.fieldname,
      showLegendHeader: !isNumeric,
      opacity: 0.5,
      minScale: layerConfig.boundaries.minScale,
      defaultSymbolDefinition: {
        fillColor: [0, 0, 0, 0],
        fillType: 'solid'
      },
      filterByFeaturesOfInterest: isFiltered,
      filterField: 'geocode',
      shadingType: isNumeric ? ConfigurationTypes.Ramp : ConfigurationTypes.Unique
    };
  }

  private convertMapVarsToArcade(mapVars: MapVar[], varPk: number) : string {
    const obj: Record<string, string | number> = mapVars.reduce((result, mapVar) => {
      result[mapVar.geocode] = mapVar[varPk];
      return result;
    }, {});
    return createDataArcade(obj);
  }
}
