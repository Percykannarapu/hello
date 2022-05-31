import { Injectable } from '@angular/core';
import Query from '@arcgis/core/rest/support/Query';
import { Store } from '@ngrx/store';
import {
  collectStatistics,
  CompleteCollectedStatistics,
  getCollectedStatistics,
  getIntervalsFromCollectedStats,
  isConvertibleToNumber,
  isEmpty,
  isNil,
  reduceConcat,
  skipUntilFalseBecomesTrue,
  Statistics
} from '@val/common';
import {
  addLayerToLegend,
  ConfigurationTypes,
  EsriConfigService,
  EsriDomainFactory,
  EsriLayerService,
  EsriQueryService,
  EsriShadingService,
  FillPattern,
  FillSymbolDefinition,
  generateContinuousValues,
  generateDynamicClassBreaks,
  generateDynamicSymbology,
  generateUniqueValues,
  getColorPalette,
  getFillPalette,
  isComplexShadingDefinition,
  LayerTypes,
  nationalShadingSelectors,
  RampProperties,
  RgbTuple,
  ShadingDefinition,
  updateShadingDefinition
} from '@val/esri';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, take, tap, withLatestFrom } from 'rxjs/operators';
import { NationalAudienceModel } from '../common/models/audience-data.model';
import { AudienceFetchService } from '../impower-datastore/services/audience-fetch.service';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { allAudiences } from '../impower-datastore/state/transient/audience/audience.selectors';
import { allCustomVarEntities } from '../impower-datastore/state/transient/custom-vars/custom-vars.selectors';
import { FullAppState } from '../state/app.interfaces';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class NationalMapService {

  private layersInFlight = new Set<string>();
  private layerStats = new Map<string, CompleteCollectedStatistics>();

  constructor(private appStateService: AppStateService,
              private audienceFetch: AudienceFetchService,
              private esriService: EsriConfigService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService,
              private shaderService: EsriShadingService,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      skipUntilFalseBecomesTrue(),
      take(1)
    ).subscribe(() => {
      this.initialize();
    });
  }

  private static createSymbolFromDefinition(def: FillSymbolDefinition) : __esri.SimpleFillSymbol {
    const currentDef: FillSymbolDefinition = { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 0, 0, 0], outlineWidth: 1, ...(def || {}) };
    const outline = EsriDomainFactory.createSimpleLineSymbol(currentDef.outlineColor, currentDef.outlineWidth);
    return EsriDomainFactory.createSimpleFillSymbol(currentDef.fillColor, outline, currentDef.fillType);
  }

  private initialize() : void {
    this.setupLayerCreationWatcher();
    this.setupLayerUpdateWatcher();
  }

  private setupLayerCreationWatcher() : void {
    const nationalDefs$ = this.store$.select(nationalShadingSelectors.layerDefsToCreate).pipe(
      filter(nationalDefs => nationalDefs.length > 0)
    );
    const validAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => !isEmpty(al)));
    nationalDefs$.pipe(
      withLatestFrom(validAnalysisLevel$, this.store$.select(allAudiences))
    ).subscribe(([defs, analysisLevel, audiences]) => {
      defs.forEach(d => {
        if (!this.layersInFlight.has(d.id)) {
          this.layerService.longLayerLoadInProgress$.next(true);
          this.layersInFlight.add(d.id);
          this.createNationalLayer(d, analysisLevel, audiences).pipe(
            take(1)
          ).subscribe(id => {
            this.store$.dispatch(updateShadingDefinition({ shadingDefinition: { id: d.id, changes: { destinationLayerUniqueId: id }}}));
            this.store$.dispatch(addLayerToLegend({ layerUniqueId: id, title: d.layerName, showDefaultSymbol: false }));
            setTimeout(() => {
              this.layersInFlight.delete(d.id);
              this.layerService.longLayerLoadInProgress$.next(false);
            }, 500);
          });
        }
      });
    });
  }

  private setupLayerUpdateWatcher() : void {
    this.store$.select(nationalShadingSelectors.layerDefsForUpdate).pipe(
      filter(nationalDefs => nationalDefs.length > 0)
    ).subscribe(defs => {
      defs.forEach(d => {
        const currentVarPk = isConvertibleToNumber(d.dataKey) ? Number(d.dataKey) : null;
        const currentStats = this.layerStats.get(d.destinationLayerUniqueId);
        if (!this.layersInFlight.has(d.id) && !isNil(currentVarPk) && !isNil(currentStats)) {
          const layer = this.layerService.getFeatureLayerByUniqueId(d.destinationLayerUniqueId);
          const newRenderer = this.createNationalRenderer(d, currentVarPk, currentStats);
          const layerProps: __esri.FeatureLayerProperties = {
            title: d.layerName,
            opacity: d.opacity,
            visible: d.visible,
            renderer: newRenderer,
          };
          layer.set(layerProps);
        }
      });
    });
  }

  private createNationalLayer(config: ShadingDefinition, analysisLevel: string, audiences: Audience[]) : Observable<string> {
    const query = new Query({ returnGeometry: true, outFields: ['geocode'] });
    const layerUrl = this.esriService.getLayerUrl(config.layerKey, LayerTypes.Polygon, true);
    const polygons$ = this.queryService.executeParallelQuery(layerUrl, query, 5000, 3).pipe(
      map(fs => fs.features),
      reduceConcat()
    );
    const data$ = this.getAudienceData(config, audiences, analysisLevel);
    const currentVarPk = isConvertibleToNumber(config.dataKey) ? Number(config.dataKey) : null;
    return combineLatest([polygons$, data$]).pipe(
      map(([features, data]) => this.mergeDataToLayer(config, features, data, currentVarPk)),
      tap(layer => {
        const group = this.layerService.createClientGroup('Shading', true, true);
        if (!isNil(group)) group.layers.unshift(layer);
      }),
      map(layer => layer.id)
    );
  }

  private getAudienceData(config: ShadingDefinition, audiences: Audience[], analysisLevel: string) : Observable<NationalAudienceModel> {
    const requestedAudiences = audiences.filter(a => a.audienceIdentifier === config.dataKey);
    const fetchableAudiences = audiences.filter(a => a.audienceSourceType !== 'Custom');
    if (requestedAudiences.some(a => a.audienceSourceType === 'Custom')) {
      return this.store$.select(allCustomVarEntities).pipe(
        map(entity => ({ data: entity, stats: {} }))
      );
    } else {
      return this.audienceFetch.getNationalAudienceData(requestedAudiences, fetchableAudiences, analysisLevel, false);
    }
  }

  private mergeDataToLayer(config: ShadingDefinition, features: __esri.Graphic[], data: NationalAudienceModel, varPk: number) : __esri.FeatureLayer {
    let oid = 0;
    let currentStats: CompleteCollectedStatistics = data.stats[varPk];
    const dataType = config.shadingType === ConfigurationTypes.Unique ? 'string' : 'double';
    features.forEach(feat => {
      if (!isNil(feat.attributes.geocode) && !isNil(data.data[feat.attributes.geocode])) {
        const dataValue = data.data[feat.attributes.geocode][varPk];
        feat.attributes.esri_oid = oid++;
        if (!isNil(dataValue)) {
          feat.attributes[varPk] = isEmpty(dataValue) ? null : dataValue;
          if (isNil(currentStats)) {
            collectStatistics(varPk, dataValue);
          }
        }
      }
    });
    if (isNil(currentStats)) {
      const customStats = getCollectedStatistics(true);
      currentStats = customStats[varPk];
    }
    if (config.shadingType === ConfigurationTypes.ClassBreak) {
      currentStats = {
        ...currentStats,
        ...getIntervalsFromCollectedStats(currentStats, config.dynamicAllocationSlots)
      };
    }
    config.defaultSymbolDefinition.fillColor = [0, 0, 0, 0];
    const today = new Date();
    const copyrightToday = new Date(today);
    copyrightToday.setDate(copyrightToday.getDate() + 14);
    const newRenderer = this.createNationalRenderer(config, varPk, currentStats);
    const layerProps: __esri.FeatureLayerProperties = {
      fields: [{ name: 'esri_oid', alias: 'ObjectId', type: 'oid' }, { name: 'geocode', alias: 'Geocode', type: 'string' }, { name: `${varPk}`, alias: 'RenderData', type: dataType }],
      title: config.layerName,
      copyright: varPk > 100 ? `Portions © 2006-${copyrightToday.getFullYear()} TomTom and Valassis DirectMail, Inc.` : null,
      popupEnabled: false,
      labelingInfo: [],
      labelsVisible: false,
      legendEnabled: true,
      outFields: ['*'],
      opacity: config.opacity,
      renderer: newRenderer,
    };
    const result = this.layerService.createLocalPolygonLayer(features, layerProps);
    this.layerStats.set(result.id, currentStats);
    return result;
  }

  private createNationalRenderer(config: ShadingDefinition, varPk: number, stats: Statistics) : __esri.Renderer {
    const defaultSymbol = NationalMapService.createSymbolFromDefinition(config.defaultSymbolDefinition);
    let colorPalette: RgbTuple[] = [];
    let fillPalette: FillPattern[] = [];
    if (isComplexShadingDefinition(config)) {
      colorPalette = getColorPalette(config.theme, config.reverseTheme);
      fillPalette = getFillPalette(config.theme, config.reverseTheme);
    }

    switch (config.shadingType) {
      case ConfigurationTypes.ClassBreak:
        if (config.dynamicallyAllocate) {
          let symbology = [ ...(config.userBreakDefaults || []) ];
          if (config.dynamicLegend) {
            symbology = generateDynamicSymbology(stats, colorPalette, fillPalette);
          }
          config.breakDefinitions = generateDynamicClassBreaks(stats, config.dynamicAllocationType, symbology);
        }
        const classBreaks: __esri.ClassBreakInfoProperties[] = config.breakDefinitions.map(d => ({
          minValue: d.minValue || Number.MIN_VALUE,
          maxValue: d.maxValue || Number.MAX_VALUE,
          label: d.legendName,
          symbol: NationalMapService.createSymbolFromDefinition(d)
        }));
        classBreaks.reverse();
        const breaksRenderer = EsriDomainFactory.createClassBreakRenderer(defaultSymbol, classBreaks);
        breaksRenderer.field = `${varPk}`;
        return breaksRenderer;
      case ConfigurationTypes.DotDensity:
        const dotAttributes: __esri.AttributeColorInfoProperties[] = [{
          field: `${varPk}`,
          color: config.dotColor,
          label: config.layerName
        }];
        const dotDensityRenderer = EsriDomainFactory.createDotDensityRenderer(defaultSymbol.outline, config.dotValue, dotAttributes);
        dotDensityRenderer.legendOptions = {
          unit: config.legendUnits
        };
        return dotDensityRenderer;
      case ConfigurationTypes.Simple:
        return EsriDomainFactory.createSimpleRenderer(defaultSymbol);
      case ConfigurationTypes.Unique:
        config.breakDefinitions = generateUniqueValues(stats.uniqueValues, colorPalette, fillPalette, false);
        const uniqueValues: __esri.UniqueValueInfoProperties[] = config.breakDefinitions.filter(b => !b.isHidden).map(u => ({ label: u.legendName, value: u.value, symbol: NationalMapService.createSymbolFromDefinition(u) }));
        const result = EsriDomainFactory.createUniqueValueRenderer(defaultSymbol, uniqueValues);
        result.field = `${varPk}`;
        return result;
      case ConfigurationTypes.Ramp:
        config.breakDefinitions = generateContinuousValues(stats, colorPalette);
        const stops = (config.breakDefinitions || []).map(c => ({ color: c.stopColor, label: c.stopName, value: c.stopValue }));
        stops.sort((a, b) => a.value - b.value);
        const visVar: RampProperties = {
          type: 'color',
          field: `${varPk}`,
          stops
        };
        return EsriDomainFactory.createSimpleRenderer(defaultSymbol, visVar);
      default:
        return null;
    }
  }
}
