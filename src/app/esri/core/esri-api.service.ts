import { Inject, Injectable } from '@angular/core';
import * as esriLoader from 'esri-loader';
import { EsriWidgets } from './esri-widgets';
import { EsriLoaderConfig, EsriLoaderToken } from '../configuration';

@Injectable()
export class EsriApi {
  private static names: string[] = [
    'esri/config',
    'esri/Map',
    'esri/Basemap',
    'esri/views/MapView',
    'esri/core/Collection',
    'esri/support/actions/ActionButton',
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
    'esri/geometry/Extent',
    'esri/tasks/Geoprocessor',
    'esri/tasks/support/FeatureSet'
];

  public static config: typeof __esri.config;
  public static Map: __esri.MapConstructor;
  public static BaseMap: typeof __esri.Basemap;
  public static MapView: __esri.MapViewConstructor;
  public static Collection: __esri.Collection;
  public static ActionButton: typeof __esri.ActionButton;
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
  public static Geoprocessor: typeof __esri.Geoprocessor;
  public static FeatureSet: typeof __esri.FeatureSet;

  public static widgets: EsriWidgets;

  constructor(@Inject(EsriLoaderToken) private config: EsriLoaderConfig) {}

  public initialize() : Promise<any> {
    console.log('Loading Esri CSS and API assets');
    esriLoader.loadCss(`${this.config.esriConfig.url}esri/css/main.css`);
    return new Promise<any>((resolve, reject) => {
      esriLoader.loadScript(this.config.esriConfig).then(() => {
        esriLoader.loadModules(EsriApi.names.concat(EsriWidgets.moduleNames)).then(m => {
            this.cacheModules(m);
            resolve();
          }).catch(e => {
            console.error('There was an error loading the individual Esri modules: ', e);
            reject(e);
        });
      }).catch(e => {
        console.error('There was an error loading the main Esri script: ', e);
        reject(e);
      });
    });
  }

  private cacheModules(modules: any[]) : void {
    // modules array index must line up with names array index
    [
      EsriApi.config,
      EsriApi.Map,
      EsriApi.BaseMap,
      EsriApi.MapView,
      EsriApi.Collection,
      EsriApi.ActionButton,
      EsriApi.colorRendererCreator,
      EsriApi.symbologyColor,
      EsriApi.histogram,
      EsriApi.UniqueValueRenderer,
      EsriApi.SimpleRenderer,
      EsriApi.lang,
      EsriApi.geometryEngine,
      EsriApi.geometryEngineAsync,
      EsriApi.Layer,
      EsriApi.GroupLayer,
      EsriApi.FeatureLayer,
      EsriApi.watchUtils,
      EsriApi.PopupTemplate,
      EsriApi.MapImageLayer,
      EsriApi.PolyLine,
      EsriApi.Polygon,
      EsriApi.Viewpoint,
      EsriApi.Graphic,
      EsriApi.SimpleFillSymbol,
      EsriApi.SimpleMarkerSymbol,
      EsriApi.SimpleLineSymbol,
      EsriApi.TextSymbol,
      EsriApi.Color,
      EsriApi.Draw,
      EsriApi.PolygonDrawAction,
      EsriApi.Point,
      EsriApi.Multipoint,
      EsriApi.Query,
      EsriApi.Extent,
      EsriApi.Geoprocessor,
      EsriApi.FeatureSet
    ] = modules;

    EsriApi.widgets = new EsriWidgets();
    EsriApi.widgets.loadModules(modules);

    EsriApi.config.portalUrl = this.config.esriConfig.portalUrl;
  }

  public loadModules(modules: string[]) : Promise<any[]> {
    return esriLoader.loadModules(modules, this.config.esriConfig);
  }
}
