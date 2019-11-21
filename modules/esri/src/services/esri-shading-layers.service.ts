import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, Statistics } from '@val/common';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { MapVar } from '../../../../applications/impower/app/impower-datastore/state/transient/map-vars/map-vars.model';
import { SelectedShadingLayerPrefix } from '../../settings';
import * as EsriArcadeUtils from '../core/esri-arcade.utils';
import { ColorPalette, getColorPaletteAsEsriColor } from '../models/color-palettes';
import { FillPattern } from '../models/esri-types';
import { AllShadingConfigurations, ConfigurationTypes, SimpleShadingConfiguration, UniqueValueShadingConfiguration } from '../models/shading-configuration';
import { EsriState } from '../state/esri.selectors';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';

@Injectable()
export class EsriShadingLayersService {

  private currentAudienceShadingLayer: string;

  constructor(private layerService: EsriLayerService,
              private store$: Store<EsriState>,
              private domainFactory: EsriDomainFactoryService) { }

  static createSelectedFeatureLayerName(featureTypeName: string) : string {
    return `${SelectedShadingLayerPrefix} ${featureTypeName}s`;
  }

  selectedFeaturesShading(featureIds: string[], layerId: string, minScale: number, featureTypeName: string, useCrossHatching: boolean, featureIdField: string = 'geocode') : Observable<string> {
    const layerName = EsriShadingLayersService.createSelectedFeatureLayerName(featureTypeName);
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    const query = `${featureIdField} IN (${featureIds.map(g => `'${g}'`).join(',')})`;
    if (existingLayer == null) {
      const color: [number, number, number] = useCrossHatching ? [0, 0, 0] : [0, 255, 0];
      const opacity = useCrossHatching ? 1 : 0.25;
      const style: FillPattern = useCrossHatching ? 'forward-diagonal' : 'solid';
      const shadedSymbol = this.domainFactory.createSimpleFillSymbol(color, this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]), style);
      const layerConfiguration = new SimpleShadingConfiguration(layerId, layerName, minScale, opacity, layerName, shadedSymbol, query);
      return this.createShadingLayer(layerConfiguration, null, false).pipe(
        take(1), // ensures we clean up the subscription
        map(layer => layer.id),
      );
    } else {
      existingLayer.definitionExpression = query;
      return of(existingLayer.id);
    }
  }

  clearFeatureSelection(featureTypeName: string) : void {
    const layerName = EsriShadingLayersService.createSelectedFeatureLayerName(featureTypeName);
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    if (existingLayer != null) {
      this.layerService.removeLayerFromLegend(existingLayer.id);
      this.layerService.removeLayer(layerName);
    }
  }

  audienceShading(mapVars: MapVar[], layerId: string, minScale: number, theme: ColorPalette, layerName: string, isTextVariable: boolean) : Observable<[string, string]> {
    const arcadeData = this.convertArrayToRecord(mapVars);
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    let layerConfig: AllShadingConfigurations;
    let visualVariable: __esri.ColorVariableProperties;
    let title: string;
    if (!isTextVariable) {
      title = null;
      layerConfig = this.createSimpleConfiguration(layerId, layerName, minScale);
      visualVariable = this.createVisualVariable(layerName, arcadeData, theme);
    } else {
      title = layerName;
      layerConfig = this.createUniqueConfiguration(layerId, layerName, minScale, arcadeData, theme);
    }
    this.currentAudienceShadingLayer = layerName;
    if (existingLayer == null) {
      return this.createShadingLayer(layerConfig, visualVariable).pipe(
        take(1),
        map(layer => [layer.id, title]),
      );
    } else {
      existingLayer.renderer = this.createConfiguredRenderer(layerConfig, visualVariable);
      return of([existingLayer.id, title]);
    }
  }

  clearAudienceShading() : void {
    if (this.currentAudienceShadingLayer == null) return;
    this.layerService.removeLayer(this.currentAudienceShadingLayer);
    this.currentAudienceShadingLayer = null;
  }

  private createShadingLayer(config: AllShadingConfigurations, visualVariable?: __esri.ColorVariableProperties, addToBottom: boolean = true, groupName: string = 'Shading') : Observable<__esri.FeatureLayer> {
    const layerProps: Partial<__esri.FeatureLayer> = {
      definitionExpression: config.expression,
      popupEnabled: false,
      labelingInfo: [],
      labelsVisible: false,
      legendEnabled: true,
      outFields: ['geocode'],
      renderer: this.createConfiguredRenderer(config, visualVariable),
      opacity: config.opacity
    };
    return this.layerService.createPortalLayer(config.layerId, config.layerName, config.minScale, true, layerProps).pipe(
      tap(layer => {
        const group = this.layerService.createClientGroup(groupName, true, true);
        if (group) {
          if (addToBottom) {
            group.layers.unshift(layer);
          } else {
            group.layers.add(layer);
          }
        }
      })
    );
  }

  private createConfiguredRenderer(config: AllShadingConfigurations, visualVariable?: __esri.ColorVariableProperties) : __esri.Renderer {
    switch (config.type) {
      case ConfigurationTypes.DotDensity:
        const densityResult = this.domainFactory.createDotDensityRenderer(config.outline, config.dotValue, config.referenceScale, config.colorStops);
        densityResult.legendOptions = config.legendOptions;
        return densityResult;
      case ConfigurationTypes.Simple:
        const simpleResult = this.domainFactory.createSimpleRenderer(config.defaultSymbol, visualVariable);
        simpleResult.label = config.defaultLegendName;
        return simpleResult;
      case ConfigurationTypes.Unique:
        const uniqueResult = this.domainFactory.createUniqueValueRenderer(config.defaultSymbol, config.uniqueValues, visualVariable);
        uniqueResult.defaultLabel = config.defaultLegendName;
        uniqueResult.valueExpression = config.arcadeExpression;
        return uniqueResult;
      case ConfigurationTypes.ClassBreak:
        const classResult = this.domainFactory.createClassBreakRenderer(config.defaultSymbol, config.classBreaks, visualVariable);
        classResult.defaultLabel = config.defaultLegendName;
        classResult.valueExpression = config.arcadeExpression;
        classResult.legendOptions = config.classBreakLegendOptions;
        return classResult;
    }
  }

  private convertArrayToRecord(mapVars: MapVar[]) : Record<string, string | number> {
    const obj = {};
    mapVars.forEach((item) => {
      const keys = Object.keys(item);
      const index = keys.findIndex(key => key === 'geocode');
      keys.splice(index, 1);
      obj[item.geocode] = item[keys[0]];
    });
    return obj;
  }

  private createUniqueConfiguration(layerId: string, layerName: string, minScale: number, arcadeData: Record<string, string | number>, theme: ColorPalette) : UniqueValueShadingConfiguration {
    const arcadeExpression = EsriArcadeUtils.createDataArcade(arcadeData);
    const defaultSymbol = this.domainFactory.createSimpleFillSymbol([0, 0, 0, 0], this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]));
    const colors = getColorPaletteAsEsriColor(theme, 1);
    const uniqueData = Array.from(new Set(Object.values(arcadeData)));
    const breaks = this.generateClassBreaks(uniqueData, colors);
    return new UniqueValueShadingConfiguration(layerId, layerName, minScale, 0.25, arcadeExpression, null, defaultSymbol, breaks);
  }

  private createSimpleConfiguration(layerId: string, layerName: string, minScale: number) : SimpleShadingConfiguration {
    const defaultSymbol = this.domainFactory.createSimpleFillSymbol([0, 0, 0, 0], this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]));
    return new SimpleShadingConfiguration(layerId, layerName, minScale, 0.25, null, defaultSymbol);
  }

  private generateClassBreaks(dataValues: (string | number)[], colors: __esri.Color[]) : __esri.UniqueValueRendererUniqueValueInfos[] {
    if (dataValues == null || dataValues.length === 0) return [];
    const result: __esri.UniqueValueRendererUniqueValueInfos[] = [];
    dataValues.sort();
    dataValues.forEach((value, i) => {
      result.push({
        value: value,
        symbol: this.domainFactory.createSimpleFillSymbol(colors[i % colors.length], this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]))
      });
    });
    return result;
  }

  private createVisualVariable(title: string, arcadeData: Record<string, string | number>, theme: ColorPalette) : __esri.ColorVariableProperties {
    const arcadeExpression = EsriArcadeUtils.createDataArcade(arcadeData);
    const colors = getColorPaletteAsEsriColor(theme, 1);
    const statistics = calculateStatistics(Object.values(arcadeData).map(v => Number(v)));
    return {
      type: 'color',
      valueExpression: arcadeExpression,
      stops: this.generateContinuousStops(colors, statistics),
      legendOptions: { showLegend: true, title }
    } as any;
  }

  private generateContinuousStops(themeStops: __esri.Color[], statistics: Statistics) : __esri.ColorStop[] {
    const result: __esri.ColorStop[] = [];
    if (themeStops.length < 2) throw new Error('Themes must contain a minimum of 2 stops');
    const round = (n: number) => Math.round(n * 100) / 100;
    const mean = statistics.mean;
    const std = statistics.stdDeviation;
    const themeCount = themeStops.length;
    const stepSize = 2 / (themeCount - 1);
    const multipliers: number[] = new Array<number>(themeStops.length);
    multipliers[0] = -1;
    result.push({ color: themeStops[0], value: mean - std, label: `< ${round(mean - std)}` }as __esri.ColorStop);
    for (let n = 1; n < themeCount; ++n) {
      multipliers[n] = multipliers[n - 1] + stepSize;
      const currentValue = mean + (std * multipliers[n]);
      let currentLabel = null;
      if (multipliers[n] === 0) {
        currentLabel = `${round(mean)}`;
      }
      if (n === themeCount - 1) {
        currentLabel = `> ${round(currentValue)}`;
      }
      result.push({ color: themeStops[n], value: currentValue, label: currentLabel }as __esri.ColorStop);
    }
    return result;
  }
}
