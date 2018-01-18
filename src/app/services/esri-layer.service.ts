import {Injectable} from '@angular/core';
import {EsriModules} from './esri-modules.service';

@Injectable()
export class EsriLayerService {
  private mapView: __esri.MapView;

  constructor(private modules: EsriModules){
  }

  public initLayerList(mapView: __esri.MapView) : void {
    this.mapView = mapView;
    console.log('Loading Esri Modules for Layer Service');
    if (this.modules.ready()) {
      this.initImpl();
    } else {
      this.modules.deferredLoad.then(() => this.initImpl());
    }
  }

  private initImpl() : void {
    console.log('Creating Layer List');
    const layerList: __esri.LayerList = new EsriModules.LayerList({
      view: this.mapView,
      container: document.createElement('div'),
      listItemCreatedFunction: this.onListItemCreated
    });
    layerList.on('trigger-action', (e) => this.onActionClicked(e));

    const layerListExpand = new EsriModules.Expand({
      view: this.mapView,
      content: layerList.container,
      expandIconClass: 'esri-icon-layer-list',
      expandTooltip: 'Expand LayerList',
    });

    this.mapView.ui.add(layerListExpand, 'top-right');
  }

  private onListItemCreated(event: any) : void {
    const listItem: __esri.ListItem = event.item;
    const currentLayer: __esri.Layer = listItem.layer;
    console.log('List Item Created. Event param::');

    if (currentLayer.type === 'feature') {
      const action: __esri.Action = new EsriModules.Action({
        title: currentLayer.type,
        className: 'esri-icon-layers',
        id: 'test-action'
      });
      const sections: __esri.Collection<__esri.Collection<__esri.Action>> = new EsriModules.Collection();
      const inner: __esri.Collection = new EsriModules.Collection();
      inner.add(action);
      sections.add(inner);
      listItem.actionsSections = sections;
    }
  }

  private onActionClicked(event: any) : void {
    const id: string = event.action.id;
    if (id === 'test-action') {
      console.log(`clicked action '${id}'`);
      // show shading popup
    }
  }
}
