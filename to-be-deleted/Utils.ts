import { MapService } from '../../../services/map.service';
import { Injectable } from '@angular/core';

@Injectable()
export class Utils
{

    constructor(
        private mapService: MapService,
       ) { }

    /*
    * This Method will be used to remove the sub Layers of GroupLayers
    */   
    public removeSubLayer(deleteLayerName: string, groupLayer: __esri.GroupLayer){
        this.mapService.getAllFeatureLayers().then(list => {
            for (const layer of list){
                if (layer.title.startsWith(deleteLayerName)) {
                    groupLayer.remove(layer);
                    MapService.layers.delete(layer); 
                    MapService.layerNames.delete(layer.title);
                    this.mapService.getMapView().map.remove(layer);
                   // mapView.map.remove(layer);
                }
            }
        });
    }
}
