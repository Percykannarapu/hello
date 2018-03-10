import { Injectable } from '@angular/core';
import { EsriModules } from '../core/esri-modules.service';
import { EsriMapService } from '../core/esri-map.service';

@Injectable()
export class EsriLayerService {

  private groupRefs = new Map<string, __esri.GroupLayer>();

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

  public createLayer(groupName: string, layerName: string) {

  }

  public addGraphicsToLayer(layerName: string, graphics: __esri.Graphic[]) {

  }
}
