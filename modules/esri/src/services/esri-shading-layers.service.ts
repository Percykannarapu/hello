import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';
import { AllShadingConfigurations, ConfigurationTypes, UniqueValueShadingConfiguration } from '../models/shading-configuration';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriRendererService } from './esri-renderer.service';
import { EsriMapService } from './esri-map.service';

@Injectable({
  providedIn: 'root'
})
export class EsriShadingLayersService {

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private rendererService: EsriRendererService,
              private domainFactory: EsriDomainFactoryService) { }

  createShadingLayer(config: AllShadingConfigurations, visualVariable?: __esri.ColorVariable, groupName: string = 'Shading') : Observable<__esri.FeatureLayer> {
    return this.layerService.createPortalLayer(config.layerId, config.layerName, 1155600, true).pipe(
      map(layer => this.createAndAttachRenderer(layer, config, visualVariable)),
      tap(layer => {
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
    layer.legendEnabled = false;
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

  selectedGeosShading(geos: string[], layerId: string) {
    const layerName: string = 'Selected';
    if (geos.length === 0) {
      const existingLayer = this.layerService.getFeatureLayer(layerName);
      if (existingLayer != null && existingLayer != undefined) this.layerService.removeLayer(layerName);
    } else if (geos.length > 0) {
      const arcade = this.rendererService.generateArcadeForGeos(geos);
      if (!this.layerService.getFeatureLayer(layerName)) {
        const defaultSymbol = EsriRendererService.createSymbol([0, 0, 0, 0], [0, 0, 0, 0], 0);
        const uniqueValues: any = [];
        uniqueValues.push({
          value: '1',
          symbol: EsriRendererService.createSymbol([0, 255, 0, 0.25], [0, 0, 0, 0], 0),
          label: 'Selected Geo'
        });
        const layerConfiguration: UniqueValueShadingConfiguration = new UniqueValueShadingConfiguration(layerId, layerName, arcade, 'Selected Geos', defaultSymbol, uniqueValues);
        this.createShadingLayer(layerConfiguration).subscribe(layer => {
          const group1 = this.layerService.getGroup('Shading');
        });
      } else if (this.layerService.getFeatureLayer(layerName)) {
        const existingLayer = this.layerService.getFeatureLayer(layerName);
        if (EsriUtils.rendererIsUnique(existingLayer.renderer)) {
          const copyRenderer = EsriUtils.clone(existingLayer.renderer);
          copyRenderer.valueExpression = arcade;
          existingLayer.renderer = copyRenderer;
        }
      }
    }
  }
}
