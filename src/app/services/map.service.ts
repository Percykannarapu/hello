import { Injectable } from '@angular/core';

import { EsriLoaderService } from 'angular-esri-loader';

@Injectable()
export class MapService {

    private mapInstance: __esri.Map;
    private static mapView: __esri.MapView;

    constructor(private esriLoader: EsriLoaderService) {
        //

    }

    public async setup(): Promise<EsriLoaderService> {
        await this.esriLoader.load({
            url: 'https://js.arcgis.com/4.5/init.js'
        });
        return this.esriLoader;
    }

    public async getMap(): Promise<__esri.Map> {
        if (!!this.mapInstance) {
            return this.mapInstance;
        }
        const loader = await this.setup();
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
        const loader = await this.setup();
        const theMap = await this.getMap();
        const [MapView] = await loader.loadModules(['esri/views/MapView']);
        const opts: __esri.MapViewProperties = {
            container: element,
            map: theMap,
            center: { longitude: -83.4096256, latitude: 42.4087785 },
            zoom: 10
        };
        const mapView: __esri.MapView = new MapView(opts);
        MapService.mapView = mapView;
        return { val: mapView };
    }

    public async createSceneView(element: HTMLDivElement): Promise<EsriWrapper<__esri.SceneView>> {
        const loader = await this.setup();
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

    public async plotMarker(lat: number, lon: number): Promise<EsriWrapper<__esri.MapView>>{

        console.log("fired plotMarker() in MapService");

        //load required modules for this method
        //const loader = await this.setup();
        const [SimpleMarkerSymbol, Point, Graphic] = await this.esriLoader.loadModules([
            'esri/symbols/SimpleMarkerSymbol',
            'esri/geometry/Point',
            'esri/Graphic'
        ]);

        //set up the first required piece, a symbol
        const symbolProps: __esri.SimpleMarkerSymbolProperties = {
            style: "circle",
            size: 12
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
        return {val: MapService.mapView};
    }

}

export interface EsriWrapper<T> {

    val: T;

}
