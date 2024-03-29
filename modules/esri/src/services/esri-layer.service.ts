import { Injectable } from '@angular/core';
import Color from '@arcgis/core/Color';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import Layer from '@arcgis/core/layers/Layer';
import LabelClass from '@arcgis/core/layers/support/LabelClass';
import Font from '@arcgis/core/symbols/Font';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import { Store } from '@ngrx/store';
import { UniversalCoordinates } from '@val/common';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { EsriUtils } from '../core/esri-utils';
import {
  isFeatureLayer,
  isGraphicsLayer,
  isGroupLayer,
  isPortalFeatureLayer,
  isSimpleFillSymbol,
  isSimpleLineSymbol,
  isSimpleRenderer
} from '../core/type-checks';
import { MapSymbols } from '../models/esri-types';
import { AppState } from '../state/esri.reducers';
import { CopyCoordinatesToClipboard } from '../state/map/esri.map.actions';
import { EsriLabelConfiguration, EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { EsriMapService } from './esri-map.service';
import { LoggingService } from './logging.service';

@Injectable()
export class EsriLayerService {

  private layersAreReady = new BehaviorSubject<boolean>(false);
  private layerStatusSub: Subscription;
  private layerStatusTracker = new Map<string, Observable<boolean>>();

  private popupsPermanentlyDisabled = new Set<__esri.Layer>();
  private queryOnlyLayers = new Map<string, __esri.FeatureLayer>();

  public layersAreReady$: Observable<boolean> = this.layersAreReady.asObservable();
  public longLayerLoadInProgress$ = new BehaviorSubject<boolean>(false);

  constructor(private mapService: EsriMapService,
              private store$: Store<AppState>,
              private logger: LoggingService) {}

  private static createLabelConfig(layer: __esri.FeatureLayer, fontSize: number, layerOptions: EsriLabelLayerOptions) : __esri.LabelClass[] {
    if (layerOptions == null) return null;
    const textSymbol: __esri.TextSymbol = new TextSymbol();
    const offset = layerOptions.fontSizeOffset || 0;
    const font = new Font({ family: 'arial', size: (fontSize + offset), weight: 'bold' });
    if (isSimpleRenderer(layer.renderer) && isSimpleFillSymbol(layer.renderer.symbol) && isSimpleLineSymbol(layer.renderer.symbol.outline)) {
      textSymbol.color = layer.renderer.symbol.outline.color;
    } else {
      textSymbol.color = new Color({a: 1, r: 255, g: 255, b: 255});
    }
    if (layerOptions.colorOverride != null) {
      textSymbol.color = new Color(layerOptions.colorOverride);
    }
    textSymbol.haloColor = new Color({ r: 255, g: 255, b: 255, a: 1 });
    textSymbol.haloSize = 1;
    textSymbol.font = font;
    return [new LabelClass({
      labelPlacement: 'always-horizontal',
      labelExpressionInfo: {
        expression: layerOptions.expression
      },
      symbol: textSymbol,
      deconflictionStrategy: 'none'
    })];
  }

  public clearClientLayers(groupName: string) : void {
    if (this.mapService.mapView == null || this.mapService.map == null || this.mapService.map.layers == null) return;
    const group = this.mapService.map.layers.find(l => l.title === groupName);
    this.logger.debug.log('Clearing', groupName, 'layer');
    if (isGroupLayer(group)) {
      this.logger.info.log('Group found, removing layers');
      group.layers.forEach(l => {
        this.layerStatusTracker.delete(l.id);
      });
      this.refreshLayerTracker();
      group.layers.removeAll();
      this.mapService.map.layers.remove(group);
    }
  }

  public groupExists(groupName: string) : boolean {
    const group = this.mapService.map.layers.find(l => l.title === groupName);
    return isGroupLayer(group);
  }

  public portalGroupExists(groupName: string) : boolean {
    const group = this.mapService.map.layers.find(l => l.title === groupName && l.id === `portal-${groupName}`);
    return isGroupLayer(group);
  }

  public getGroup(groupName: string) : __esri.GroupLayer {
    const group = this.mapService.map.layers.find(l => l.title === groupName);
    if (isGroupLayer(group)) {
      return group;
    }
    return null;
  }

  public getPortalGroup(groupName: string) : __esri.GroupLayer {
    const group = this.mapService.map.layers.find(l => l.title === groupName && l.id === `portal-${groupName}`);
    if (isGroupLayer(group)) {
      return group;
    }
    return null;
  }

  public getLayer(layerName: string) : __esri.Layer {
    return this.mapService.map.allLayers.find(l => l.title === layerName);
  }

  public getLayerByUniqueId(layerUniqueId: string) : __esri.Layer {
    return this.mapService.map.allLayers.find(l => l.id === layerUniqueId);
  }

  public getFeatureLayerByUniqueId(layerUniqueId: string) : __esri.FeatureLayer {
    const layer = this.mapService.map.allLayers.find(l => l.id === layerUniqueId);
    if (isFeatureLayer(layer)) {
      return layer;
    }
    return null;
  }

  public getFeatureLayer(layerName: string) : __esri.FeatureLayer {
    const layer = this.mapService.map.allLayers.find(l => l.title === layerName);
    if (isFeatureLayer(layer)) {
      return layer;
    }
    return null;
  }

  public getGraphicsLayer(layerName: string) : __esri.GraphicsLayer {
    const layer = this.getLayer(layerName);
    if (isGraphicsLayer(layer)) {
      return layer;
    }
    return null;
  }

  public getQueryLayer(portalIdOrUrl: string, queryId: string, hideQueryLayer: boolean) : __esri.FeatureLayer {
    let result = this.getPortalLayerById(portalIdOrUrl);
    if (result == null) {
      if (this.queryOnlyLayers.has(queryId)) {
        result = this.queryOnlyLayers.get(queryId);
      } else {
        this.logger.debug.log('Creating layer for transaction', queryId);
        result = this.createQueryLayer(portalIdOrUrl, queryId, hideQueryLayer);
      }
    }
    return result;
  }

  public getPortalLayerById(portalId: string) : __esri.FeatureLayer {
    const result = this.getPortalLayersById(portalId).filter(l => {
      const parent = l['parent'];
      return !(isGroupLayer(parent) && parent.title.toLowerCase().includes('shading'));
    });
    if (result.length > 1) {
      this.logger.warn.log('Expecting a single layer in getPortalLayerById, got multiple. Returning first instance only');
    }
    return result[0];
  }

  public getPortalLayersById(portalId: string) : __esri.FeatureLayer[] {
    const result = [];
    for (const l of this.mapService.map.allLayers.toArray()) {
      if (isFeatureLayer(l)) {
        if (isPortalFeatureLayer(l) && l.portalItem.id === portalId && !l.title.startsWith('Query Layer')) result.push(l);
        if (l.url != null && l.url.startsWith(portalId) && !l.title.startsWith('Query Layer')) result.push(l);
      }
    }
    return result;
  }

  public removeLayer(layer: __esri.Layer) : void {
    if (layer != null) {
      const parent = (layer as any).parent;
      if (isGroupLayer(parent)) {
        this.logger.debug.log(`Removing layer "${layer.title}" from group "${parent.title}"`);
        parent.layers.remove(layer);
      } else {
        this.mapService.map.layers.remove(layer);
      }
      this.layerStatusTracker.delete(layer.id);
      this.refreshLayerTracker();
    }
  }

  public removeGroup(groupName: string) : void {
    const currentGroup = this.getPortalGroup(groupName);
    if (currentGroup != null) {
      if (currentGroup.layers.length > 0) {
        currentGroup.layers.forEach(l => {
          this.layerStatusTracker.delete(l.id);
        });
        this.refreshLayerTracker();
      }
      this.mapService.map.layers.remove(currentGroup);
    }
  }

  public removeQueryLayer(queryId: string) : void {
    if (this.queryOnlyLayers.has(queryId)) {
      this.logger.debug.log('Removing layer for transaction', queryId);
      const layer = this.queryOnlyLayers.get(queryId);
      this.queryOnlyLayers.delete(queryId);
      this.mapService.mapView.whenLayerView(layer).then(() => this.removeLayer(layer));
    }
  }

  public createPortalGroup(groupName: string, isVisible: boolean, sortOrder: number) : __esri.GroupLayer {
    if (this.portalGroupExists(groupName)) return this.getPortalGroup(groupName);
    const group = new GroupLayer({
      id: `portal-${groupName}`,
      title: groupName,
      listMode: 'show',
      visible: isVisible
    });
    this.mapService.map.layers.add(group, sortOrder);
    return group;
  }

  public createClientGroup(groupName: string, isVisible: boolean, bottom: boolean = false) : __esri.GroupLayer {
    if (this.groupExists(groupName)) return this.getGroup(groupName);
    const group = new GroupLayer({
      title: groupName,
      listMode: 'show',
      visible: isVisible,

    });
    if (bottom) {
      this.mapService.map.layers.unshift(group);
    } else {
      this.mapService.map.layers.add(group);
    }
    return group;
  }

  public createPortalLayer(portalId: string, layerTitle: string, minScale: number, defaultVisibility: boolean, additionalLayerAttributes?: __esri.FeatureLayerProperties) : Observable<__esri.FeatureLayer> {
    const isUrlRequest = portalId.toLowerCase().startsWith('http');
    const loader: (params: any) => Promise<__esri.Layer> = isUrlRequest ? Layer.fromArcGISServerUrl : Layer.fromPortalItem;
    const itemLoadSpec = isUrlRequest ? { url: portalId } : { portalItem: {id: portalId } };
    return new Observable(subject => {
        loader(itemLoadSpec).then((currentLayer: __esri.FeatureLayer) => {
          const layerUpdater: __esri.FeatureLayerProperties = {
            visible: defaultVisibility,
            title: layerTitle,
            minScale: minScale,
            ...additionalLayerAttributes
          };
          if (layerUpdater.popupEnabled === false) this.popupsPermanentlyDisabled.add(currentLayer);
          currentLayer.set(layerUpdater);
          subject.next(currentLayer);
          currentLayer.when().catch(reason => {
            subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason });
          }).then(() => {
            setTimeout(() => this.trackLayerStatus(currentLayer));
            subject.complete();
          });
        }).catch(reason => {
          subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason });
        });
      }
    );
  }

  public createLocalPolygonLayer(graphics: __esri.Graphic[], additionalLayerAttributes?: __esri.FeatureLayerProperties) : __esri.FeatureLayer {
    const props = {
      source: graphics,
      objectIdField: 'esri_oid',
      fields: [],
      geometryType: 'polygon',
      spatialReference: { wkid: 4326 },
      outFields: ['geocode'],
      globalIdField: 'esri_oid',
      ...additionalLayerAttributes
    } as __esri.FeatureLayerProperties;
    return new FeatureLayer(props);
  }

  public updateLocalLayerData(layerUniqueId: string, data: { [geocode: string] : any }) {
    const layer = this.getLayerByUniqueId(layerUniqueId);
    if (isFeatureLayer(layer)) {
      layer.queryFeatures().then(fs => {
        fs.features.forEach(feature => {
          const currentGeocode = feature.attributes['geocode'];
          feature.attributes = {
            ...feature.attributes,
            ...data[currentGeocode]
          };
        });
        layer.applyEdits({ updateFeatures: fs.features });
      });
    }
  }

  public coordinateToGraphic(coordinate: UniversalCoordinates,  symbol?: MapSymbols) : __esri.Graphic {
    const point: __esri.Point = new Point();
    point.latitude = coordinate.y;
    point.longitude = coordinate.x;
    const marker: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol({ color: [0, 0, 255] });
    symbol != null ? marker.path = symbol : marker.path = MapSymbols.STAR;
    const graphic: __esri.Graphic = new Graphic();
    graphic.geometry = point;
    graphic.symbol = marker;
    return graphic;
  }

  public createGraphicsLayer(groupName: string, layerName: string, graphics: __esri.Graphic[], bottom: boolean = false) : __esri.GraphicsLayer {
    const group = this.createClientGroup(groupName, true, bottom);
    const layer: __esri.GraphicsLayer = new GraphicsLayer({ graphics: graphics, title: layerName });
    group.layers.unshift(layer);
    layer.when().then(() => {
      setTimeout(() => this.trackLayerStatus(layer));
    });
    return layer;
  }

  public createClientLayer(groupName: string, layerName: string, sourceGraphics: __esri.Graphic[], oidFieldName: string,
                           renderer: __esri.Renderer, popupTemplate: __esri.PopupTemplate, labelInfo: __esri.LabelClass[],
                           addToLegend: boolean = false) : __esri.FeatureLayer {
    if (sourceGraphics.length === 0) return null;
    const group = this.createClientGroup(groupName, true);
    const popupEnabled = popupTemplate != null;
    const labelsVisible = labelInfo != null && labelInfo.length > 0;
    const layer = EsriDomainFactory.createFeatureLayer(sourceGraphics, oidFieldName, null);
    const props: __esri.FeatureLayerProperties = {
      popupEnabled: popupEnabled,
      popupTemplate: popupTemplate,
      title: layerName,
      renderer: renderer,
      labelsVisible: labelsVisible,
      labelingInfo: labelInfo,
      legendEnabled: addToLegend
    };
    layer.set(props);

    if (!popupEnabled) this.popupsPermanentlyDisabled.add(layer);
    group.layers.add(layer);
    layer.when().then(() => {
      setTimeout(() => this.trackLayerStatus(layer));
    });
    return layer;
  }

  public setAllPopupStates(popupsEnabled: boolean) : void {
    const currentView = this.mapService.mapView;
    if (currentView == null || currentView.map.allLayers == null) return;
    currentView.map.allLayers
      .filter(l => !this.popupsPermanentlyDisabled.has(l))
      .forEach(l => {
        if (isFeatureLayer(l)) l.popupEnabled = popupsEnabled;
      });
  }

  public setLabels(labelConfig: EsriLabelConfiguration, layerExpressions: { [layerId: string] : EsriLabelLayerOptions }) : void {
    Object.entries(layerExpressions).forEach(([layerId, options]) => {
      const currentLayer = this.getPortalLayerById(layerId);
      if (currentLayer != null) {
        currentLayer.labelingInfo = EsriLayerService.createLabelConfig(currentLayer, labelConfig.size, options);
        currentLayer.labelsVisible = labelConfig.enabled;
      }
    });
  }

  public enableLatLongTool(action: CopyCoordinatesToClipboard) : void {
    const textToBeCopied = (Math.round(action.payload.event.mapPoint.latitude * 1000000) / 1000000) + ',' + (Math.round(action.payload.event.mapPoint.longitude * 1000000) / 1000000);
    const latLong = document.createElement('textarea');
    latLong.value = textToBeCopied;
    document.body.appendChild(latLong);
    latLong.select();
    document.execCommand('copy');
    document.body.removeChild(latLong);
  }

  layerIsVisibleOnMap(layerId: string) : boolean {
    const layers = this.getPortalLayersById(layerId);
    if (layers == null || layers.length === 0) {
      return false;
    } else {
      return layers.some(layer => {
        const layerIsInScale = layer.minScale === 0 ? true : this.mapService.mapView.scale <= layer.minScale;
        return layer.visible && layerIsInScale;
      });
    }
  }

  private createQueryLayer(portalId: string, queryId: string, hideLayer: boolean) : __esri.FeatureLayer {
    const attributes: __esri.FeatureLayerProperties = {
      visible: false,
      listMode: hideLayer ? 'hide' : 'show',
      title: `Query Layer - ${portalId}`
    };
    if (portalId.startsWith('http')) {
      attributes.url = portalId;
    } else {
      attributes.portalItem = { id: portalId };
    }
    this.logger.debug.log('Query Layer Attributes:', attributes);
    const result = new FeatureLayer(attributes);
    this.queryOnlyLayers.set(queryId, result);
    this.mapService.map.add(result);
    return result;
  }

  private trackLayerStatus(layer: __esri.Layer) : void {
    if (this.mapService.map.allLayers.includes(layer)) {
      this.mapService.mapView.whenLayerView(layer).then(view => {
          if (view != null) {
            const watch$ = EsriUtils.setupWatch(view, 'updating', true).pipe(
              map(result => !result.newValue),
            );
            this.layerStatusTracker.set(layer.id, watch$);
            this.refreshLayerTracker();
          }
        });
    } else {
      this.layerStatusTracker.delete(layer.id);
      this.refreshLayerTracker();
    }
  }

  private refreshLayerTracker() : void {
    if (this.layerStatusSub) {
      this.layerStatusSub.unsubscribe();
    }
    if (this.layerStatusTracker.size > 0) {
      this.layerStatusSub = combineLatest(Array.from(this.layerStatusTracker.values())).pipe(
        map(values => values.every(result => result)),
        distinctUntilChanged()
      ).subscribe(ready => this.layersAreReady.next(ready));
    } else {
      this.layersAreReady.next(false);
    }
  }
}
