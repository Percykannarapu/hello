import {Injectable} from '@angular/core';
import {EsriModules} from './esri-modules.service';

@Injectable()
export class EsriLayerService {
  private mapView: __esri.MapView;
  private colorSlider: __esri.ColorSlider;
  private showingDemoVars: boolean;
  private currentRenderer: __esri.Renderer;
  private currentOpacity: number;

  constructor(private modules: EsriModules){}

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
      listItem.actionsSections = <any>[[action]]; // have to any-fy this object to make TS happy
    }
  }

  private onActionClicked(event: any) : void {
    const id: string = event.action.id;
    const currentLayer: __esri.FeatureLayer = event.item.layer;
    console.log(event);
    if (id === 'show-shading') {
      console.log(`clicked action '${id}'`);
      this.createRenderer(currentLayer);
    }
  }

  private createRenderer(layer: __esri.FeatureLayer) : IPromise<void> {
    this.showingDemoVars = !this.showingDemoVars;
    if (this.currentRenderer != null) {
      // swap using es6 syntax
      [layer.renderer, this.currentRenderer] = [this.currentRenderer, layer.renderer];
      [layer.opacity, this.currentOpacity] = [this.currentOpacity, layer.opacity];
      return null;
    }
    const colorParams = {
      layer: layer,
      basemap: this.mapView.map.basemap,
      field: 'CL0C00',
      theme: 'high-to-low',
      foo: 123
    };

    return EsriModules.colorRendererCreator.createContinuousRenderer(colorParams)
      .then( (response: __esri.ContinuousRendererResult) => {
        // set the renderer to the layer and add it to the map
        this.currentRenderer = layer.renderer;
        layer.renderer = response.renderer;
        this.currentOpacity = layer.opacity;
        layer.opacity = 0.65;

        const histogramParams = {
          layer: colorParams.layer,
          field: colorParams.field,
          numBins: 30,
          foo: 'bar'
        };
        return EsriModules.histogram(histogramParams)
          .then((histogram) => {

            // add the statistics and color visual variable objects
            // to the color slider parameters
            const sliderParams: __esri.ColorSliderProperties = {
              numHandles: 2,
              syncedHandles: false,
              statistics: response.statistics,
              visualVariable: response.visualVariable,
              histogram: histogram,
              minValue: response.statistics.min,
              maxValue: response.statistics.max
            };

            if (!this.colorSlider) {
              sliderParams.container = 'slider';
              this.colorSlider = new EsriModules.ColorSlider(sliderParams);
              // when the user slides the handle(s), update the renderer
              // with the updated color visual variable object
              this.colorSlider.on('data-change', () => {
                if (layer.renderer instanceof __esri.ClassBreaksRenderer) {
                  const renderer = layer.renderer.clone();
                  renderer.visualVariables = [EsriModules.lang.clone(this.colorSlider.visualVariable)];
                  layer.renderer = renderer;
                }
              });
            } else {
              this.colorSlider.set(sliderParams);
            }
          });
      })
      .otherwise(err => {
        console.log('there was an error: ', err);
      });
  }
}
