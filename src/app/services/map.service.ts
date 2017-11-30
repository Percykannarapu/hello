import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService} from './esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';

@Injectable()
export class MapService {

    private mapInstance: __esri.Map;
    private static mapView: __esri.MapView;

    constructor() { }

    public async getMap(): Promise<__esri.Map> {
        if (!!this.mapInstance) {
            return this.mapInstance;
        }
        const loader = EsriLoaderWrapperService.esriLoader;
        const [Map, Basemap] = await loader.loadModules([
            'esri/Map',
            'esri/Basemap'
        ]);
        if (!this.mapInstance) {
            this.mapInstance = new Map(
                { basemap: Basemap.fromId('streets') }
            );
        }
        return this.mapInstance;
    }

    public async createMapView(element: HTMLDivElement): Promise<EsriWrapper<__esri.MapView>> {
        const loader = EsriLoaderWrapperService.esriLoader;
        const theMap = await this.getMap();
        const [MapView,
               Home,
               Search,
               Legend,
               LayerList,
               ScaleBar,
               Locate,
               Compass,
               Expand,
               BasemapGallery
              ] = await loader.loadModules(['esri/views/MapView',
                                            'esri/widgets/Home',
                                            'esri/widgets/Search',
                                            'esri/widgets/Legend',
                                            'esri/widgets/LayerList',
                                            'esri/widgets/ScaleBar',
                                            'esri/widgets/Locate',
                                            'esri/widgets/Compass',
                                            'esri/widgets/Expand',
                                            'esri/widgets/BasemapGallery'
                                           ]);
        const opts: __esri.MapViewProperties = {
            container: element,
            map: theMap,
         // center: { longitude: -83.4096256, latitude: 42.4087785 },
            center: { longitude: -98.5795, latitude: 39.8282 },
            zoom: 4
        };
        const mapView: __esri.MapView = new MapView(opts);

        // Create the LayerList widget with the associated actions
        // and add it to the top-right corner of the view.
        const layerList = new LayerList({
          view: mapView,
          container: document.createElement('div')
          // executes for each ListItem in the LayerList
          // listItemCreatedFunction: defineActions
        });

        // Create an instance of the Home widget
        const home = new Home({
                                view: mapView
                              });

        // Create an instace of the Compass widget
        const compass = new Compass({
                                   view: mapView
                                 });

        // Create an instace of the Locate widget
        const locate = new Locate({
                                   view: mapView
                                 });

        // Create an instance of the Search widget
        const search = new Search({
                                     view: mapView
                                   });

        // Create an instance of the Legend widget
        const legend = new Legend({
                                     view: mapView,
                                     container: document.createElement('div')
                                   });


        // Create an instance of the Scalebar widget
        const scaleBar = new ScaleBar({
                                   view: mapView,
                                   unit: 'dual' // The scale bar displays both metric and non-metric units.
                                 });


        // Create an instance of the BasemapGallery widget
        const basemapGallery = new BasemapGallery({
                                     view: mapView,
                                     container: document.createElement('div')
                                   });

        // Create an Expand instance and set the content
        // property to the DOM node of the basemap gallery widget
        // Use an Esri icon font to represent the content inside
        // of the Expand widget
        const bgExpand = new Expand({
          view: mapView,
          content: basemapGallery.container,
          expandIconClass: 'esri-icon-basemap',
          expandTooltip: "Basemap Gallery", 
        });
        const layerListExpand = new Expand({
          view: mapView,
          content: layerList.container,
          expandIconClass: 'esri-icon-layer-list',
          expandTooltip: "Expand LayerList", 
        });
        const legendExpand = new Expand({
          view: mapView,
          content: legend.container,
          expandIconClass: 'esri-icon-documentation',
          expandTooltip: "Expand Legend", 
        });


        // Add widgets to the viewUI
        mapView.ui.add(search,   'top-right');
        mapView.ui.add(legend,   'top-left');
        mapView.ui.add(bgExpand, 'bottom-right');
        mapView.ui.add(layerListExpand,'top-right');
        mapView.ui.add(legendExpand,'top-left');
        mapView.ui.add(home,     'top-left');
        mapView.ui.add(locate,   'top-left');
     // mapView.ui.add(compass,  'top-left');
        mapView.ui.add(scaleBar, 'bottom-left');
        // mapView.ui.add(layerList, 'top-right');

        MapService.mapView = mapView;
        return { val: mapView };
    }

    public async createSceneView(element: HTMLDivElement): Promise<EsriWrapper<__esri.SceneView>> {
        const loader = EsriLoaderWrapperService.esriLoader;
        const theMap = await this.getMap();
        const [SceneView] = await loader.loadModules(['esri/views/SceneView']);
        const opts: __esri.SceneViewProperties = {
            container: element,
            map: theMap,
            center: { longitude: -83.4096256, latitude: 42.4087785 },
            zoom: 12
        };
        const sceneView: __esri.SceneView = new SceneView(opts);
        return { val: sceneView };
    }

    public async plotMarker(lat: number, lon: number, pointColor): Promise<EsriWrapper<__esri.MapView>> {

        console.log("fired plotMarker() in MapService");
        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [SimpleMarkerSymbol, Point, Graphic, Color] = await loader.loadModules([
            'esri/symbols/SimpleMarkerSymbol',
            'esri/geometry/Point',
            'esri/Graphic',
            'esri/Color'
        ]);
        
        // let's give the symbol a prettier color
        const color: __esri.Color = new Color();
        color.a = pointColor.a;
        color.r = pointColor.r;
        color.g = pointColor.g;
        color.b = pointColor.b;

        // set up the first required piece, a symbol
        const symbolProps: __esri.SimpleMarkerSymbolProperties = {
            style: "circle",
            size: 12,
            color: color
        }
        const symbol: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol(symbolProps);

        // the point holds the coordinates the graphic will be displayed at
        const pointProps: __esri.PointProperties = {
            latitude: lat,
            longitude: lon
        }
        const point: __esri.Point = new Point(pointProps);
        
        // the grpahic is what ultimately gets rendered to the map
        const graphicProps: __esri.GraphicProperties = {
            geometry: point,
            symbol: symbol
            
        }
        console.log('graphicprops',graphicProps);
        const graphic: __esri.Graphic = new Graphic(graphicProps);
        MapService.mapView.graphics.add(graphic);
        
        return { val: MapService.mapView };
    }

  public getMapView():  __esri.MapView{
    // to return Mapview
    return MapService.mapView;
  }

  public async removeMapLayers(): Promise<EsriWrapper<__esri.MapView>> {
        console.log("fired removeMapLayers() in MapService");

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer,GraphicsLayer,MapLayer,geometryEngine] = await loader.loadModules([
            'esri/layers/FeatureLayer',
            'esri/layers/GraphicsLayer',
            'esri/layers/MapImageLayer',
            'esri/geometry/geometryEngine',
            'dojo/domReady!'
        ]);

        // remove all layers
        MapService.mapView.map.layers.removeAll();
        return { val: MapService.mapView };
  }

  public async setMapLayers(selectedLayers: any[]): Promise<EsriWrapper<__esri.MapView>> {
        console.log("fired setMapLayers() in MapService");

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer,GraphicsLayer,MapLayer,geometryEngine] = await loader.loadModules([
            'esri/layers/FeatureLayer',
            'esri/layers/GraphicsLayer',
            'esri/layers/MapImageLayer',
            'esri/geometry/geometryEngine',
            'dojo/domReady!'
        ]);

        // remove all layers
        MapService.mapView.map.layers.removeAll();

        // loop through array setting each layer based on layer type
        selectedLayers.forEach((element, index) => {
           if (element.indexOf('MapServer') !== -1) {
               MapService.mapView.map.add(new MapLayer({url: element, opacity: 0.65}));
               console.log('added MapLayer:' + element);
           };
           if (element.indexOf('FeatureServer') !== -1) {
               MapService.mapView.map.add(new FeatureLayer({url: element, opacity: 0.65}));
               console.log('added FeatureLayer:' + element);
           }
        });

        return { val: MapService.mapView };
  }

}

export interface EsriWrapper<T> {

    val: T;

}
