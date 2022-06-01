import { Injectable } from '@angular/core';
import Query from '@arcgis/core/rest/support/Query';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { reduceConcat } from '@val/common';
import { Observable } from 'rxjs';
import { map, pairwise, startWith, take, tap, withLatestFrom } from 'rxjs/operators';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { LayerTypes } from '../core/esri.enums';
import { isFeatureLayer } from '../core/type-checks';
import { FillSymbolDefinition } from '../models/common-configuration';
import { ConfigurationTypes, RampProperties, ShadingDefinition } from '../models/shading-configuration';
import { AppState } from '../state/esri.reducers';
import {
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
import { EsriConfigService } from './esri-config.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriQueryService } from './esri-query.service';
import { LoggingService } from './logging.service';

@Injectable()
export class EsriShadingService {

  private layersInFlight = new Set<string>();

  constructor(private esriConfig: EsriConfigService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService,
              private logger: LoggingService,
              private store$: Store<AppState>) {}

  private static createSymbolFromDefinition(def: FillSymbolDefinition) : __esri.SimpleFillSymbol {
    const currentDef: FillSymbolDefinition = { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 0, 0, 0], outlineWidth: 1, ...(def || {}) };
    const outline = EsriDomainFactory.createSimpleLineSymbol(currentDef.outlineColor, currentDef.outlineWidth);
    return EsriDomainFactory.createSimpleFillSymbol(currentDef.fillColor, outline, currentDef.fillType);
  }

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
    } else {
      this.store$.dispatch(deleteShadingDefinition({ id: shadingDefinition.id }));
    }
  }

  private setupLayerCreationWatcher() : void {
    this.store$.select(shadingSelectors.layerDefsToCreate).pipe(
      withLatestFrom(this.store$.select(shadingSelectors.featuresCsv))
    ).subscribe(([defs, features]) => {
      defs.forEach(d => {
        if (!this.layersInFlight.has(d.id) && !d.useLocalGeometry) {
          this.layersInFlight.add(d.id);
          this.createGeneralizedShadingLayer(d, features).pipe(
            take(1)
          ).subscribe(id => {
            this.store$.dispatch(updateShadingDefinition({ shadingDefinition: { id: d.id, changes: { destinationLayerUniqueId: id }}}));
            setTimeout(() => {
              this.layersInFlight.delete(d.id);
            });
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
      defs.forEach(d => {
        if (!d.useLocalGeometry) this.updateGeneralizedShadingLayer(d, features);
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
      layer.when().then(() => layer.set(props));
    }
  }

  private createGeneralizedShadingLayer(config: ShadingDefinition, featureFilter?: string, groupName: string = 'Shading') : Observable<string> {
    const layerProps: __esri.FeatureLayerProperties = {
      popupEnabled: false,
      labelingInfo: [],
      labelsVisible: false,
      legendEnabled: true,
      outFields: ['*'],
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
    return this.createFeatureLayerForShading(config, layerProps, groupName);
  }

  private createFeatureLayerForShading(config: ShadingDefinition, layerProps: __esri.FeatureLayerProperties, groupName: string) : Observable<string> {
    let layerFactory$: Observable<__esri.FeatureLayer>;
    const layerUrl = this.esriConfig.getLayerUrl(config.layerKey, LayerTypes.Polygon, true);
    if (config.useLocalGeometry) {
      this.layerService.longLayerLoadInProgress$.next(true);
      const query = new Query({ returnGeometry: true, outFields: ['geocode'] });
      layerFactory$ = this.queryService.executeParallelQuery(layerUrl, query, 5000, 3).pipe(
        map(fs => fs.features),
        reduceConcat(),
        map(features => this.layerService.createLocalPolygonLayer(features, layerProps)),
        tap(() => this.layerService.longLayerLoadInProgress$.next(false))
      );
    } else {
      layerFactory$ = this.layerService.createPortalLayer(layerUrl, config.layerName, config.minScale, true, layerProps);
    }
    return layerFactory$.pipe(
      tap(layer => {
        this.logger.debug.log('Shading Layer Created', layer);
        const group = this.layerService.createClientGroup(groupName, true, true);
        if (group) {
          group.layers.unshift(layer);
        }
      }),
      map(layer => layer.id)
    );
  }

  private createGeneralizedRenderer(config: ShadingDefinition) : __esri.Renderer {
    const defaultSymbol = EsriShadingService.createSymbolFromDefinition(config.defaultSymbolDefinition);
    const defaultLabel = config.defaultSymbolDefinition ? config.defaultSymbolDefinition.legendName : '';
    switch (config.shadingType) {
      case ConfigurationTypes.ClassBreak:
        const classBreaks: __esri.ClassBreakInfoProperties[] = config.breakDefinitions.map(d => ({
          minValue: d.minValue || Number.MIN_VALUE,
          maxValue: d.maxValue || Number.MAX_VALUE,
          label: d.legendName,
          symbol: EsriShadingService.createSymbolFromDefinition(d)
        }));
        classBreaks.reverse();
        const breaksRenderer = EsriDomainFactory.createClassBreakRenderer(null, classBreaks);
        breaksRenderer.valueExpressionTitle = config.layerName;
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
        const uniqueValues: __esri.UniqueValueInfoProperties[] = config.breakDefinitions.filter(b => !b.isHidden).map(u => ({ label: u.legendName, value: u.value, symbol: EsriShadingService.createSymbolFromDefinition(u) }));
        const result = EsriDomainFactory.createUniqueValueRenderer(null, uniqueValues);
        result.defaultLabel = defaultLabel;
        result.valueExpression = config.arcadeExpression;
        result.valueExpressionTitle = config.layerName;
        return result;
      case ConfigurationTypes.Ramp:
        const stops = (config.breakDefinitions || []).map(c => ({ color: c.stopColor, label: c.stopName, value: c.stopValue }));
        stops.sort((a, b) => a.value - b.value);
        const visVar: RampProperties = {
          type: 'color',
          valueExpression: config.arcadeExpression,
          valueExpressionTitle: config.layerName,
          stops
        };
        const rampRenderer = EsriDomainFactory.createSimpleRenderer(defaultSymbol, visVar);
        rampRenderer.label = null;
        return rampRenderer;
      default:
        return null;
    }
  }

  private deleteRenderingLayers(ids: string[]) {
    ids.forEach(id => {
      const layer = this.layerService.getLayerByUniqueId(id);
      if (layer != null) this.layerService.removeLayer(layer);
    });
  }
}
