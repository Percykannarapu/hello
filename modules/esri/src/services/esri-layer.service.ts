import { Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriUtils } from '../core/esri-utils';
import { EsriLabelConfiguration, EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { EsriMapService } from './esri-map.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UniversalCoordinates } from '../../../common';
import { MapSymbols } from '../models/map-symbols';

export type layerGeometryType = 'point' | 'multipoint' | 'polyline' | 'polygon' | 'extent';

const getSimpleType = (data: any) => Number.isNaN(Number(data)) || typeof data === 'string'  ? 'string' : 'double';

@Injectable()
export class EsriLayerService {

  private popupsPermanentlyDisabled = new Set<__esri.Layer>();

  private groupRefs = new Map<string, __esri.GroupLayer>();
  private portalGroupRefs = new Map<string, __esri.GroupLayer>();
  private layerRefs = new Map<string, __esri.Layer>();
  private portalRefs = new Map<string, __esri.FeatureLayer>();
  private layerStatuses: Map<string, boolean> = new Map<string, boolean>();
  private layersReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public layersReady$: Observable<boolean> = this.layersReady.asObservable();

  constructor(private mapService: EsriMapService) {}

  public clearClientLayers() : void {
    const layers = Array.from(this.layerRefs.values());
    const groups = Array.from(this.groupRefs.values());
    layers.forEach(layer => {
      const group: __esri.GroupLayer = (layer as any).parent;
      group.remove(layer);
    });
    if (this.mapService.mapView != null) this.mapService.mapView.map.removeMany(groups);
    this.layerRefs.clear();
    this.groupRefs.clear();
  }

  public groupExists(groupName: string) : boolean {
    return this.groupRefs.has(groupName);
  }

  public portalGroupExists(groupName: string) : boolean {
    return this.portalGroupRefs.has(groupName);
  }

  public layerExists(layerName: string) : boolean {
    return this.layerRefs.has(layerName);
  }

  public portalLayerExists(layerName: string) : boolean {
    return this.portalRefs.has(layerName);
  }

  public getGroup(groupName: string) : __esri.GroupLayer {
    return this.groupRefs.get(groupName);
  }

  public getPortalGroup(groupName: string) : __esri.GroupLayer {
    return this.portalGroupRefs.get(groupName);
  }

  public getAllPortalGroups() : __esri.GroupLayer[] {
    return Array.from(this.portalGroupRefs.values());
  }

  public getPortalLayerById(portalId: string) : __esri.FeatureLayer {
    let result: __esri.FeatureLayer = null;
    this.mapService.mapView.map.allLayers.forEach(l => {
      if (EsriUtils.layerIsPortalFeature(l) && l.portalItem.id === portalId) result = l;
    });
    return result;
  }

  public removeLayer(layerName: string) : void {
    if (this.layerRefs.has(layerName)) {
      const group: __esri.GroupLayer = (this.layerRefs.get(layerName) as any).parent;
      group.remove(this.layerRefs.get(layerName));
      this.layerRefs.delete(layerName);
    }
  }

  public createPortalGroup(groupName: string, isVisible: boolean) : __esri.GroupLayer {
    if (this.portalGroupRefs.has(groupName)) return this.portalGroupRefs.get(groupName);
    const group = new EsriApi.GroupLayer({
      title: groupName,
      listMode: 'show',
      visible: isVisible
    });
    this.mapService.mapView.map.layers.unshift(group);
    this.portalGroupRefs.set(groupName, group);
    return group;
  }

  public createClientGroup(groupName: string, isVisible: boolean, bottom: boolean = false) : __esri.GroupLayer {
    if (this.groupRefs.has(groupName)) return;
    const group = new EsriApi.GroupLayer({
      title: groupName,
      listMode: 'show',
      visible: isVisible
    });
    if (bottom) {
      this.mapService.mapView.map.layers.add(group, 0);
    } else {
      this.mapService.mapView.map.layers.add(group);
    }
    
    this.groupRefs.set(groupName, group);
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
        this.portalRefs.set(portalId, currentLayer);
        EsriUtils.setupWatch(currentLayer, 'loaded').subscribe(result => this.determineLayerStatuses(result.target));
        subject.next(currentLayer);
        subject.complete();
      }).catch(reason => {
        subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason });
      });
    });
  }

  public coordinatesToGraphics(coordinates: UniversalCoordinates[], symbol?: MapSymbols) : __esri.Graphic[] {
    const graphics: Array<__esri.Graphic> = [];
    for (const coordinate of coordinates) {
      const point: __esri.Point = new EsriApi.Point();
      point.latitude = coordinate.y;
      point.longitude = coordinate.x;
      const marker: __esri.SimpleMarkerSymbol = new EsriApi.SimpleMarkerSymbol({ color: [0, 0, 255] });
      symbol != null ? marker.path = symbol : marker.path = MapSymbols.STAR;
      const graphic: __esri.Graphic = new EsriApi.Graphic();
      graphic.geometry = point;
      graphic.symbol = marker;
      graphics.push(graphic);
    }
    return graphics;
  }

  public createPointLayer(groupName: string, layerName: string, coordinates: UniversalCoordinates[], symbol?: MapSymbols, renderer?: __esri.Renderer) : __esri.FeatureLayer {
    const graphics = this.coordinatesToGraphics(coordinates, symbol);
    return this.createClientLayer(groupName, layerName, graphics, 'point', null, null, renderer);
  }

  public createGraphicsLayer(groupName: string, layerName: string, graphics: __esri.Graphic[], bottom: boolean = false) : __esri.GraphicsLayer {
    if (!this.groupRefs.has(groupName)) {
      this.createClientGroup(groupName, true, bottom);
    }
    const group = this.groupRefs.get(groupName);
    const layer: __esri.GraphicsLayer = new EsriApi.GraphicsLayer({ graphics: graphics, title: layerName });
    group.layers.unshift(layer);
    this.layerRefs.set(layerName, layer);
    return layer;
  }

  public getGraphicsLayer(layerName: string) : __esri.GraphicsLayer {
    return <__esri.GraphicsLayer> this.layerRefs.get(layerName);
  }

  public createClientLayer(groupName: string, layerName: string, sourceGraphics?: __esri.Graphic[], layerType?: layerGeometryType, popupEnabled?: boolean, popupContent?: string, renderer?: __esri.Renderer) : __esri.FeatureLayer {
    if (sourceGraphics.length === 0) return null;

    if (!this.groupRefs.has(groupName)) {
      this.createClientGroup(groupName, true);
    }
    const group = this.groupRefs.get(groupName);
    let fields: any[];
    if (sourceGraphics[0].attributes == null) {
      fields = [];
    } else {
      fields = [{name: 'parentId', alias: 'parentId', type: 'oid'},
      {name: 'dirty', alias: 'dirty', type: 'oid'},
      {name: 'baseStatus', alias: 'baseStatus', type: 'string'},
      {name: 'clientIdentifierId', alias: 'clientIdentifierId', type: 'oid'},
      {name: 'locationName', alias: 'locationName', type: 'string'},
      {name: 'marketName', alias: 'marketName', type: 'string'},
      {name: 'marketCode', alias: 'marketCode', type: 'string'},
      {name: 'description', alias: 'description', type: 'string'},
      {name: 'groupName', alias: 'groupName', type: 'string'},
      {name: 'locAddress', alias: 'locAddress', type: 'string'},
      {name: 'locCity', alias: 'locCity', type: 'string'},
      {name: 'locState', alias: 'locState', type: 'string'},
      {name: 'locZip', alias: 'locZip', type: 'string'},
      {name: 'xcoord', alias: 'xcoord', type: 'oid'},
      {name: 'ycoord', alias: 'ycoord', type: 'oid'},
      {name: 'origAddress1', alias: 'origAddress1', type: 'string'},
      {name: 'origCity', alias: 'origCity', type: 'string'},
      {name: 'origState', alias: 'origState', type: 'string'},
      {name: 'origPostalCode', alias: 'origPostalCode', type: 'string'},
      {name: 'recordStatusCode', alias: 'recordStatusCode', type: 'string'},
      {name: 'geocoderMatchCode', alias: 'geocoderMatchCode', type: 'string'},
      {name: 'geocoderLocationCode', alias: 'geocoderLocationCode', type: 'string'},
      {name: 'clientIdentifierTypeCode', alias: 'clientIdentifierTypeCode', type: 'string'},
      {name: 'radius1', alias: 'radius1', type: 'oid'},
      {name: 'radius2', alias: 'radius2', type: 'oid'},
      {name: 'radius3', alias: 'radius3', type: 'oid'},
      {name: 'carrierRoute', alias: 'carrierRoute', type: 'string'},
      {name: 'isActive', alias: 'isActive', type: 'oid'},
      {name: 'clientLocationTypeCode', alias: 'clientLocationTypeCode', type: 'string'},
      {name: 'locationNumber', alias: 'locationNumber', type: 'string'},
      {name: 'homeGeoFound', alias: 'homeGeoFound', type: 'oid'},
      {name: 'homeGeocode', alias: 'homeGeocode', type: 'string'}
    ];
      // fields = Object.keys(sourceGraphics[0].attributes).map(k => {
      //   return { name: k, alias: k, type: 'string' };
      // });
    }
    const fieldsTest: any[] = [
      {name: 'parentId', alias: 'parentId', type: 'oid'}];
    const layer = new EsriApi.FeatureLayer({
      source: sourceGraphics,
      objectIdField: 'parentId',
      fields: fields,
      geometryType: layerType,
      spatialReference: { wkid: 4326 },
      popupEnabled: popupEnabled,
      popupTemplate: new EsriApi.PopupTemplate({ content: (popupContent == null ? '{*}' : popupContent) }),
      title: layerName,
      renderer: renderer
    });

    if (!popupEnabled) this.popupsPermanentlyDisabled.add(layer);

    group.layers.unshift(layer);
    this.layerRefs.set(layerName, layer);
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

  public addGraphicsToLayer(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      //this.layerRefs.get(layerName).source.addMany(graphics);
      const layer: __esri.FeatureLayer = <__esri.FeatureLayer> this.layerRefs.get(layerName);
      layer.applyEdits({ addFeatures: graphics });
    }
  }

  public removeGraphicsFromLayer(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
     // this.layerRefs.get(layerName).source.removeMany(graphics);
     const layer: __esri.FeatureLayer = <__esri.FeatureLayer> this.layerRefs.get(layerName);
     layer.applyEdits({ deleteFeatures: graphics });
    }
  }

  public replaceGraphicsOnLayer(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      // this.layerRefs.get(layerName).source.addMany(graphics);
      const layer: __esri.FeatureLayer = <__esri.FeatureLayer> this.layerRefs.get(layerName);
      layer.source.removeAll();
      layer.applyEdits({ addFeatures: graphics });
    }
  }

  public updateGraphicAttributes(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      const layer: __esri.FeatureLayer = <__esri.FeatureLayer> this.layerRefs.get(layerName);
      layer.applyEdits({ updateFeatures: graphics });
    }
  }

  public setGraphicVisibility(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      const layer: __esri.FeatureLayer = <__esri.FeatureLayer> this.layerRefs.get(layerName);
      for (const g of graphics) {
        const sourceGraphics = new Set(layer.source.toArray());
        if (g.visible) {
          if (!sourceGraphics.has(g)) layer.source.add(g);
        } else {
          layer.source.remove(g);
        }
      }
    }
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
