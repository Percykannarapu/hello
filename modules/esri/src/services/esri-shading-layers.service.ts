import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { SelectedShadingLayerName } from '../../settings';
import { EsriUtils } from '../core/esri-utils';
import { AllShadingConfigurations, ConfigurationTypes, SimpleShadingConfiguration } from '../models/shading-configuration';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriRendererService } from './esri-renderer.service';

@Injectable({
  providedIn: 'root'
})
export class EsriShadingLayersService {

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private rendererService: EsriRendererService,
              private domainFactory: EsriDomainFactoryService) { }

  createShadingLayer(config: AllShadingConfigurations, visualVariable?: __esri.ColorVariable, groupName: string = 'Shading') : Observable<__esri.FeatureLayer> {
    return this.layerService.createPortalLayer(config.layerId, config.layerName, config.minScale, true).pipe(
      tap(layer => layer.definitionExpression = config.expression),
      map(layer => this.createAndAttachRenderer(layer, config, visualVariable)),
      tap(layer => {
        console.log('Shading Layer Created', layer);
        const group = this.layerService.createClientGroup(groupName, true, true);
        if (group) group.add(layer);
      })
    );
  }

  private createAndAttachRenderer(layer: __esri.FeatureLayer, config: AllShadingConfigurations, visualVariable?: __esri.ColorVariable) : __esri.FeatureLayer {
    const renderer = this.createConfiguredRenderer(config);
    if (visualVariable && (EsriUtils.rendererIsSimple(renderer) || EsriUtils.rendererIsClassBreaks(renderer) || EsriUtils.rendererIsUnique(renderer))) {
      renderer.visualVariables = [ visualVariable ];
    }
    layer.renderer = renderer;
    layer.popupEnabled = false;
    layer.labelsVisible = false;
    layer.legendEnabled = config.type === ConfigurationTypes.Simple;
    return layer;
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

  selectedGeosShading(geos: string[], layerId: string, minScale: number) {
    const query = `geocode IN (${geos.map(g => `'${g}'`).join(',')})`;
    const existingLayer = this.layerService.getFeatureLayer(SelectedShadingLayerName);
    if (existingLayer == null) {
      const shadedSymbol = this.domainFactory.createSimpleFillSymbol([0, 255, 0, 0.25], this.domainFactory.createSimpleLineSymbol([0, 0, 0, 0]));
      const layerConfiguration = new SimpleShadingConfiguration(layerId, SelectedShadingLayerName, minScale, 'Selected Geos', shadedSymbol, query);
      this.createShadingLayer(layerConfiguration).pipe(
        tap(layer => layer.outFields = ['geocode']),
        take(1)
      ).subscribe(); // the take(1) ensures we clean up the subscription
    } else {
      existingLayer.definitionExpression = query;
    }
  }
}
