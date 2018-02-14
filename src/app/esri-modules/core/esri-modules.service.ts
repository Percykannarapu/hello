import {EventEmitter, Inject, Injectable, InjectionToken} from '@angular/core';
import * as esriLoader from 'esri-loader';
import {EsriWidgets} from './esri-widgets';
import {ILoadScriptOptions} from 'esri-loader/src/esri-loader';
import {EsriLoaderWrapperService} from '../../services/esri-loader-wrapper.service';

export interface EsriLoaderConfig {
  esriConfig: ILoadScriptOptions;
}
//
export const EsriLoaderToken = new InjectionToken<EsriLoaderConfig>('esri-config-options');

@Injectable()
export class EsriModules {
  private static names: string[] = [
    'esri/Map',
    'esri/Basemap',
    'esri/views/MapView',
    'esri/support/Action',
    'esri/core/Collection',
    'esri/renderers/smartMapping/creators/color',
    'esri/renderers/smartMapping/statistics/histogram',
    'esri/core/lang',
    'esri/geometry/geometryEngine',
    'esri/layers/Layer',
    'esri/layers/GroupLayer',
    'esri/layers/FeatureLayer',
    'esri/core/watchUtils',
    'esri/PopupTemplate',
    'esri/layers/MapImageLayer'
  ];

  public static Map: typeof __esri.Map;
  public static BaseMap: typeof __esri.Basemap;
  public static MapView: typeof __esri.MapView;
  public static Action: typeof __esri.Action;
  public static Collection: __esri.Collection;
  public static colorRendererCreator: typeof __esri.color;
  public static histogram: typeof __esri.histogram;
  public static lang: typeof __esri.lang;
  public static geometryEngine: typeof __esri.geometryEngine;
  public static Layer: typeof __esri.Layer;
  public static GroupLayer: typeof __esri.GroupLayer;
  public static FeatureLayer: typeof __esri.FeatureLayer;
  public static watchUtils: typeof __esri.watchUtils;
  public static PopupTemplate: typeof __esri.PopupTemplate;
  public static MapImageLayer: typeof __esri.MapImageLayer;

  public static widgets: EsriWidgets;

  private esriConfig: ILoadScriptOptions;
  private isLoaded = new EventEmitter();
  private deferredLoad: Promise<any>;
  public isReady = false;

  constructor(@Inject(EsriLoaderToken) config: EsriLoaderConfig) {
    console.log('Constructing esri-modules');
    this.esriConfig = config.esriConfig;
    // todo: remove when this wrapper is no longer needed
    EsriLoaderWrapperService.esriLoader = this;
    esriLoader.loadScript(this.esriConfig).then(() => {
      this.deferredLoad = esriLoader.loadModules(EsriModules.names.concat(EsriWidgets.moduleNames));
      this.deferredLoad
        .then(m => this.cacheModules(m))
        .catch(e => console.error('There was an error loading the Esri Modules: ', e));
    }).catch(e => console.error('There was an error loading the main Esri script: ', e));
  }

  private cacheModules(modules: any[]) : void {
    // modules array index must line up with names array index
    [
      EsriModules.Map,
      EsriModules.BaseMap,
      EsriModules.MapView,
      EsriModules.Action,
      EsriModules.Collection,
      EsriModules.colorRendererCreator,
      EsriModules.histogram,
      EsriModules.lang,
      EsriModules.geometryEngine,
      EsriModules.Layer,
      EsriModules.GroupLayer,
      EsriModules.FeatureLayer,
      EsriModules.watchUtils,
      EsriModules.PopupTemplate,
      EsriModules.MapImageLayer] = modules;

    EsriModules.widgets = new EsriWidgets();
    EsriModules.widgets.loadModules(modules);

    this.isReady = true;
    this.isLoaded.emit();
  }

  public loadModules(modules: string[]) : Promise<any[]> {
    return esriLoader.loadModules(modules, this.esriConfig);
  }

  public onReady(initializer: () => void) : void {
    if (this.isReady) {
      initializer();
    } else {
      this.isLoaded.subscribe(initializer);
    }
  }
}