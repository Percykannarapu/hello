import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, pairwise, startWith, take, tap, withLatestFrom } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';
import { ConfigurationTypes, RampProperties, ShadingDefinition, SymbolDefinition } from '../models/shading-configuration';
import { AppState, shadingSelectors } from '../state/esri.selectors';
import { addLayerToLegend, updateShadingDefinition } from '../state/shading/esri.shading.actions';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';

@Injectable()
export class EsriShadingLayersService {

  constructor(private layerService: EsriLayerService,
              private store$: Store<AppState>,
              private domainFactory: EsriDomainFactoryService) {}

  initializeShadingWatchers() : void {
    this.setupLayerCreationWatcher();
    this.setupFeaturesOfInterestWatcher();
    this.setupRendererUpdatesWatcher();
    this.setupLayerRemovalWatcher();
  }

  private setupLayerCreationWatcher() : void {
    this.store$.select(shadingSelectors.layerDefsToCreate).pipe(
      withLatestFrom(this.store$.select(shadingSelectors.featuresCsv))
    ).subscribe(([defs, features]) => {
      defs.forEach(d => {
        this.createGeneralizedShadingLayer(d, features).pipe(
          take(1)
        ).subscribe(id => {
          const hideLegendHeader =
            d.shadingType === ConfigurationTypes.Ramp ||
            d.shadingType === ConfigurationTypes.Simple ||
            d.shadingType === ConfigurationTypes.DotDensity;
          this.store$.dispatch(updateShadingDefinition({ shadingDefinition: { id: d.id, changes: { destinationLayerUniqueId: id }}}));
          this.store$.dispatch(addLayerToLegend({ layerUniqueId: id, title: hideLegendHeader ? null : d.layerName }));
        });
      });
    });
  }

  private setupFeaturesOfInterestWatcher() : void {
    const filteredLayerDefs$ = this.store$.select(shadingSelectors.layerDefsForUpdate).pipe(map(defs => defs.filter(d => d.filterByFeaturesOfInterest)));
    this.store$.select(shadingSelectors.featuresCsv).pipe(
      withLatestFrom(filteredLayerDefs$),
    ).subscribe(([features, defs]) => {
      defs.forEach(d => this.updateLayerFilter(d, features));
    });
  }

  private setupRendererUpdatesWatcher() : void {
    this.store$.select(shadingSelectors.layerDefsForUpdate).pipe(
      withLatestFrom(this.store$.select(shadingSelectors.featuresCsv))
    ).subscribe(([defs, features]) => {
      defs.forEach(d => {
        this.updateGeneralizedShadingLayer(d, features);
      });
    });
  }

  private setupLayerRemovalWatcher() : void {
    this.store$.select(shadingSelectors.layerUniqueIds).pipe(
      startWith([]),
      pairwise(),
      map(([previous, current]) => {
        const currentSet = new Set(current);
        return previous.filter(id => !currentSet.has(id));
      })
    ).subscribe(ids => this.deleteRenderingLayers(ids));
  }

  private updateLayerFilter(config: ShadingDefinition, newFeatureCsv: string) : void {
    const layer = this.layerService.getLayerByUniqueId(config.destinationLayerUniqueId);
    const query = newFeatureCsv.length > 0 ? `${config.filterField} IN (${newFeatureCsv})` : '1 = 0';
    if (EsriUtils.layerIsFeature(layer)) {
      layer.definitionExpression = query;
    }
  }

  private updateGeneralizedShadingLayer(config: ShadingDefinition, newFeatureCsv?: string) : void {
    const layer = this.layerService.getLayerByUniqueId(config.destinationLayerUniqueId);
    if (EsriUtils.layerIsFeature(layer)) {
      const props: Partial<__esri.FeatureLayer> = {
        renderer: this.createGeneralizedRenderer(config),
        visible: config.visible,
        opacity: config.opacity,
        title: config.layerName
      };
      if (newFeatureCsv != null && config.filterByFeaturesOfInterest) {
        if (newFeatureCsv.length > 0) {
          props.definitionExpression = `${config.filterField} IN (${newFeatureCsv})`;
        } else {
          props.definitionExpression = `1 = 0`;
        }
      } else {
        props.definitionExpression = null;
      }
      layer.set(props);
    }
  }

  private createGeneralizedShadingLayer(config: ShadingDefinition, featureFilter?: string, groupName: string = 'Shading') : Observable<string> {
    const layerProps: Partial<__esri.FeatureLayer> = {
      popupEnabled: false,
      labelingInfo: [],
      labelsVisible: false,
      legendEnabled: true,
      outFields: [config.filterField || 'geocode'],
      renderer: this.createGeneralizedRenderer(config),
      opacity: config.opacity
    };
    if (config.filterByFeaturesOfInterest && featureFilter != null) {
      if (featureFilter.length > 0) {
        layerProps.definitionExpression = `${config.filterField} IN (${featureFilter})`;
      } else {
        layerProps.definitionExpression = '1 = 0';
      }
    }
    return this.layerService.createPortalLayer(config.sourcePortalId, config.layerName, config.minScale, true, layerProps).pipe(
      tap(layer => {
        const group = this.layerService.createClientGroup(groupName, true, true);
        if (group) {
          group.layers.unshift(layer);
        }
      }),
      map(layer => layer.id)
    );
  }

  private createGeneralizedRenderer(config: ShadingDefinition) : __esri.Renderer {
    const defaultSymbol = this.createSymbolFromDefinition(config.defaultSymbolDefinition);
    const defaultLabel = config.defaultSymbolDefinition ? config.defaultSymbolDefinition.legendName : '';
    switch (config.shadingType) {
      case ConfigurationTypes.ClassBreak:
        const classBreaks: __esri.ClassBreaksRendererClassBreakInfos[] = config.breakDefinitions.map(d => ({
          minValue: d.minValue || Number.MIN_VALUE,
          maxValue: d.maxValue || Number.MAX_VALUE,
          label: d.legendName,
          symbol: this.createSymbolFromDefinition(d)
        }));
        classBreaks.reverse();
        const breaksRenderer = this.domainFactory.createClassBreakRenderer(defaultSymbol, classBreaks);
        breaksRenderer.valueExpression = config.arcadeExpression;
        return breaksRenderer;
      case ConfigurationTypes.DotDensity:
        const dotAttributes: __esri.AttributeColorInfoProperties[] = [{
          valueExpression: config.arcadeExpression || '',
          color: config.dotColor,
          label: config.layerName
        }];
        const dotDensityRenderer = this.domainFactory.createDotDensityRenderer(defaultSymbol.outline, config.dotValue, dotAttributes);
        dotDensityRenderer.legendOptions = {
          unit: config.legendUnits
        };
        return dotDensityRenderer;
      case ConfigurationTypes.Simple:
        const simpleResult = this.domainFactory.createSimpleRenderer(defaultSymbol);
        simpleResult.label = defaultLabel;
        return simpleResult;
      case ConfigurationTypes.Unique:
        const uniqueValues: __esri.UniqueValueRendererUniqueValueInfos[] = config.breakDefinitions.map(u => ({ label: u.legendName, value: u.value, symbol: this.createSymbolFromDefinition(u) }));
        const result = this.domainFactory.createUniqueValueRenderer(defaultSymbol, uniqueValues);
        result.defaultLabel = defaultLabel;
        result.valueExpression = config.arcadeExpression;
        return result;
      case ConfigurationTypes.Ramp:
        const visVar: RampProperties = {
          type: 'color',
          valueExpression: config.arcadeExpression,
          // legendOptions: { title: config.layerName },
          stops: config.breakDefinitions.map(c => ({ color: c.stopColor, label: c.stopName, value: c.stopValue }))
        };
        return this.domainFactory.createSimpleRenderer(defaultSymbol, visVar);
      default:
        return null;
    }
  }

  private createSymbolFromDefinition(def: SymbolDefinition) : __esri.SimpleFillSymbol {
    const currentDef = def || { fillColor: [0, 0, 0, 0], fillType: 'solid' };
    const outline = this.domainFactory.createSimpleLineSymbol(currentDef.outlineColor || [0, 0, 0, 0]);
    return this.domainFactory.createSimpleFillSymbol(currentDef.fillColor, outline, currentDef.fillType);
  }

  private deleteRenderingLayers(ids: string[]) {
    ids.forEach(id => {
      const layer = this.layerService.getLayerByUniqueId(id);
      if (layer != null) this.layerService.removeLayer(layer);
    });
  }
}
