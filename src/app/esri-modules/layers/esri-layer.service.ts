import { Injectable } from '@angular/core';
import { EsriModules } from '../core/esri-modules.service';
import { EsriMapService } from '../core/esri-map.service';

export type layerGeometryType = 'point' | 'mulitpoint' | 'polyline' | 'polygon' | 'extent';

@Injectable()
export class EsriLayerService {

  private groupRefs = new Map<string, __esri.GroupLayer>();
  private layerRefs = new Map<string, __esri.FeatureLayer>();

  constructor(private modules: EsriModules, private mapService: EsriMapService) { }

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

  public createClientLayer(groupName: string, layerName: string, sourceGraphics: __esri.Graphic[], layerType: layerGeometryType) : __esri.FeatureLayer {
    if (sourceGraphics.length === 0) return null;

    if (!this.groupRefs.has(groupName)) {
      this.createGroup(groupName, true);
    }
    const group = this.groupRefs.get(groupName);
    const fields = Object.keys(sourceGraphics[0].attributes).map(k => {
      return { name: k, alias: k, type: 'string' };
    });
    const layer = new EsriModules.FeatureLayer({
      source: sourceGraphics,
      objectIdField: 'parentId',
      fields: fields,
      geometryType: layerType,
      spatialReference: { wkid: 4326 },
      popupEnabled: true,
      popupTemplate: new EsriModules.PopupTemplate({ content: '{*}' }),
      title: layerName
    });

    group.layers.add(layer);
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

  public setGraphicVisibility(layerName: string, graphics: __esri.Graphic[]) : void {
    if (this.layerRefs.has(layerName)) {
      const layer = this.layerRefs.get(layerName);
      layer.applyEdits({ updateFeatures: graphics });
      for (const g of graphics) {
        if (g.visible) {
          if (!layer.source.includes(g)) layer.source.add(g);
        } else {
          layer.source.remove(g);
        }
      }
    }
  }
}
