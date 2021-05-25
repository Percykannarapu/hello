import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { filterArray, toUniversalCoordinates } from '@val/common';
import { BehaviorSubject, EMPTY, merge, Observable, from } from 'rxjs';
import { filter, map, reduce, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { isFeatureLayer, isUniqueValueRenderer } from '../core/type-checks';
import { LabelDefinition, MarkerSymbolDefinition } from '../models/common-configuration';
import { MapSymbols, RgbTuple } from '../models/esri-types';
import { PoiConfiguration, PoiConfigurationTypes, SimplePoiConfiguration, UniquePoiConfiguration, RadiiTradeAreaDrawDefinition } from '../models/poi-configuration';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import {
  addPoi,
  addPois,
  deletePoi,
  deletePois,
  loadPois,
  setPopupFields,
  updatePoi,
  updatePois,
  upsertPoi,
  upsertPois
} from '../state/poi/esri.poi.actions';
import { poiSelectors } from '../state/poi/esri.poi.selectors';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriQueryService } from './esri-query.service';
import { LoggingService } from './logging.service';
import { geodesicBuffer, union } from '@arcgis/core/geometry/geometryEngineAsync';
import { EsriQuadTree } from '../core/esri-quad-tree';
import Graphic from '@arcgis/core/Graphic';

@Injectable()
export class EsriPoiService {
  allPoiConfigurations$: Observable<PoiConfiguration[]> = new BehaviorSubject<PoiConfiguration[]>([]);
  visiblePois$: Observable<Record<string, __esri.Graphic[]>> = new BehaviorSubject<Record<string, __esri.Graphic[]>>({});

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private queryService: EsriQueryService,
              private store$: Store<AppState>,
              private logger: LoggingService) {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.initializeSelectors();
      this.setupPoiUpdateWatcher();
    });
  }

  private initializeSelectors() : void {
    this.store$.select(poiSelectors.allPoiDefs).subscribe(this.allPoiConfigurations$ as BehaviorSubject<PoiConfiguration[]>);
    const filteredPois$ = this.store$.select(poiSelectors.poiDefsForUpdate).pipe(filterArray(poi => poi.poiType === PoiConfigurationTypes.Unique));
    this.mapService.viewsCanBeQueried$.pipe(
      filter(ready => ready),
      withLatestFrom(filteredPois$),
      filter(([, pois]) => pois.length > 0),
      switchMap(([, pois]) => this.queryForVisiblePois(pois)),
      tap(results => this.logger.debug.log('POI query complete', results))
    ).subscribe(this.visiblePois$ as BehaviorSubject<Record<string, __esri.Graphic[]>>);
  }

  loadPoiConfig(pois: PoiConfiguration[]) : void {
    this.store$.dispatch(loadPois({ pois }));
  }

  addPoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(addPois({ pois: poi }));
    } else {
      this.store$.dispatch(addPoi({ poi }));
    }
  }

  upsertPoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(upsertPois({ pois: poi }));
    } else {
      this.store$.dispatch(upsertPoi({ poi }));
    }
  }

  updatePoiConfig(poi: Update<PoiConfiguration> | Update<PoiConfiguration>[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(updatePois({ pois: poi }));
    } else {
      this.store$.dispatch(updatePoi({ poi }));
    }
  }

  deletePoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(deletePois({ ids: poi.map(p => p.id) }));
    } else {
      this.store$.dispatch(deletePoi({ id: poi.id }));
    }
  }

  setPopupFields(fieldNames: string[]) : void {
    this.store$.dispatch(setPopupFields({ fieldNames: [...fieldNames]}));
  }

  private setupPoiUpdateWatcher() : void {
    this.store$.select(poiSelectors.poiDefsForUpdate).pipe(
      filter(configs => configs != null && configs.length > 0),
      withLatestFrom(this.store$.select(poiSelectors.popupFields)),
    ).subscribe(([configs, popupFields]) => {
      configs.forEach(config => {
          this.updatePoiLayer(config, popupFields);
      });
    });
  }

  private updatePoiLayer(config: PoiConfiguration, popupFields: string[]) : void {
    const layer = this.layerService.getLayerByUniqueId(config.featureLayerId);
    const visibleFieldSet = new Set(popupFields);
    if (isFeatureLayer(layer)) {
      layer.when().then(() => {
        const popupTemplate = layer.createPopupTemplate();
        popupTemplate.title = `${config.dataKey}: {locationName}`;
        popupTemplate.fieldInfos = popupTemplate.fieldInfos.filter(fi => visibleFieldSet.has(fi.fieldName));
        popupTemplate.fieldInfos.sort((a, b) => {
          return popupFields.indexOf(a.fieldName) - popupFields.indexOf(b.fieldName);
        });
        const props: Partial<__esri.FeatureLayer> = {
          renderer: this.createGeneralizedRenderer(config),
          visible: config.visible,
          opacity: config.opacity,
          title: config.layerName,
          minScale: config.minScale,
          popupEnabled: true,
          popupTemplate,
          labelsVisible: config.showLabels,
          labelingInfo: this.createLabelFromDefinition(config)
        };
        if (isUniqueValueRenderer(props.renderer)) {
          this.layerService.removeLayerFromLegend(config.featureLayerId);
          layer.set(props);
          setTimeout(() => {
            this.layerService.addLayerToLegend(config.featureLayerId, config.layerName, false);
          }, 0);
        } else {
          layer.set(props);
          this.layerService.removeLayerHeader(layer.id);
          this.layerService.addLayerToLegend(layer.id, null, true);
        }
      });
    }
    this.renderRadiiPoi(config.radiiTradeAreaDefinition || [], config.visibleRadius, config.groupName);
  }

  private createGeneralizedRenderer(config: PoiConfiguration) : __esri.Renderer {
    switch (config.poiType) {
      case PoiConfigurationTypes.Simple:
        const simpleSymbol = this.createSymbolFromDefinition(config.symbolDefinition);
        const simpleRenderer = EsriDomainFactory.createSimpleRenderer(simpleSymbol);
        simpleRenderer.label = config.symbolDefinition.legendName || config.layerName || config.groupName;
        return simpleRenderer;
      case PoiConfigurationTypes.Unique:
        const uniqueValues: __esri.UniqueValueInfoProperties[] = config.breakDefinitions.filter(b => !b.isHidden).map(u => ({ label: u.legendName, value: u.value, symbol: this.createSymbolFromDefinition(u) }));
        const uniqueRenderer = EsriDomainFactory.createUniqueValueRenderer(null, uniqueValues);
        uniqueRenderer.field = config.featureAttribute;
        return uniqueRenderer;
    }
  }

  private createSymbolFromDefinition(currentDef: MarkerSymbolDefinition) : __esri.symbols.SimpleMarkerSymbol {
    let outlineColor = currentDef.outlineColor || [0, 0, 0, 0];
    let outlineSize = 1;
    if (currentDef.markerType === 'cross' || currentDef.markerType === 'x') {
      outlineColor = currentDef.color;
      outlineSize = currentDef.markerType === 'x' ? 4 : 2;
    }
    const outline = EsriDomainFactory.createSimpleLineSymbol(outlineColor, outlineSize);
    const path = currentDef.markerType === 'path' ? MapSymbols.STAR : undefined;
    const sizeMultiple = currentDef.markerType === 'path' ? 1.4 : 1;
    const markerSize = (currentDef.size || 10) * sizeMultiple;
    return EsriDomainFactory.createSimpleMarkerSymbol(currentDef.color, outline, currentDef.markerType, path, markerSize);
  }

  private createLabelFromDefinition(config: PoiConfiguration) : __esri.LabelClass[] {
    switch (config.poiType) {
      case PoiConfigurationTypes.Simple:
        return [ this.createSimpleLabel(config) ];
      case PoiConfigurationTypes.Unique:
        return this.createMultiLabel(config);
    }
  }

  private createSimpleLabel(config: SimplePoiConfiguration) : __esri.LabelClass {
    const currentDef = config.labelDefinition;
    const font = this.createLabelFont(currentDef);
    const arcade = currentDef.customExpression || `$feature.${currentDef.featureAttribute}`;
    const color = !currentDef.usesStaticColor ? config.symbolDefinition.color : currentDef.color;
    const haloColor = !currentDef.usesStaticColor ? config.symbolDefinition.outlineColor : currentDef.haloColor;
    return EsriDomainFactory.createExtendedLabelClass(RgbTuple.withAlpha(color, config.opacity), RgbTuple.withAlpha(haloColor, config.opacity), arcade, font);
  }

  private createMultiLabel(config: UniquePoiConfiguration) : __esri.LabelClass[] {
    const result: __esri.LabelClass[] = [];
    const currentDef = config.labelDefinition;
    const font = this.createLabelFont(currentDef);
    const arcade = currentDef.customExpression || `$feature.${currentDef.featureAttribute}`;
    config.breakDefinitions.forEach(bd => {
      const where = `${config.featureAttribute} = '${bd.value}'`;
      const color = !currentDef.usesStaticColor ? bd.color : currentDef.color;
      const haloColor = !currentDef.usesStaticColor ? bd.outlineColor : currentDef.haloColor;
      result.push(EsriDomainFactory.createExtendedLabelClass(RgbTuple.withAlpha(color, config.opacity), RgbTuple.withAlpha(haloColor, config.opacity), arcade, font, 'below-center', { where }));
    });
    return result;
  }

  private createLabelFont(currentDef: LabelDefinition) : __esri.Font {
    const weight = currentDef.isBold ? 'bold' : 'normal';
    const style = currentDef.isItalic ? 'italic' : 'normal';
    return EsriDomainFactory.createFont(currentDef.size, weight, style, currentDef.family);
  }

  private queryForVisiblePois(configs: PoiConfiguration[]) : Observable<Record<string, __esri.Graphic[]>> {
    const allPois = configs.map(config => {
      const layer = this.layerService.getLayerByUniqueId(config.featureLayerId);
      if (!isFeatureLayer(layer)) return EMPTY;
      return this.queryService.queryLayerView(layer, this.mapService.mapView.extent, true).pipe(
        reduce((a, c) => [ ...a, ...c ] , [] as __esri.Graphic[]),
        map(graphics => ({ [config.featureLayerId]: graphics }))
      );
    });
    return merge(...allPois).pipe(
      reduce((a, c) => ({ ...a, ...c }) , {} as Record<string, __esri.Graphic[]>)
    );
  }

  disableRadiiLayers(defs: RadiiTradeAreaDrawDefinition[], visibleRadius: boolean){
    defs.forEach(def => {
      const currentLayer = this.layerService.getLayer(def.layerName);
      if (currentLayer != null)
        this.layerService.getLayer(def.layerName).visible = visibleRadius;
    });
  }

  renderRadiiPoi(defs: RadiiTradeAreaDrawDefinition[], visibleRadius: boolean, groupName: string) {
    const radiiGroupName = `${groupName} visual radii`;
    const result: Observable<__esri.FeatureLayer>[] = [];
    if (this.layerService.groupExists(radiiGroupName)) {
      this.layerService.clearClientLayers(radiiGroupName);
    }
    if (visibleRadius) {
      defs.forEach(def => {
        const outline = EsriDomainFactory.createSimpleLineSymbol(def.color, 2);
        const symbol = EsriDomainFactory.createSimpleFillSymbol([0, 0, 0, 0], outline);
        const renderer = EsriDomainFactory.createSimpleRenderer(symbol);
        const validBufferedPoints = def.bufferedPoints.filter(p => p.buffer > 0);
        if (validBufferedPoints.length > 0) {
          const pointTree = new EsriQuadTree(validBufferedPoints);
          const chunks = pointTree.partition(100);
          //this.logger.info.log(`Generating radius graphics for ${chunks.length} chunks`);
          const circleChunks: Observable<__esri.Polygon[]>[] = chunks.map(chunk => {
            return from(geodesicBuffer(chunk.map(c => c.point), chunk.map(c => c.buffer), 'miles', def.merge)).pipe(
              map(geoBuffer => Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer]),
              filterArray(poly => poly != null)
            );
          });

          let currentRadiusLayer$: Observable<any> = merge(...circleChunks).pipe(
            reduce((acc, curr) => [...acc, ...curr], []),
          );

          if (def.merge) {
            currentRadiusLayer$ = currentRadiusLayer$.pipe(
              tap(polys => this.logger.debug.log(`Radius rings generated. ${polys.length} chunks being unioned.`)),
              switchMap(polys => from(union(polys))),
              map(geoBuffer => [geoBuffer]),
            );
          }

          let oid = 0;
          currentRadiusLayer$ = currentRadiusLayer$.pipe(
            map(geometry => geometry.map(g => new Graphic({ geometry: g, attributes: { oid: oid++ } }))),
            tap(() => this.logger.debug.log('Creating Radius Layer')),
            tap(() => {
              const currentLayer = this.layerService.getLayer(def.layerName);
              this.layerService.removeLayer(currentLayer);
            }),
            map(graphics => this.layerService.createClientLayer(radiiGroupName, def.layerName, graphics, 'oid', renderer, null, null))
          );
          result.push(currentRadiusLayer$);
        }
      });
    }
    if (result.length > 0) {
      return merge(...result).pipe(
        reduce((acc, curr) => [...acc, curr], [] as __esri.FeatureLayer[]),
        tap(layers => this.logger.debug.log('Generated Radii Layers', layers))
        //tap(layers => this.zoomToRadiiTradeArea(defs))
      ).subscribe();
    }

  }

  zoomToRadiiTradeArea(definitions: RadiiTradeAreaDrawDefinition[]){
    const coords = definitions[0].bufferedPoints.map(b => toUniversalCoordinates(b));
    this.mapService.zoomToPoints(coords);
  }
}
