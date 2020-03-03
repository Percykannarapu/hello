import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { UniversalCoordinates } from '@val/common';
import Color from 'esri/Color';
import { Point } from 'esri/geometry';
import Graphic from 'esri/Graphic';
import FeatureLayer from 'esri/layers/FeatureLayer';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import GroupLayer from 'esri/layers/GroupLayer';
import Layer from 'esri/layers/Layer';
import LabelClass from 'esri/layers/support/LabelClass';
import { Font, SimpleMarkerSymbol, TextSymbol } from 'esri/symbols';
import FeatureSet from 'esri/tasks/support/FeatureSet';
import { Observable } from 'rxjs';
import { EsriUtils } from '../core/esri-utils';
import { MapSymbols } from '../models/esri-types';
import { AppState } from '../state/esri.selectors';
import { CopyCoordinatesToClipboard } from '../state/map/esri.map.actions';
import { EsriLabelConfiguration, EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { addLayerToLegend } from '../state/shading/esri.shading.actions';
import { EsriMapService } from './esri-map.service';
import { LoggingService } from './logging.service';

const getSimpleType = (data: any) => Number.isNaN(Number(data)) || typeof data === 'string'  ? 'string' : 'double';

@Injectable()
export class EsriLayerService {

  private legendShimmed: boolean = false;
  private popupsPermanentlyDisabled = new Set<__esri.Layer>();
  private layersShowingInLegend = new Set<string>();

  constructor(private mapService: EsriMapService,
              private store$: Store<AppState>,
              private logger: LoggingService,
              private zone: NgZone) {}

  public clearClientLayers(groupName: string) : void {
    if (this.mapService.mapView == null || this.mapService.mapView.map == null || this.mapService.mapView.map.layers == null) return;
    const group = this.mapService.mapView.map.layers.find(l => l.title === groupName);
    this.logger.debug.log('Clearing', groupName, 'layer');
    if (EsriUtils.layerIsGroup(group)) {
      this.logger.info.log('Group found, removing layers');
      group.layers.removeAll();
      this.mapService.mapView.map.layers.remove(group);
    }
  }

  public groupExists(groupName: string) : boolean {
    const group = this.mapService.mapView.map.layers.find(l => l.title === groupName);
    return EsriUtils.layerIsGroup(group);
  }

  public portalGroupExists(groupName: string) : boolean {
    const group = this.mapService.mapView.map.layers.find(l => l.title === groupName && l.id === `portal-${groupName}`);
    return EsriUtils.layerIsGroup(group);
  }

  public getGroup(groupName: string) : __esri.GroupLayer {
    const group = this.mapService.mapView.map.layers.find(l => l.title === groupName);
    if (EsriUtils.layerIsGroup(group)) {
      return group;
    }
    return null;
  }

  public getPortalGroup(groupName: string) : __esri.GroupLayer {
    const group = this.mapService.mapView.map.layers.find(l => l.title === groupName && l.id === `portal-${groupName}`);
    if (EsriUtils.layerIsGroup(group)) {
      return group;
    }
    return null;
  }

  public getLayer(layerName: string) : __esri.Layer {
    return this.mapService.mapView.map.allLayers.find(l => l.title === layerName);
  }

  public getLayerByUniqueId(layerUniqueId: string) : __esri.Layer {
    return this.mapService.mapView.map.allLayers.find(l => l.id === layerUniqueId);
  }

  public getFeatureLayer(layerName: string) : __esri.FeatureLayer {
    const layer = this.mapService.mapView.map.allLayers.find(l => l.title === layerName);
    if (EsriUtils.layerIsFeature(layer)) {
      return layer;
    }
    return null;
  }

  public getGraphicsLayer(layerName: string) : __esri.GraphicsLayer {
    const layer = this.getLayer(layerName);
    if (EsriUtils.layerIsGraphics(layer)) {
      return layer;
    }
    return null;
  }

  public getAllPortalGroups() : __esri.GroupLayer[] {
    return this.mapService.mapView.map.layers.reduce((a, c) => {
      if (c.id === `portal-${c.title}` && EsriUtils.layerIsGroup(c)) {
        a.push(c);
      }
      return a;
    }, []);
  }

  public getPortalLayerById(portalId: string) : __esri.FeatureLayer {
    const result = this.getPortalLayersById(portalId).filter(l => {
      const parent = l['parent'];
      return !(EsriUtils.layerIsGroup(parent) && parent.title.toLowerCase().includes('shading'));
    });
    if (result.length > 1) {
      this.logger.warn.log('Expecting a single layer in getPortalLayerById, got multiple. Returning first instance only');
    }
    return result[0];
  }

  public getPortalLayersById(portalId: string) : __esri.FeatureLayer[] {
    const result = [];
    for (const l of this.mapService.mapView.map.allLayers.toArray()) {
      if (EsriUtils.layerIsFeature(l)) {
        if (EsriUtils.layerIsPortalFeature(l) && l.portalItem.id === portalId) result.push(l);
        if (l.url != null && l.url.startsWith(portalId)) result.push(l);
      }
    }
    return result;
  }

  public removeLayer(layer: __esri.Layer) : void {
    if (layer != null) {
      const parent = (layer as any).parent;
      this.removeLayerFromLegend(layer.id);
      if (EsriUtils.layerIsGroup(parent)) {
        this.logger.debug.log(`Removing layer "${layer.title}" from group "${parent.title}"`);
        parent.layers.remove(layer);
      } else {
        this.mapService.mapView.map.layers.remove(layer);
      }
    }
  }

  public createPortalGroup(groupName: string, isVisible: boolean) : __esri.GroupLayer {
    if (this.portalGroupExists(groupName)) return this.getPortalGroup(groupName);
    const group = new GroupLayer({
      id: `portal-${groupName}`,
      title: groupName,
      listMode: 'show',
      visible: isVisible
    });
    this.mapService.mapView.map.layers.unshift(group);
    return group;
  }

  public createClientGroup(groupName: string, isVisible: boolean, bottom: boolean = false) : __esri.GroupLayer {
    if (this.groupExists(groupName)) return this.getGroup(groupName);
    const group = new GroupLayer({
      title: groupName,
      listMode: 'show',
      visible: isVisible
    });
    if (bottom) {
      this.mapService.mapView.map.layers.unshift(group);
    } else {
      this.mapService.mapView.map.layers.add(group);
    }
    return group;
  }

  public createPortalLayer(portalId: string, layerTitle: string, minScale: number, defaultVisibility: boolean, additionalLayerAttributes?: Partial<__esri.FeatureLayer>) : Observable<__esri.FeatureLayer> {
    const isUrlRequest = portalId.toLowerCase().startsWith('http');
    const loader: any = isUrlRequest ? Layer.fromArcGISServerUrl : Layer.fromPortalItem;
    const itemLoadSpec = isUrlRequest ? { url: portalId } : { portalItem: {id: portalId } };
    return new Observable(subject => this.zone.runOutsideAngular(() => {
        loader(itemLoadSpec).then((currentLayer: __esri.FeatureLayer) => {
          currentLayer.visible = defaultVisibility;
          currentLayer.title = layerTitle;
          currentLayer.minScale = minScale;
          if (additionalLayerAttributes != null) {
            Object.entries(additionalLayerAttributes).forEach(([key, value]) => {
              currentLayer[key] = value;
            });
          }
          currentLayer.when(() => {
            this.zone.run(() => {
              subject.complete();
            });
          }, reason => {
            this.zone.run(() => subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason }));
          });
          this.zone.run(() => subject.next(currentLayer));
        }).catch(reason => {
          this.zone.run(() => subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason }));
        });
      })
    );
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

  public createGraphicsLayer(groupName: string, layerName: string, graphics: __esri.Graphic[], addToLegend: boolean = false, bottom: boolean = false) : __esri.GraphicsLayer {
    const group = this.createClientGroup(groupName, true, bottom);
    const layer: __esri.GraphicsLayer = new GraphicsLayer({ graphics: graphics, title: layerName });
    group.layers.unshift(layer);
    if (addToLegend) {
      layer.when(() => this.store$.dispatch(addLayerToLegend({ layerUniqueId: layer.id, title: layerName })));
    }
    return layer;
  }

  public createClientLayer(groupName: string, layerName: string, sourceGraphics: __esri.Graphic[], oidFieldName: string,
                           renderer: __esri.Renderer, popupTemplate: __esri.PopupTemplate, labelInfo: __esri.LabelClass[],
                           addToLegend: boolean = false, legendHeader: string = null) : __esri.FeatureLayer {
    if (sourceGraphics.length === 0) return null;
    const group = this.createClientGroup(groupName, true);
    const layerType = sourceGraphics[0].geometry.type;
    const popupEnabled = popupTemplate != null;
    const labelsVisible = labelInfo != null && labelInfo.length > 0;

    let fields: any[];
    if (sourceGraphics[0].attributes == null) {
      fields = [];
    } else {
      fields = Object.keys(sourceGraphics[0].attributes).map(k => {
        return { name: k, alias: k, type: k === oidFieldName ? 'oid' : 'string' };
      });
    }
    const layer = new FeatureLayer({
      source: sourceGraphics,
      objectIdField: oidFieldName,
      fields: fields,
      geometryType: layerType,
      spatialReference: { wkid: 4326 },
      popupEnabled: popupEnabled,
      popupTemplate: popupTemplate,
      title: layerName,
      renderer: renderer,
      labelsVisible: labelsVisible,
      labelingInfo: labelInfo,
    });

    if (!popupEnabled) this.popupsPermanentlyDisabled.add(layer);
    group.layers.add(layer);
    if (addToLegend) {
      layer.when(() => this.store$.dispatch(addLayerToLegend({ layerUniqueId: layer.id, title: legendHeader })));
    }
    return layer;
  }

  public createDataSet(sourceGraphics: __esri.Graphic[], objectIdFieldName: string = 'OBJECTID') : __esri.FeatureSet {
    if (sourceGraphics.length === 0) return null;
    const fields = [];
    if (sourceGraphics[0].attributes != null) {
      const newFields = Object.keys(sourceGraphics[0].attributes)
        .filter(k => k !== objectIdFieldName)
        .map(k => ({ name: k, alias: k, type: getSimpleType(sourceGraphics[0].attributes[k]) }));
      fields.push(...newFields);
    }
    fields.push({ name: objectIdFieldName, alias: 'OBJECTID', type: 'esriFieldTypeOID' });
    return new FeatureSet({
      features: sourceGraphics,
      fields: fields
    });
  }

  public getAllLayerNames() : string[] {
    const currentMapView = this.mapService.mapView;
    if (currentMapView == null) return [];
    return currentMapView.map.allLayers.map(l => l.title).toArray();
  }

  public setAllPopupStates(popupsEnabled: boolean) : void {
    const currentView = this.mapService.mapView;
    if (currentView == null || currentView.map.allLayers == null) return;
    currentView.map.allLayers
      .filter(l => !this.popupsPermanentlyDisabled.has(l))
      .forEach(l => {
        if (EsriUtils.layerIsFeature(l)) l.popupEnabled = popupsEnabled;
      });
  }

  public setLabels(labelConfig: EsriLabelConfiguration, layerExpressions: { [layerId: string] : EsriLabelLayerOptions }) : void {
    Object.entries(layerExpressions).forEach(([layerId, options]) => {
      const currentLayer = this.getPortalLayerById(layerId);
      if (currentLayer != null) {
        currentLayer.labelingInfo = this.createLabelConfig(currentLayer, labelConfig.size, options);
        currentLayer.labelsVisible = labelConfig.enabled;
      }
    });
    const siteLayer = this.getFeatureLayer('Project Sites');
    if (siteLayer != null) {
      siteLayer.labelsVisible = labelConfig.siteEnabled;
    }
  }

  addLayerToLegend(layerUniqueId: string, title: string) : void {
    const legendRef = this.mapService.widgetMap.get('esri.widgets.Legend') as __esri.Legend;
    const layer = this.getLayerByUniqueId(layerUniqueId);

    if (legendRef != null) {
      if (this.legendShimmed === false) {
        legendRef['legacyRender'] = legendRef.scheduleRender;
        legendRef.scheduleRender = (...args) => {
          legendRef.activeLayerInfos.forEach(ali => {
            ali.legendElements.forEach(le => le.infos = le.infos.filter((si: any) => si.label != null && si.label !== '' && si.label !== 'others'));
            ali.legendElements = ali.legendElements.filter(le => le.infos.length > 0);
          });
          return legendRef['legacyRender'](...args);
        };
        this.legendShimmed = true;
      }
      if (layer != null && !this.layersShowingInLegend.has(layerUniqueId)) {
        // can't use .push() here - a new array instance is needed to trigger the
        // internal mechanics to convert these to activeLayerInfos
        legendRef.layerInfos = [ ...legendRef.layerInfos, { title, layer } ];
        this.layersShowingInLegend.add(layerUniqueId);
      }
    }
  }

  removeLayerFromLegend(layerUniqueId: string) : void {
    const legendRef = this.mapService.widgetMap.get('esri.widgets.Legend') as __esri.Legend;
    if (legendRef != null) {
      legendRef.layerInfos = legendRef.layerInfos.filter(li => li.layer.id !== layerUniqueId);
      this.layersShowingInLegend.delete(layerUniqueId);
    }
  }

  private createLabelConfig(layer: __esri.FeatureLayer, fontSize: number, layerOptions: EsriLabelLayerOptions) : __esri.LabelClass[] {
    if (layerOptions == null) return null;
    const textSymbol: __esri.TextSymbol = new TextSymbol();
    const offset = layerOptions.fontSizeOffset || 0;
    const font = new Font({ family: 'arial', size: (fontSize + offset), weight: 'bold' });
    if (EsriUtils.rendererIsSimple(layer.renderer) && EsriUtils.symbolIsSimpleFill(layer.renderer.symbol) && EsriUtils.symbolIsSimpleLine(layer.renderer.symbol.outline)) {
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
      symbol: textSymbol
    })];
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
    const layer = this.getPortalLayerById(layerId);
    if (layer == null) {
      return false;
    } else {
      return layer.visible && (this.mapService.mapView.scale <= layer.minScale);
    }
  }
}
