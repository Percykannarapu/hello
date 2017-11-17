import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService} from "./esri-loader-wrapper.service";
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
               ScaleBar, 
               Track
              ] = await loader.loadModules(['esri/views/MapView',
                                                          'esri/widgets/Home',
                                                          'esri/widgets/Search',
                                                          'esri/widgets/ScaleBar',
                                                          'esri/widgets/Track',
                                                          'esri/widgets/BasemapToggle'
                                           ]);
        const opts: __esri.MapViewProperties = {
            container: element,
            map: theMap,
            center: { longitude: -83.4096256, latitude: 42.4087785 },
            zoom: 10
        };
        const mapView: __esri.MapView = new MapView(opts);

        // Add the home button to the top left corner of the view
        const homeBtn = new Home({ 
                                   view: mapView 
                                 });
        // Create an instace of the Track widget
        const track = new Track({ 
                                   view: mapView 
                                 });

        // Add the search widget to the top left corner of the view
        const searchWidget = new Search({ 
                                   view: mapView 
                                 });

        // Add the scale bar widget
        const scaleBar = new ScaleBar({ 
                                   view: mapView,
                                   unit: "dual" // The scale bar displays both metric and non-metric units.
                                 });
        
        // Add widgets to the view
        mapView.ui.add(searchWidget, "top-right");
        mapView.ui.add(homeBtn,      "top-left");
        mapView.ui.add(track,        "top-left");
        mapView.ui.add(scaleBar,     "bottom-left");

        MapService.mapView = mapView;

        // The widget will start tracking your location once the view becomes ready
        mapView.then(function() {
          track.start();
        });

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

    public async plotMarker(lat: number, lon: number): Promise<EsriWrapper<__esri.MapView>> {

        console.log("fired plotMarker() in MapService");

        //load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [SimpleMarkerSymbol, Point, Graphic, Color] = await loader.loadModules([
            'esri/symbols/SimpleMarkerSymbol',
            'esri/geometry/Point',
            'esri/Graphic',
            'esri/Color'
        ]);

        //let's give the symbol a prettier color
        const color: __esri.Color = new Color();
        color.a = 0.5;
        color.r = 35;
        color.g = 93;
        color.b = 186

        //set up the first required piece, a symbol
        const symbolProps: __esri.SimpleMarkerSymbolProperties = {
            style: "circle",
            size: 12,
            color: color
        }
        const symbol: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol(symbolProps);

        //the point holds the coordinates the graphic will be displayed at
        const pointProps: __esri.PointProperties = {
            latitude: lat,
            longitude: lon
        }
        const point: __esri.Point = new Point(pointProps);

        //the grpahic is what ultimately gets rendered to the map
        const graphicProps: __esri.GraphicProperties = {
            geometry: point,
            symbol: symbol
        }
        const graphic: __esri.Graphic = new Graphic(graphicProps);

        MapService.mapView.graphics.add(graphic);
        return { val: MapService.mapView };
    }

}

export interface EsriWrapper<T> {

    val: T;

}
