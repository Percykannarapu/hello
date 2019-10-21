import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { SelectedShadingLayerPrefix } from '../../settings';
import { EsriUtils } from '../core/esri-utils';
import { AllShadingConfigurations, ConfigurationTypes, SimpleShadingConfiguration } from '../models/shading-configuration';
import { EsriState } from '../state/esri.selectors';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriRendererService } from './esri-renderer.service';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class EsriShadingLayersService {

  constructor(private layerService: EsriLayerService,
              private store$: Store<EsriState>,
              private mapService: EsriMapService,
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
      renderer: this.createFullRenderer(config, visualVariable)
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

  selectedFeaturesShading(featureIds: string[], layerId: string, minScale: number, featureTypeName: string, featureIdField: string = 'geocode') : void {
    const layerName = EsriShadingLayersService.createSelectedFeatureLayerName(featureTypeName);
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    const query = `${featureIdField} IN (${featureIds.map(g => `'${g}'`).join(',')})`;
    if (existingLayer == null) {
      const shadedSymbol = this.domainFactory.createSimpleFillSymbol([0, 255, 0, 0.25], this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]));
      const layerConfiguration = new SimpleShadingConfiguration(layerId, layerName, minScale, layerName, shadedSymbol, query);
      this.createShadingLayer(layerConfiguration).pipe(
        take(1) // ensures we clean up the subscription
      ).subscribe(layer => this.mapService.addLayerToLegend(layer, 'Selected Geos'));
    } else {
      existingLayer.definitionExpression = query;
    }
  }

  clearFeatureSelection(featureTypeName: string) : void {
    const layerName = EsriShadingLayersService.createSelectedFeatureLayerName(featureTypeName);
    const existingLayer = this.layerService.getFeatureLayer(layerName);
    if (existingLayer != null) {
      this.mapService.removeLayerFromLegend(existingLayer);
      this.layerService.removeLayer(layerName);
    }
  }
}
