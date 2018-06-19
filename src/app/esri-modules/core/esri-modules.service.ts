import { EventEmitter, Inject, Injectable } from '@angular/core';
import * as esriLoader from 'esri-loader';
import { EsriWidgets } from './esri-widgets';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { EsriLoaderConfig, EsriLoaderToken } from '../configuration';

@Injectable()
export class EsriModules {
  private static names: string[] = [
    'esri/config',
    'esri/Map',
    'esri/Basemap',
    'esri/views/MapView',
    'esri/support/Action',
    'esri/core/Collection',
    'esri/renderers/smartMapping/creators/color',
    'esri/renderers/smartMapping/symbology/color',
    'esri/renderers/smartMapping/statistics/histogram',
    'esri/renderers/UniqueValueRenderer',
    'esri/renderers/SimpleRenderer',
    'esri/core/lang',
    'esri/geometry/geometryEngine',
    'esri/geometry/geometryEngineAsync',
    'esri/layers/Layer',
    'esri/layers/GroupLayer',
    'esri/layers/FeatureLayer',
    'esri/core/watchUtils',
    'esri/PopupTemplate',
    'esri/layers/MapImageLayer',
    'esri/geometry/Polyline',
    'esri/geometry/Polygon',
    'esri/Viewpoint',
    'esri/Graphic',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/TextSymbol',
    'esri/Color',
    'esri/views/2d/draw/Draw',
    'esri/views/2d/draw/PolygonDrawAction',
    'esri/geometry/Point',
    'esri/geometry/Multipoint',
    'esri/tasks/support/Query',
    'esri/geometry/Extent'
];

  public static config: typeof __esri.config;
  public static Map: typeof __esri.Map;
  public static BaseMap: typeof __esri.Basemap;
  public static MapView: typeof __esri.MapView;
  public static Action: typeof __esri.Action;
  public static Collection: __esri.Collection;
  public static colorRendererCreator: typeof __esri.color;
  public static symbologyColor: typeof __esri.symbologyColor;
  public static histogram: typeof __esri.histogram;
  public static UniqueValueRenderer: typeof __esri.UniqueValueRenderer;
  public static SimpleRenderer: typeof __esri.SimpleRenderer;
  public static lang: typeof __esri.lang;
  public static geometryEngine: typeof __esri.geometryEngine;
  public static geometryEngineAsync: typeof __esri.geometryEngineAsync;
  public static Layer: typeof __esri.Layer;
  public static GroupLayer: typeof __esri.GroupLayer;
  public static FeatureLayer: typeof __esri.FeatureLayer;
  public static watchUtils: typeof __esri.watchUtils;
  public static PopupTemplate: typeof __esri.PopupTemplate;
  public static MapImageLayer: typeof __esri.MapImageLayer;
  public static PolyLine: typeof __esri.Polyline;
  public static Polygon: typeof __esri.Polygon;
  public static Viewpoint: typeof __esri.Viewpoint;
  public static Graphic: typeof __esri.Graphic;
  public static SimpleFillSymbol: typeof __esri.SimpleFillSymbol;
  public static SimpleMarkerSymbol: typeof __esri.SimpleMarkerSymbol;
  public static SimpleLineSymbol: typeof __esri.SimpleLineSymbol;
  public static TextSymbol: typeof __esri.TextSymbol;
  public static Color: typeof __esri.Color;
  public static Draw: typeof __esri.Draw;
  public static PolygonDrawAction: typeof __esri.PolygonDrawAction;
  public static Point: typeof __esri.Point;
  public static Multipoint: typeof __esri.Multipoint;
  public static Query: typeof __esri.Query;
  public static Extent: typeof __esri.Extent;

  public static widgets: EsriWidgets;

  private isLoaded = new EventEmitter();
  private deferredLoad: Promise<any>;
  public isReady = false;

  constructor(@Inject(EsriLoaderToken) private config: EsriLoaderConfig) {
    console.log('Constructing esri-modules');
    // todo: remove when this wrapper is no longer needed
    EsriLoaderWrapperService.esriLoader = this;
    esriLoader.loadCss(`${this.config.esriConfig.url}esri/css/main.css`);
    esriLoader.loadScript(this.config.esriConfig).then(() => {
      this.deferredLoad = esriLoader.loadModules(EsriModules.names.concat(EsriWidgets.moduleNames));
      this.deferredLoad
        .then(m => this.cacheModules(m))
        .catch(e => console.error('There was an error loading the Esri Modules: ', e));
    }).catch(e => console.error('There was an error loading the main Esri script: ', e));
  }

  private cacheModules(modules: any[]) : void {
    // modules array index must line up with names array index
    [
      EsriModules.config,
      EsriModules.Map,
      EsriModules.BaseMap,
      EsriModules.MapView,
      EsriModules.Action,
      EsriModules.Collection,
      EsriModules.colorRendererCreator,
      EsriModules.symbologyColor,
      EsriModules.histogram,
      EsriModules.UniqueValueRenderer,
      EsriModules.SimpleRenderer,
      EsriModules.lang,
      EsriModules.geometryEngine,
      EsriModules.geometryEngineAsync,
      EsriModules.Layer,
      EsriModules.GroupLayer,
      EsriModules.FeatureLayer,
      EsriModules.watchUtils,
      EsriModules.PopupTemplate,
      EsriModules.MapImageLayer,
      EsriModules.PolyLine,
      EsriModules.Polygon,
      EsriModules.Viewpoint,
      EsriModules.Graphic,
      EsriModules.SimpleFillSymbol,
      EsriModules.SimpleMarkerSymbol,
      EsriModules.SimpleLineSymbol,
      EsriModules.TextSymbol,
      EsriModules.Color,
      EsriModules.Draw,
      EsriModules.PolygonDrawAction,
      EsriModules.Point,
      EsriModules.Multipoint,
      EsriModules.Query,
      EsriModules.Extent
    ] = modules;

    EsriModules.widgets = new EsriWidgets();
    EsriModules.widgets.loadModules(modules);

    EsriModules.config.portalUrl = this.config.esriConfig.portalUrl;

    this.isReady = true;
    this.isLoaded.emit();
  }

  public loadModules(modules: string[]) : Promise<any[]> {
    return esriLoader.loadModules(modules, this.config.esriConfig);
  }

  public onReady(initializer: () => void) : void {
    if (this.isReady) {
      initializer();
    } else {
      this.isLoaded.subscribe(initializer);
    }
  }
}
