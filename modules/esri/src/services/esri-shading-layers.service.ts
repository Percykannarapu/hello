import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { SelectedShadingLayerPrefix } from '../../settings';
import { EsriUtils } from '../core/esri-utils';
import { FillPattern } from '../models/esri-types';
import { AllShadingConfigurations, ConfigurationTypes, SimpleShadingConfiguration, UniqueValueShadingConfiguration } from '../models/shading-configuration';
import { EsriState } from '../state/esri.selectors';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriRendererService } from './esri-renderer.service';
import { MapVar } from '../../../../applications/impower/app/impower-datastore/state/transient/map-vars/map-vars.model';
import * as EsriArcadeUtils from '../core/esri-arcade.utils';

@Injectable()
export class EsriShadingLayersService {

  constructor(private layerService: EsriLayerService,
              private store$: Store<EsriState>,
              private rendererService: EsriRendererService,
              private domainFactory: EsriDomainFactoryService) { }

  static createSelectedFeatureLayerName(featureTypeName: string) : string {
    return `${SelectedShadingLayerPrefix} ${featureTypeName}s`;
  }

  createShadingLayer(config: AllShadingConfigurations, visualVariable?: __esri.ColorVariable, groupName: string = 'Shading') : Observable<__esri.FeatureLayer> {
    const layerProps: Partial<__esri.FeatureLayer> = {
      definitionExpression: config.expression,
      popupEnabled: false,
      labelingInfo: [],
      labelsVisible: false,
      legendEnabled: true,
      outFields: ['geocode'],
      renderer: this.createFullRenderer(config, visualVariable),
      opacity: config.opacity
    };
    return this.layerService.createPortalLayer(config.layerId, config.layerName, config.minScale, true, layerProps).pipe(
      tap(layer => {
        const group = this.layerService.createClientGroup(groupName, true, true);
        if (group) group.add(layer);
      })
    );
  }

  private createFullRenderer(config: AllShadingConfigurations, visualVariable?: __esri.ColorVariable) : __esri.Renderer {
    const renderer = this.createConfiguredRenderer(config);
    if (visualVariable && (EsriUtils.rendererIsSimple(renderer) || EsriUtils.rendererIsClassBreaks(renderer) || EsriUtils.rendererIsUnique(renderer))) {
      renderer.visualVariables = [ visualVariable ];
    }
    return renderer;
  }

  private createConfiguredRenderer(config: AllShadingConfigurations) : __esri.Renderer {
    switch (config.type) {
      case ConfigurationTypes.DotDensity:
        const densityResult = this.domainFactory.createDotDensityRenderer(config.outline, config.dotValue, config.referenceScale, config.colorStops);
        densityResult.legendOptions = config.legendOptions;
        return densityResult;
      case ConfigurationTypes.Simple:
        const simpleResult = this.domainFactory.createSimpleRenderer(config.defaultSymbol);
        simpleResult.label = config.defaultLegendName;
        return simpleResult;
      case ConfigurationTypes.Unique:
        const uniqueResult = this.domainFactory.createUniqueValueRenderer(config.defaultSymbol, config.uniqueValues);
        uniqueResult.defaultLabel = config.defaultLegendName;
        uniqueResult.valueExpression = config.arcadeExpression;
        return uniqueResult;
      case ConfigurationTypes.ClassBreak:
        const classResult = this.domainFactory.createClassBreakRenderer(config.defaultSymbol, config.classBreaks);
        classResult.defaultLabel = config.defaultLegendName;
        classResult.valueExpression = config.arcadeExpression;
        classResult.legendOptions = config.classBreakLegendOptions;
        return classResult;
    }
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
      return this.createShadingLayer(layerConfiguration).pipe(
        take(1), // ensures we clean up the subscription
        map(layer => layer.id),
      );
    } else {
      existingLayer.definitionExpression = query;
      return of(existingLayer.id);
    }
  }

  public convertArrayToRecord(mapVars: MapVar[]) : string {
    const obj = {};
    mapVars.forEach((item) => {
      const keys = Object.keys(item);
      const index = keys.findIndex(key => key === 'geocode');
      keys.splice(index, 1);
      obj[item.geocode] = item[keys[0]];
    });
    const arcade = EsriArcadeUtils.createNumericArcade(obj);
    return arcade;
  }

  audienceShading(mapVars: MapVar[], layerId: string, minScale: number) : Observable<string> {
    const arcadeExpression = this.convertArrayToRecord(mapVars);
    const layerName = 'audience Shading Layer';
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    const defaultSymbol = this.domainFactory.createSimpleFillSymbol([0, 255, 0], this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]));
    const layerConfiguration = new UniqueValueShadingConfiguration(layerId, layerName, minScale, 0.25, arcadeExpression, layerName, defaultSymbol, []);

    return this.createShadingLayer(layerConfiguration).pipe(
      take(1),
      map(layer => layer.id),
    );
  }

  clearFeatureSelection(featureTypeName: string) : void {
    const layerName = EsriShadingLayersService.createSelectedFeatureLayerName(featureTypeName);
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    if (existingLayer != null) {
      this.layerService.removeLayerFromLegend(existingLayer.id);
      this.layerService.removeLayer(layerName);
    }
  }
}
