import { Injectable } from '@angular/core';
import { EsriModules } from '../core/esri-modules.service';
import { EsriMapService } from '../core/esri-map.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EsriUtils } from '../core/esri-utils.service';
import { Subject } from 'rxjs';

export type layerGeometryType = 'point' | 'multipoint' | 'polyline' | 'polygon' | 'extent';

@Injectable()
export class EsriLayerService {

  private groupRefs = new Map<string, __esri.GroupLayer>();
  private layerRefs = new Map<string, __esri.FeatureLayer>();
  private layerStatuses: Map<string, boolean> = new Map<string, boolean>();
  private layersReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public layersReady$: Observable<boolean> = this.layersReady.asObservable();

  constructor(private modules: EsriModules, private mapService: EsriMapService) { }

  public clearAll() : void {
    const layers = Array.from(this.layerRefs.values());
    const groups = Array.from(this.groupRefs.values());
    layers.forEach(layer => {
      const group: __esri.GroupLayer = (layer as any).parent;
      group.remove(layer);
    });
    this.mapService.map.removeMany(groups);
    this.layerRefs.clear();
    this.groupRefs.clear();
  }

  public groupExists(groupName: string) : boolean {
    return this.groupRefs.has(groupName);
  }

  public layerExists(layerName: string) : boolean {
    return this.layerRefs.has(layerName);
  }

  public getGroup(groupName: string) : __esri.GroupLayer {
    return this.groupRefs.get(groupName);
  }

  public getLayer(layerName: string) : __esri.FeatureLayer {
    return this.layerRefs.get(layerName);
  }

  public getPortalLayerById(portalId: string) : __esri.FeatureLayer {
    let result: __esri.FeatureLayer = null;
    this.mapService.map.allLayers.forEach(l => {
      if (EsriUtils.layerIsFeature(l) && l.portalItem && l.portalItem.id === portalId) result = l;
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

  public createGroup(groupName: string, isVisible: boolean) : void {
    if (this.groupRefs.has(groupName)) return;
    const group = new EsriModules.GroupLayer({
      title: groupName,
      listMode: 'show-children',
      visible: isVisible
    });
    this.mapService.map.layers.unshift(group);
    this.groupRefs.set(groupName, group);
  }

  public createPortalLayer(portalId: string, layerTitle: string, minScale: number, defaultVisibility: boolean) : Observable<__esri.FeatureLayer> {
    const isUrlRequest = portalId.toLowerCase().startsWith('http');
    const loader: any = isUrlRequest ? EsriModules.Layer.fromArcGISServerUrl : EsriModules.Layer.fromPortalItem;
    const itemLoadSpec = isUrlRequest ? { url: portalId } : { portalItem: {id: portalId } };
    return Observable.create(subject => {
      loader(itemLoadSpec).then((currentLayer: __esri.FeatureLayer) => {
        currentLayer.visible = defaultVisibility;
        currentLayer.title = layerTitle;
        currentLayer.minScale = minScale;
        subject.next(currentLayer);
        subject.complete();
      }).catch(reason => {
        subject.error({ message: `There was an error creating the '${layerTitle}' layer.`, data: reason });
      });
    });
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

  public getAllLayerNames() : string[] {
    return this.mapService.map.allLayers.map(l => l.title).toArray();
  }

  public setAllPopupStates(popupsEnabled: boolean) : void {
    if (this.mapService.map == null || this.mapService.map.allLayers == null) return;
    this.mapService.map.allLayers.forEach(l => {
      if (EsriUtils.layerIsFeature(l)) l.popupEnabled = popupsEnabled;
    });
  }

  public setAllGroupVisibilities(isVisible: boolean) : void {
    Array.from(this.groupRefs.values()).forEach(group => {
      group.visible = isVisible;
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

  /**
   * Set up the layer watches on newly created layers so we can notify
   * the rest of the app when the layers have finished loading
   */
  public setupLayerWatches() {
    const allLayers = this.mapService.map.allLayers.toArray();
    for (const layer of allLayers) {
      this.layerStatuses.set(layer.title, false);
      EsriModules.watchUtils.watch(layer, 'loaded', e => this.determineLayerStatuses(layer));
    }
  }
}
