import { Injectable } from '@angular/core';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { TopVarService, DemographicVariable } from './top-var.service';
import { LayerState, SmartMappingTheme } from '../models/LayerState';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { AppConfig } from '../app.config';
import { ImpMetricCounter } from '../val-modules/metrics/models/ImpMetricCounter';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { ImpMetricType } from '../val-modules/metrics/models/ImpMetricType';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { UserService } from './user.service';

@Injectable()
export class ValLayerService {

  private layerListWidget: __esri.LayerList;

  private currentSmartTheme: BehaviorSubject<SmartMappingTheme> = new BehaviorSubject<SmartMappingTheme>(SmartMappingTheme.HighToLow);
  private currentThemeOpacity: BehaviorSubject<number> = new BehaviorSubject<number>(65);
  private featureLayers: Map<string, LayerState> = new Map<string, LayerState>();
  private sliderElementId: string = null;
  private shadingEnabled: boolean = false;

  public currentSmartTheme$: Observable<SmartMappingTheme> = this.currentSmartTheme.asObservable();
  public currentThemeOpacity$: Observable<number> = this.currentThemeOpacity.asObservable();

  constructor(private modules: EsriModules,
      private topVars: TopVarService,
      private mapService: EsriMapService,
      private config: AppConfig,
      private restClient: RestDataService,
      private userService: UserService){
    this.topVars.selectedTopVar$.subscribe(demoVar => this.trackVariableUsage(demoVar));
  }

  public static getAttributeValue(attributeInstance: any, fieldName: string) : any {
    return attributeInstance && (attributeInstance[fieldName.toLowerCase()] || attributeInstance[fieldName.toUpperCase()]);
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
                                    this.topVars.selectedTopVar$, this.currentSmartTheme$,
                                    this.currentThemeOpacity$, this.sliderElementId);
        this.featureLayers.set(currentLayer.title, currentState);
      }
      currentState.toggleSmartView();
      this.shadingEnabled = currentState.customShadingVisible();
      this.trackVariableUsage(this.topVars.getSelectedTopVar());
      //event.action.className = currentState.customShadingVisible() ? 'esri-icon-maps' : 'esri-icon-layers';
      //console.log(`Current icon class should be ${event.action.className}`);
    }
  }

  /**
   * Track the usage of the demographic variables
   * @param demographicVariable The demographic variable to be tracked
   */
  private trackVariableUsage(demographicVariable: DemographicVariable) {

    // If shading is not currently enabled do nothing
    if (!this.shadingEnabled || demographicVariable == null) {
      return;
    }

    // Create the new counter to be persisted
    const impMetricCounter: ImpMetricCounter = new ImpMetricCounter();  
    impMetricCounter['dirty'] = true;
    impMetricCounter['baseStatus'] = 'INSERT';
    impMetricCounter.metricId = 1;
    impMetricCounter.createDate = new Date(Date.now());
    impMetricCounter.createUser = this.userService.getUser().userId;
    impMetricCounter.metricText = 'selected demographic variable' + '~' + demographicVariable.fieldName + '~' + demographicVariable.label;
    impMetricCounter.metricValue = 1;
    impMetricCounter.modifyDate = new Date(Date.now());
    impMetricCounter.modifyUser = this.userService.getUser().userId;

    // Send the counter data to Fuse for persistence
    this.restClient.post('v1/metrics/base/impmetriccounter/save', JSON.stringify(impMetricCounter))
      .subscribe(res => {
        console.log(res);
      }, err => {
        console.warn('Unable to persist metric data');
      });

  }
}
