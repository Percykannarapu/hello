import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, pairwise, startWith, take, tap, withLatestFrom } from 'rxjs/operators';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { isComplexRenderer, isFeatureLayer } from '../core/type-checks';
import { FillSymbolDefinition } from '../models/common-configuration';
import { ConfigurationTypes, RampProperties, ShadingDefinition } from '../models/shading-configuration';
import { AppState } from '../state/esri.reducers';
import {
  addLayerToLegend,
  addShadingDefinition,
  addShadingDefinitions,
  deleteShadingDefinition,
  deleteShadingDefinitions,
  loadShadingDefinitions,
  updateShadingDefinition,
  updateShadingDefinitions,
  upsertShadingDefinition,
  upsertShadingDefinitions
} from '../state/shading/esri.shading.actions';
import { shadingSelectors } from '../state/shading/esri.shading.selectors';
import { EsriLayerService } from './esri-layer.service';

const hideLegendHeaderTypes = new Set<ConfigurationTypes>([ConfigurationTypes.Simple, ConfigurationTypes.DotDensity]);

@Injectable()
export class EsriShadingService {

  private layersInFlight = new Set<string>();

  constructor(private layerService: EsriLayerService,
              private store$: Store<AppState>) {}

  initializeShadingWatchers() : void {
    this.setupLayerCreationWatcher();
    this.setupFeaturesOfInterestWatcher();
    this.setupRendererUpdatesWatcher();
    this.setupLayerRemovalWatcher();
  }

  loadShaders(shadingDefinitions: ShadingDefinition[]) : void {
    this.store$.dispatch(loadShadingDefinitions({ shadingDefinitions }));
  }

  addShader(shadingDefinition: ShadingDefinition | ShadingDefinition[]) : void {
    if (Array.isArray(shadingDefinition)) {
      this.store$.dispatch(addShadingDefinitions({ shadingDefinitions: shadingDefinition }));
    } else {
      this.store$.dispatch(addShadingDefinition({ shadingDefinition }));
    }
  }

  upsertShader(shadingDefinition: ShadingDefinition | ShadingDefinition[]) : void {
    if (Array.isArray(shadingDefinition)) {
      this.store$.dispatch(upsertShadingDefinitions({ shadingDefinitions: shadingDefinition }));
    } else {
      this.store$.dispatch(upsertShadingDefinition({ shadingDefinition }));
    }
  }

  updateShader(shadingDefinition: Update<ShadingDefinition> | Update<ShadingDefinition>[]) : void {
    if (Array.isArray(shadingDefinition)) {
      this.store$.dispatch(updateShadingDefinitions({ shadingDefinitions: shadingDefinition }));
    } else {
      this.store$.dispatch(updateShadingDefinition({ shadingDefinition }));
    }
  }

  deleteShader(shadingDefinition: ShadingDefinition | ShadingDefinition[]) : void {
    if (Array.isArray(shadingDefinition)) {
      this.store$.dispatch(deleteShadingDefinitions({ ids: shadingDefinition.map(s => s.id) }));
      shadingDefinition.forEach(sd => this.layerService.removeLayerFromLegend(sd.destinationLayerUniqueId));
    } else {
      this.store$.dispatch(deleteShadingDefinition({ id: shadingDefinition.id }));
      this.layerService.removeLayerFromLegend(shadingDefinition.destinationLayerUniqueId);
    }
  }

  private setupLayerCreationWatcher() : void {
    this.store$.select(shadingSelectors.layerDefsToCreate).pipe(
      withLatestFrom(this.store$.select(shadingSelectors.featuresCsv))
    ).subscribe(([defs, features]) => {
      defs.forEach(d => {
        if (!this.layersInFlight.has(d.id)) {
          this.layersInFlight.add(d.id);
          this.createGeneralizedShadingLayer(d, features).pipe(
            take(1)
          ).subscribe(id => {
            const hideLegendHeader = hideLegendHeaderTypes.has(d.shadingType);
            this.store$.dispatch(updateShadingDefinition({ shadingDefinition: { id: d.id, changes: { destinationLayerUniqueId: id }}}));
            this.store$.dispatch(addLayerToLegend({ layerUniqueId: id, title: hideLegendHeader ? null : d.layerName, showDefaultSymbol: false }));
            this.layersInFlight.delete(d.id);
          });
        }
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
      defs.forEach(d => this.updateGeneralizedShadingLayer(d, features));
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
    if (isFeatureLayer(layer)) {
      layer.definitionExpression = query;
    }
  }

  private updateGeneralizedShadingLayer(config: ShadingDefinition, newFeatureCsv?: string) : void {
    const layer = this.layerService.getLayerByUniqueId(config.destinationLayerUniqueId);
    if (isFeatureLayer(layer)) {
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
      layer.when().then(() => {
        if (config.refreshLegendOnRedraw && isComplexRenderer(props.renderer)) {
          this.layerService.removeLayerFromLegend(config.destinationLayerUniqueId);
          setTimeout(() => {
            const layerName = hideLegendHeaderTypes.has(config.shadingType) ? null : config.layerName;
            this.layerService.addLayerToLegend(config.destinationLayerUniqueId, layerName, false);
          }, 0);
        }
        layer.set(props);
      });
    }
  }

  private createGeneralizedShadingLayer(config: ShadingDefinition, featureFilter?: string, groupName: string = 'Shading') : Observable<string> {
    const layerProps: __esri.FeatureLayerProperties = {
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
        const classBreaks: __esri.ClassBreakInfoProperties[] = config.breakDefinitions.map(d => ({
          minValue: d.minValue || Number.MIN_VALUE,
          maxValue: d.maxValue || Number.MAX_VALUE,
          label: d.legendName,
          symbol: this.createSymbolFromDefinition(d)
        }));
        classBreaks.reverse();
        const breaksRenderer = EsriDomainFactory.createClassBreakRenderer(defaultSymbol, classBreaks);
        breaksRenderer.valueExpression = config.arcadeExpression;
        return breaksRenderer;
      case ConfigurationTypes.DotDensity:
        const dotAttributes: __esri.AttributeColorInfoProperties[] = [{
          valueExpression: config.arcadeExpression || '',
          color: config.dotColor,
          label: config.layerName
        }];
        const dotDensityRenderer = EsriDomainFactory.createDotDensityRenderer(defaultSymbol.outline, config.dotValue, dotAttributes);
        dotDensityRenderer.legendOptions = {
          unit: config.legendUnits
        };
        return dotDensityRenderer;
      case ConfigurationTypes.Simple:
        const simpleResult = EsriDomainFactory.createSimpleRenderer(defaultSymbol);
        simpleResult.label = defaultLabel;
        return simpleResult;
      case ConfigurationTypes.Unique:
        const uniqueValues: __esri.UniqueValueInfoProperties[] = config.breakDefinitions.filter(b => !b.isHidden).map(u => ({ label: u.legendName, value: u.value, symbol: this.createSymbolFromDefinition(u) }));
        const result = EsriDomainFactory.createUniqueValueRenderer(defaultSymbol, uniqueValues);
        result.defaultLabel = defaultLabel;
        result.valueExpression = config.arcadeExpression;
        return result;
      case ConfigurationTypes.Ramp:
        const stops = (config.breakDefinitions || []).map(c => ({ color: c.stopColor, label: c.stopName, value: c.stopValue }));
        stops.sort((a, b) => a.value - b.value);
        const visVar: RampProperties = {
          type: 'color',
          valueExpression: config.arcadeExpression,
          stops
        };
        return EsriDomainFactory.createSimpleRenderer(defaultSymbol, visVar);
      default:
        return null;
    }
  }

  private createSymbolFromDefinition(def: FillSymbolDefinition) : __esri.SimpleFillSymbol {
    const currentDef: FillSymbolDefinition = { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 0, 0, 0], outlineWidth: 1, ...(def || {}) };
    const outline = EsriDomainFactory.createSimpleLineSymbol(currentDef.outlineColor, currentDef.outlineWidth);
    return EsriDomainFactory.createSimpleFillSymbol(currentDef.fillColor, outline, currentDef.fillType);
  }

  private deleteRenderingLayers(ids: string[]) {
    ids.forEach(id => {
      const layer = this.layerService.getLayerByUniqueId(id);
      if (layer != null) this.layerService.removeLayer(layer);
    });
  }
}
