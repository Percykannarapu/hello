import { Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriUtils } from '../core/esri-utils';
import { EsriLabelConfiguration, EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { EsriMapService } from './esri-map.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UniversalCoordinates } from '@val/common';
import { MapSymbols } from '../models/map-symbols';

const getSimpleType = (data: any) => Number.isNaN(Number(data)) || typeof data === 'string'  ? 'string' : 'double';

@Injectable()
export class EsriLayerService {

  private popupsPermanentlyDisabled = new Set<__esri.Layer>();
  private layerStatuses: Map<string, boolean> = new Map<string, boolean>();
  private layersReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public layersReady$: Observable<boolean> = this.layersReady.asObservable();

  constructor(private mapService: EsriMapService) {}

  public clearClientLayers(groupName: string) : void {
    const group = this.mapService.mapView.map.layers.find(l => l.title === groupName);
    console.log('Clearing', groupName, 'layer');
    if (EsriUtils.layerIsGroup(group)) {
      console.log('Group found, removing layers');
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

  public layerExists(layerName: string) : boolean {
    const layer = this.mapService.mapView.map.allLayers.find(l => l.title === layerName);
    return layer != null;
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
    let result: __esri.FeatureLayer = null;
    this.mapService.mapView.map.allLayers.forEach(l => {
      if (EsriUtils.layerIsPortalFeature(l) && l.portalItem.id === portalId) result = l;
    });
    return result;
  }

  public removeLayer(layerName: string) : void {
    const layer = this.mapService.mapView.map.allLayers.find(l => l.title === layerName);
    if (layer != null) {
      const parent = (layer as any).parent;
      if (EsriUtils.layerIsGroup(parent)) {
        parent.layers.remove(layer);
      } else {
        this.mapService.mapView.map.layers.remove(layer);
      }
    }
  }

  public createPortalGroup(groupName: string, isVisible: boolean) : __esri.GroupLayer {
    if (this.portalGroupExists(groupName)) return this.getPortalGroup(groupName);
    const group = new EsriApi.GroupLayer({
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
    const group = new EsriApi.GroupLayer({
      title: groupName,
      listMode: 'show',
      visible: isVisible
    });
    if (bottom) {
      this.mapService.mapView.map.add(group, 0);
    } else {
      this.mapService.mapView.map.add(group);
    }
    return group;
  }

  public createPortalLayer(portalId: string, layerTitle: string, minScale: number, defaultVisibility: boolean) : Observable<__esri.FeatureLayer> {
    const isUrlRequest = portalId.toLowerCase().startsWith('http');
    const loader: any = isUrlRequest ? EsriApi.Layer.fromArcGISServerUrl : EsriApi.Layer.fromPortalItem;
    const itemLoadSpec = isUrlRequest ? { url: portalId } : { portalItem: {id: portalId } };
    return Observable.create(subject => {
      loader(itemLoadSpec).then((currentLayer: __esri.FeatureLayer) => {
        currentLayer.visible = defaultVisibility;
        currentLayer.title = layerTitle;
        currentLayer.minScale = minScale;
        EsriUtils.setupWatch(currentLayer, 'loaded').subscribe(result => this.determineLayerStatuses(result.target));
        subject.next(currentLayer);
        subject.complete();
      }).catch(reason => {
        subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason });
      });
    });
  }

  public coordinateToGraphic(coordinate: UniversalCoordinates,  symbol?: MapSymbols) : __esri.Graphic {
    const point: __esri.Point = new EsriApi.Point();
    point.latitude = coordinate.y;
    point.longitude = coordinate.x;
    const marker: __esri.SimpleMarkerSymbol = new EsriApi.SimpleMarkerSymbol({ color: [0, 0, 255] });
    symbol != null ? marker.path = symbol : marker.path = MapSymbols.STAR;
    const graphic: __esri.Graphic = new EsriApi.Graphic();
    graphic.geometry = point;
    graphic.symbol = marker;
    return graphic;
  }

  public createGraphicsLayer(groupName: string, layerName: string, graphics: __esri.Graphic[], bottom: boolean = false) : __esri.GraphicsLayer {
    if (!this.groupExists(groupName)) {
      this.createClientGroup(groupName, true, bottom);
    }
    const group = this.getGroup(groupName);
    const layer: __esri.GraphicsLayer = new EsriApi.GraphicsLayer({ graphics: graphics, title: layerName });
    group.layers.unshift(layer);
    return layer;
  }

  public createClientLayer(groupName: string, layerName: string, sourceGraphics: __esri.Graphic[], oidFieldName: string, renderer: __esri.Renderer, popupTemplate: __esri.PopupTemplate, labelInfo: __esri.LabelClass[]) : __esri.FeatureLayer {
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
    const layer = new EsriApi.FeatureLayer({
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
      labelingInfo: labelInfo
    });

    if (!popupEnabled) this.popupsPermanentlyDisabled.add(layer);
    group.layers.push(layer);

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
    return new EsriApi.FeatureSet({
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

  /**
  * Determine if the layers are ready for use yet and notify observers if they are
  * @param layer an Esri layer to examine
  */
  private determineLayerStatuses(layer: __esri.Layer) {
    if (layer.loaded) {
      this.layerStatuses.set(layer.title, true);
    }
    let loaded = true;
    for (const layerName of Array.from(this.layerStatuses.keys())) {
      if (!this.layerStatuses.get(layerName)) {
        loaded = false;
      }
    }
    if (loaded) {
      this.layersReady.next(true);
    }
  }

  public setLabels(labelConfig: EsriLabelConfiguration, layerExpressions: { [layerId: string] : EsriLabelLayerOptions }) : void {
    const layers = this.mapService.mapView.map.allLayers.toArray();
    layers.forEach(l => {
      if (EsriUtils.layerIsPortalFeature(l)) {
        l.labelingInfo = this.createLabelConfig(l, labelConfig.font, labelConfig.size, layerExpressions[l.portalItem.id]);
        l.labelsVisible = labelConfig.enabled;
      }
      if (EsriUtils.layerIsFeature(l) && l.title == 'Project Sites') {
        l.labelsVisible = labelConfig.siteEnabled;
      }
    });
  }

  private createLabelConfig(layer: __esri.FeatureLayer, fontName: string, fontSize: number, layerOptions: EsriLabelLayerOptions) : __esri.LabelClass[] {
    if (layerOptions == null) return null;
    const textSymbol: __esri.TextSymbol = new EsriApi.TextSymbol();
    const offset = layerOptions.fontSizeOffset || 0;
    const font = new EsriApi.Font({ family: fontName, size: (fontSize + offset), weight: 'bold' });
    if (EsriUtils.rendererIsSimple(layer.renderer) && EsriUtils.symbolIsSimpleFill(layer.renderer.symbol) && EsriUtils.symbolIsSimpleLine(layer.renderer.symbol.outline)) {
      textSymbol.color = layer.renderer.symbol.outline.color;
    } else {
      textSymbol.color = new EsriApi.Color({a: 1, r: 255, g: 255, b: 255});
    }
    if (layerOptions.colorOverride != null) {
      textSymbol.color = new EsriApi.Color(layerOptions.colorOverride);
    }
    textSymbol.haloColor = new EsriApi.Color({ r: 255, g: 255, b: 255, a: 1 });
    textSymbol.haloSize = 1;
    textSymbol.font = font;
    return [new EsriApi.LabelClass({
      labelPlacement: 'always-horizontal',
      labelExpressionInfo: {
        expression: layerOptions.expression
      },
      symbol: textSymbol
    })];
  }
}
