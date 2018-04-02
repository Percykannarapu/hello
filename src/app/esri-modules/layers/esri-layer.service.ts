import { Injectable } from '@angular/core';
import { EsriModules } from '../core/esri-modules.service';
import { EsriMapService } from '../core/esri-map.service';

export type layerGeometryType = 'point' | 'mulitpoint' | 'polyline' | 'polygon' | 'extent';

@Injectable()
export class EsriLayerService {

  private groupRefs = new Map<string, __esri.GroupLayer>();
  private layerRefs = new Map<string, __esri.FeatureLayer>();

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
}
