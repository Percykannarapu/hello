import {Injectable} from '@angular/core';
import {EsriModules} from './esri-modules.service';

type esriActionSections = __esri.Collection<__esri.Collection<__esri.Action>>;
type esriActions = __esri.Collection<__esri.Action>;

@Injectable()
export class EsriLayerService {
  private mapView: __esri.MapView;
  private colorSlider: __esri.ColorSlider;

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
      //listItemCreatedFunction: this.onListItemCreated
    });
    //layerList.on('trigger-action', (e) => this.onActionClicked(e));

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
    console.log('List Item Created. current Layer::', currentLayer.title);
    listItem.children.forEach(child => {
      console.log('Child title::', child.title);
    });

    if (currentLayer.title === 'ZIP_Top_Vars') {
      const action: __esri.Action = new EsriModules.Action({
        title: 'Show Demo Var Shading',
        className: 'esri-icon-layers',
        id: 'show-shading'
      });
      const sections: esriActionSections = new EsriModules.Collection();
      const inner: esriActions = new EsriModules.Collection();
      inner.add(action);
      sections.add(inner);
      listItem.actionsSections = sections;
    }
  }

  private onActionClicked(event: any) : void {
    const id: string = event.action.id;
    const currentLayer: __esri.Layer = event.item.layer;
    console.log(event);
    if (id === 'show-shading') {
      console.log(`clicked action '${id}'`);
      this.createRenderer(currentLayer);
    }
  }

  private createRenderer(layer) {
    // configure parameters for the color renderer generator
    // the layer must be specified along with a field name
    // or arcade expression. The basemap and other properties determine
    // the appropriate default color scheme.
    let slider = this.colorSlider;

    const colorParams = {
      layer: layer,
      basemap: this.mapView.map.basemap,
      field: 'CL0C00',
      theme: 'high-to-low'
    };

    return EsriModules.colorRendererCreator.createContinuousRenderer(colorParams)
      .then(function (response) {

        // set the renderer to the layer and add it to the map
        layer.renderer = response.renderer;

        const histogramParams = {
          layer: colorParams.layer,
          field: colorParams.field,
          numBins: 30
        };
        return EsriModules.histogram(histogramParams)
          .then(function (histogram) {

            // add the statistics and color visual variable objects
            // to the color slider parameters
            const sliderParams = {
              numHandles: 2,
              syncedHandles: false,
              statistics: response.statistics,
              visualVariable: response.visualVariable,
              histogram: histogram,
              minValue: response.statistics.min,
              maxValue: response.statistics.max,
              container: undefined
            };

            if (!slider) {
              sliderParams.container = 'slider';
              slider = new EsriModules.ColorSlider(sliderParams);
              // when the user slides the handle(s), update the renderer
              // with the updated color visual variable object
              slider.on('data-change', function() {
                const renderer = layer.renderer.clone();
                renderer.visualVariables = [EsriModules.lang.clone(slider.visualVariable)];
                layer.renderer = renderer;
              });
            } else {
              slider.set(sliderParams);
            }
            layer.opacity = 0.25;
          });
      })
      .otherwise(function (err) {
        console.log('there was an error: ', err);
      });
  }
}
