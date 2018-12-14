import * as esriLoader from 'esri-loader';
import { EsriWidgets } from './esri-widgets';
import { EsriConfigOptions } from '../configuration';

export class EsriApi {
  private static names: string[] = [
    'esri/config',
    'esri/identity/IdentityManager',
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
    'esri/geometry/Polyline',
    'esri/Viewpoint',
    'esri/Graphic',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/Color',
    'esri/geometry/Point',
    'esri/geometry/Multipoint',
    'esri/tasks/support/Query',
    'esri/geometry/Extent',
    'esri/tasks/Geoprocessor',
    'esri/tasks/support/FeatureSet',
    'esri/layers/support/Field',
    'esri/layers/support/LabelClass',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/symbols/SimpleLineSymbol'
];

  public static config: __esri.config;
  public static IdentityManager: __esri.IdentityManager;
  public static Map: __esri.MapConstructor;
  public static BaseMap: __esri.BasemapConstructor;
  public static MapView: __esri.MapViewConstructor;
  public static Collection: __esri.Collection;
  public static ActionButton: __esri.ActionButtonConstructor;
  public static colorRendererCreator: __esri.color;
  public static symbologyColor: __esri.symbologyColor;
  public static histogram: __esri.histogram;
  public static UniqueValueRenderer: __esri.UniqueValueRendererConstructor;
  public static SimpleRenderer: __esri.SimpleRendererConstructor;
  public static lang: __esri.lang;
  public static geometryEngine: __esri.geometryEngine;
  public static geometryEngineAsync: __esri.geometryEngineAsync;
  public static Layer: __esri.LayerConstructor;
  public static GroupLayer: __esri.GroupLayerConstructor;
  public static FeatureLayer: __esri.FeatureLayerConstructor;
  public static watchUtils: __esri.watchUtils;
  public static PopupTemplate: __esri.PopupTemplateConstructor;
  public static PolyLine: __esri.PolylineConstructor;
  public static Viewpoint: __esri.ViewpointConstructor;
  public static Graphic: __esri.GraphicConstructor;
  public static SimpleFillSymbol: __esri.SimpleFillSymbolConstructor;
  public static SimpleMarkerSymbol: __esri.SimpleMarkerSymbolConstructor;
  public static Color: __esri.ColorConstructor;
  public static Point: __esri.PointConstructor;
  public static Multipoint: __esri.MultipointConstructor;
  public static Query: __esri.QueryConstructor;
  public static Extent: __esri.ExtentConstructor;
  public static Geoprocessor: __esri.GeoprocessorConstructor;
  public static FeatureSet: __esri.FeatureSetConstructor;
  public static Field: __esri.FieldConstructor;
  public static LabelClass: __esri.LabelClassConstructor;
  public static TextSymbol: __esri.TextSymbolConstructor;
  public static Font: __esri.FontConstructor;
  public static SimpleLineSymbol: __esri.SimpleLineSymbolConstructor;

  public static widgets: EsriWidgets;

  public static initialize(config: EsriConfigOptions) : Promise<any> {
    console.log('Loading Esri CSS and API assets', config);
    esriLoader.loadCss(`${config.url}esri/css/main.css`);
    return new Promise<any>((resolve, reject) => {
      esriLoader.loadScript(config).then(() => {
        esriLoader.loadModules(EsriApi.names.concat(EsriWidgets.moduleNames)).then(m => {
            this.cacheModules(m, config);
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

  private static cacheModules(modules: any[], localConfig: EsriConfigOptions) : void {
    // modules array index must line up with names array index
    [
      EsriApi.config,
      EsriApi.IdentityManager,
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
      EsriApi.PolyLine,
      EsriApi.Viewpoint,
      EsriApi.Graphic,
      EsriApi.SimpleFillSymbol,
      EsriApi.SimpleMarkerSymbol,
      EsriApi.Color,
      EsriApi.Point,
      EsriApi.Multipoint,
      EsriApi.Query,
      EsriApi.Extent,
      EsriApi.Geoprocessor,
      EsriApi.FeatureSet,
      EsriApi.Field,
      EsriApi.LabelClass,
      EsriApi.TextSymbol,
      EsriApi.Font,
      EsriApi.SimpleLineSymbol
    ] = modules;

    EsriApi.widgets = new EsriWidgets();
    EsriApi.widgets.loadModules(modules);

    EsriApi.config.portalUrl = localConfig.portalUrl;
    EsriApi.config.request.timeout = localConfig.request.timeout;
  }
}
