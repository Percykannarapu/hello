import { Injectable } from '@angular/core';
import { EsriModules } from '../core/esri-modules.service';
import { EsriMapService } from '../core/esri-map.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export type layerGeometryType = 'point' | 'mulitpoint' | 'polyline' | 'polygon' | 'extent';

@Injectable()
export class EsriLayerService {

  private groupRefs = new Map<string, __esri.GroupLayer>();
  private layerRefs = new Map<string, __esri.FeatureLayer>();
  private layerStatuses: Map<string, boolean> = new Map<string, boolean>();
  private layersReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public layersReady$: Observable<boolean> = this.layersReady.asObservable();

  constructor(private modules: EsriModules, private mapService: EsriMapService) { }

  public static isFeatureLayer(layer: __esri.Layer) : layer is __esri.FeatureLayer {
    return layer && layer.type === 'feature';
  }

  public groupExists(groupName: string) : boolean {
    return this.groupRefs.has(groupName);
  }

  public layerExists(layerName: string) : boolean {
    return this.layerRefs.has(layerName);
  }

  public getPortalLayerById(portalId: string) : __esri.FeatureLayer {
    let result: __esri.FeatureLayer = null;
    this.mapService.map.allLayers.forEach(l => {
      if (EsriLayerService.isFeatureLayer(l) && l.portalItem && l.portalItem.id === portalId) result = l;
    });
    return result;
  }

  public getClientLayerByName(layerName: string) : __esri.FeatureLayer {
    if (this.layerExists(layerName)) return this.layerRefs.get(layerName);
    return null;
  }

  public removeLayer(layerName: string) : void {
    if (this.layerRefs.has(layerName)) {
      const group: __esri.GroupLayer = (this.layerRefs.get(layerName) as any).parent;
      group.remove(this.layerRefs.get(layerName));
      this.layerRefs.delete(layerName);
    }
  }

  public createGroup(groupName: string, isVisible: boolean) : void {
    if (this.groupRefs.has(groupName)) return;
    const group = new EsriModules.GroupLayer({
      title: groupName,
      listMode: 'show-children',
      visible: isVisible
    });
    this.mapService.map.layers.add(group);
    this.groupRefs.set(groupName, group);
  }

  public createClientLayer(groupName: string, layerName: string, sourceGraphics: __esri.Graphic[], layerType: layerGeometryType, popupEnabled: boolean, popupContent?: string) : __esri.FeatureLayer {
    if (sourceGraphics.length === 0) return null;

    if (!this.groupRefs.has(groupName)) {
      this.createGroup(groupName, true);
    }
    const group = this.groupRefs.get(groupName);
    let fields: any[];
    if (sourceGraphics[0].attributes == null) {
      fields = [];
    } else {
      fields = Object.keys(sourceGraphics[0].attributes).map(k => {
        return { name: k, alias: k, type: 'string' };
      });
    }
    const layer = new EsriModules.FeatureLayer({
      source: sourceGraphics,
      objectIdField: 'parentId',
      fields: fields,
      geometryType: layerType,
      spatialReference: { wkid: 4326 },
      popupEnabled: popupEnabled,
      popupTemplate: new EsriModules.PopupTemplate({ content: (popupContent == null ? '{*}' : popupContent) }),
      title: layerName
    });

    group.layers.unshift(layer);
    this.layerRefs.set(layerName, layer);
    return layer;
  }

  public addGraphicsToLayer(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      this.layerRefs.get(layerName).source.addMany(graphics);
    }
  }

  public removeGraphicsFromLayer(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      this.layerRefs.get(layerName).source.removeMany(graphics);
    }
  }

  public replaceGraphicsOnLayer(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      this.layerRefs.get(layerName).source.removeAll();
      this.layerRefs.get(layerName).source.addMany(graphics);
    }
  }

  public updateGraphicAttributes(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      const layer = this.layerRefs.get(layerName);
      layer.applyEdits({ updateFeatures: graphics });
    }
  }

  public setGraphicVisibility(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      const layer = this.layerRefs.get(layerName);
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

  public getLayer(layerName: string) : __esri.FeatureLayer {
    return this.layerRefs.get(layerName);
  }

  public getAllLayerNames() : string[] {
    return this.mapService.map.allLayers.map(l => l.title).toArray();
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

  /**
   * Set up the layer watches on newly created layers so we can notify
   * the rest of the app when the layers have finished loading
   * @param layers an array of Esri Layers to set up the watches on
   */
  public setupLayerWatches(layers: Array<__esri.Layer>) {
    for (const layer of layers) {
      this.layerStatuses.set(layer.title, false);
      EsriModules.watchUtils.watch(layer, 'loaded', e => this.determineLayerStatuses(layer));
    }
  }
}
