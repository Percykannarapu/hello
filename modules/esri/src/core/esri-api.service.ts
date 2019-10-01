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
    'esri/support/actions/ActionButton',
    'esri/renderers/DotDensityRenderer',
    'esri/renderers/ClassBreaksRenderer',
    'esri/renderers/UniqueValueRenderer',
    'esri/renderers/SimpleRenderer',
    'esri/core/lang',
    'esri/geometry/geometryEngine',
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
    'esri/popup/FieldInfo',
    'esri/layers/support/LabelClass',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/symbols/SimpleLineSymbol',
    'esri/layers/GraphicsLayer',
    'esri/geometry/projection',
    'esri/tasks/PrintTask',
    'esri/tasks/support/PrintParameters',
    'esri/tasks/support/PrintTemplate'
];

  public static config: __esri.config;
  public static IdentityManager: __esri.IdentityManager;
  public static Map: __esri.MapConstructor;
  public static BaseMap: __esri.BasemapConstructor;
  public static MapView: __esri.MapViewConstructor;
  public static ActionButton: __esri.ActionButtonConstructor;
  public static DotDensityRenderer: __esri.DotDensityRendererConstructor;
  public static ClassBreaksRenderer: __esri.ClassBreaksRendererConstructor;
  public static UniqueValueRenderer: __esri.UniqueValueRendererConstructor;
  public static SimpleRenderer: __esri.SimpleRendererConstructor;
  public static lang: __esri.lang;
  public static geometryEngine: __esri.geometryEngine;
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
  public static FieldInfo: __esri.FieldInfoConstructor;
  public static LabelClass: __esri.LabelClassConstructor;
  public static TextSymbol: __esri.TextSymbolConstructor;
  public static Font: __esri.FontConstructor;
  public static SimpleLineSymbol: __esri.SimpleLineSymbolConstructor;
  public static GraphicsLayer: __esri.GraphicsLayerConstructor;
  public static projection: __esri.projection;
  public static PrintTask: __esri.PrintTaskConstructor;
  public static PrintParameters: __esri.PrintParametersConstructor;
  public static PrintTemplate: __esri.PrintTemplateConstructor;

  public static widgets: EsriWidgets;

  public static async initialize(config: EsriConfigOptions) {
    try {
      await esriLoader.loadScript(config);
      const allModuleNames = EsriApi.names.concat(EsriWidgets.moduleNames);
      const loadedModules = await esriLoader.loadModules(allModuleNames);
      EsriApi.cacheModules(loadedModules, config);
    } catch (e) {
      console.error('There was an error during the Esri Api bootstrapping process', e);
    }
  }

  private static cacheModules(modules: any[], localConfig: EsriConfigOptions) : void {
    // modules array index must line up with names array index
    [
      EsriApi.config,
      EsriApi.IdentityManager,
      EsriApi.Map,
      EsriApi.BaseMap,
      EsriApi.MapView,
      EsriApi.ActionButton,
      EsriApi.DotDensityRenderer,
      EsriApi.ClassBreaksRenderer,
      EsriApi.UniqueValueRenderer,
      EsriApi.SimpleRenderer,
      EsriApi.lang,
      EsriApi.geometryEngine,
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
      EsriApi.FieldInfo,
      EsriApi.LabelClass,
      EsriApi.TextSymbol,
      EsriApi.Font,
      EsriApi.SimpleLineSymbol,
      EsriApi.GraphicsLayer,
      EsriApi.projection,
      EsriApi.PrintTask,
      EsriApi.PrintParameters,
      EsriApi.PrintTemplate
    ] = modules;

    EsriApi.widgets = new EsriWidgets();
    EsriApi.widgets.loadModules(modules);

    EsriApi.config.portalUrl = localConfig.portalUrl;
    EsriApi.config.request.timeout = localConfig.request.timeout;
  }
}
