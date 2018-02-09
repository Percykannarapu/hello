import { Injectable } from '@angular/core';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { DemographicVariable, TopVarService } from './top-var.service';
import { LayerState, SmartMappingTheme } from '../models/LayerState';
import { EsriMapService } from '../esri-modules/core/esri-map.service';

@Injectable()
export class EsriLayerService {

  private featureLayers: Map<string, LayerState> = new Map<string, LayerState>();
  private currentTopVar: DemographicVariable = null;
  private currentSmartTheme: SmartMappingTheme = SmartMappingTheme.HighToLow;
  private sliderElementId: string = null;

  constructor(private modules: EsriModules, private topVars: TopVarService, private mapService: EsriMapService){
    this.topVars.selectedTopVar$.subscribe(tv => {
      console.log('New Top Var selected: ', tv);
      this.currentTopVar = tv;
      this.featureLayers.forEach((v) => v.setNewDemoField(tv.fieldName));
    });
    this.mapService.baseMap$.subscribe(b => {
      this.featureLayers.forEach(l => l.setNewBaseMap(b));
    });
  }

  public initLayerList(sliderElementId: string) : void {
    console.log('Loading Esri Modules for Layer Service');
    this.sliderElementId = sliderElementId;
    this.modules.onReady(() => { this.initImpl(); });
  }

  public changeSmartTheme(newValue: SmartMappingTheme) : void {
    this.currentSmartTheme = newValue;
    this.featureLayers.forEach((v) => v.setNewTheme(this.currentSmartTheme));
  }

  public changeOpacity(newValue: number) : void {
    this.featureLayers.forEach(l => l.setNewOpacity(newValue));
  }

  private initImpl() : void {
    console.log('Creating Layer List');
    const layerList: __esri.LayerList = new EsriModules.widgets.LayerList({
      view: this.mapService.mapView,
      container: document.createElement('div'),
      listItemCreatedFunction: (e) => { this.onListItemCreated(e); }
    });
    layerList.on('trigger-action', (e) => this.onActionClicked(e));

    const layerListExpand = new EsriModules.widgets.Expand({
      view: this.mapService.mapView,
      content: layerList.container,
      expandIconClass: 'esri-icon-layer-list',
      expandTooltip: 'Expand LayerList',
    });

    this.mapService.addWidget(layerListExpand, 'top-right');
  }

  private onListItemCreated(event: any) : void {
    const listItem: __esri.ListItem = event.item;
    const currentLayer: __esri.Layer = listItem.layer;
    console.log('List Item Created. current Layer::', currentLayer.title);

    if (currentLayer.title === 'ZIP_Top_Vars') {
      if (!this.featureLayers.has(currentLayer.title)) {

      }
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
      if (!this.featureLayers.has(currentLayer.title)) {
        let state: LayerState;
        if (this.currentTopVar == null) {
          state = new LayerState(currentLayer as __esri.FeatureLayer, this.mapService.mapView.map.basemap, null, this.currentSmartTheme, this.sliderElementId);
        } else {
          state = new LayerState(currentLayer as __esri.FeatureLayer, this.mapService.mapView.map.basemap, this.currentTopVar.fieldName, this.currentSmartTheme, this.sliderElementId);
        }
        this.featureLayers.set(currentLayer.title, state);
      }
      this.featureLayers.get(currentLayer.title).toggleSmartView();
    }
  }

  // private createRenderer(layer: __esri.FeatureLayer) : IPromise<void> {
  //   const colorParams = {
  //     layer: layer,
  //     //basemap: this.mapView.map.basemap,
  //     field: this.currentTopVar.fieldName,
  //     theme: 'high-to-low'
  //   };
  //   return EsriModules.colorRendererCreator.createContinuousRenderer(colorParams)
  //     .then( (response: __esri.ContinuousRendererResult) => {
  //       // set the renderer to the layer and add it to the map
  //       layer.renderer = response.renderer;
  //       layer.opacity = 0.65;
  //
  //       const histogramParams = {
  //         layer: colorParams.layer,
  //         field: colorParams.field,
  //         numBins: 30,
  //         foo: 'bar'
  //       };
  //       return EsriModules.histogram(histogramParams)
  //         .then((histogram) => {
  //
  //           // add the statistics and color visual variable objects
  //           // to the color slider parameters
  //           const sliderParams: __esri.ColorSliderProperties = {
  //             numHandles: 2,
  //             syncedHandles: false,
  //             statistics: response.statistics,
  //             visualVariable: response.visualVariable,
  //             histogram: histogram,
  //             minValue: response.statistics.min,
  //             maxValue: response.statistics.max
  //           };
  //
  //           if (!this.colorSlider) {
  //             sliderParams.container = 'slider';
  //             this.colorSlider = new EsriModules.widgets.ColorSlider(sliderParams);
  //             // when the user slides the handle(s), update the renderer
  //             // with the updated color visual variable object
  //             this.colorSlider.on('data-change', () => {
  //               if (layer.renderer instanceof __esri.ClassBreaksRenderer) {
  //                 const renderer = layer.renderer.clone();
  //                 renderer.visualVariables = [EsriModules.lang.clone(this.colorSlider.visualVariable)];
  //                 layer.renderer = renderer;
  //               }
  //             });
  //           } else {
  //             this.colorSlider.set(sliderParams);
  //           }
  //         });
  //     })
  //     .otherwise(err => {
  //       console.log('there was an error: ', err);
  //     });
  // }
}
