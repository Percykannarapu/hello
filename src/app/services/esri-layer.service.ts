import { Injectable } from '@angular/core';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { TopVarService } from './top-var.service';
import { LayerState, SmartMappingTheme } from '../models/LayerState';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import {SelectItem} from 'primeng/primeng';
import { AppConfig } from '../app.config';

@Injectable()
export class EsriLayerService {

  private layerListWidget: __esri.LayerList;

  private currentSmartTheme: BehaviorSubject<SmartMappingTheme> = new BehaviorSubject<SmartMappingTheme>(SmartMappingTheme.HighToLow);
  private currentThemeOpacity: BehaviorSubject<number> = new BehaviorSubject<number>(65);
  private featureLayers: Map<string, LayerState> = new Map<string, LayerState>();
  private sliderElementId: string = null;

  public currentSmartTheme$: Observable<SmartMappingTheme> = this.currentSmartTheme.asObservable();
  public currentThemeOpacity$: Observable<number> = this.currentThemeOpacity.asObservable();

  constructor(private modules: EsriModules, private topVars: TopVarService, private mapService: EsriMapService, private config: AppConfig){}

  public static getAttributeValue(attributeInstance: any, fieldName: string) : any {
    return attributeInstance && (attributeInstance[fieldName.toLowerCase()] || attributeInstance[fieldName.toUpperCase()]);
  }

  public static isFeatureLayer(layer: __esri.Layer) : layer is __esri.FeatureLayer {
    return layer && layer.type === 'feature';
  }

  public initLayerList(sliderElementId: string) : void {
    console.log('Loading Esri Modules for Layer Service');
    this.sliderElementId = sliderElementId;
    this.modules.onReady(() => { this.initImpl(); });
  }

  public changeSmartTheme(newValue: SmartMappingTheme) : void {
    this.currentSmartTheme.next(newValue);
  }

  public changeOpacity(newValue: number) : void {
    this.currentThemeOpacity.next(newValue);
  }

  private initImpl() : void {
    console.log('Creating Layer List');
    this.layerListWidget = new EsriModules.widgets.LayerList({
      view: this.mapService.mapView,
      container: document.createElement('div'),
      listItemCreatedFunction: (e) => { this.onListItemCreated(e); }
    });
    this.layerListWidget.on('trigger-action', (e) => this.onActionClicked(e));

    const layerListExpand = new EsriModules.widgets.Expand({
      view: this.mapService.mapView,
      content: this.layerListWidget.container,
      expandIconClass: 'esri-icon-layer-list',
      expandTooltip: 'Expand LayerList',
    });

    this.mapService.addWidget(layerListExpand, 'top-left');
  }

  private onListItemCreated(event: any) : void {
    const listItem: __esri.ListItem = event.item;
    const currentLayer: __esri.FeatureLayer = listItem.layer as __esri.FeatureLayer;
    if (currentLayer && currentLayer.portalItem &&
      (currentLayer.portalItem.id === this.config.layerIds.atz.topVars.id ||
        currentLayer.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id ||
        currentLayer.portalItem.id === this.config.layerIds.zip.topVars.id ||
        currentLayer.portalItem.id === this.config.layerIds.wrap.topVars.id ||
        currentLayer.portalItem.id === this.config.layerIds.pcr.topVars.id)) {
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
    console.log(`clicked action '${id}'`);
    if (id === 'show-shading') {
      let currentState = this.featureLayers.get(currentLayer.title);
      if (currentState == null) {
        currentState = new LayerState(currentLayer as __esri.FeatureLayer, this.mapService.onBaseMapChange$,
                                    this.topVars.getSelectedTopVar(), this.currentSmartTheme$,
                                    this.currentThemeOpacity$, this.sliderElementId);
        this.featureLayers.set(currentLayer.title, currentState);
      }
      currentState.toggleSmartView();
      //event.action.className = currentState.customShadingVisible() ? 'esri-icon-maps' : 'esri-icon-layers';
      //console.log(`Current icon class should be ${event.action.className}`);
    }
  }
}
