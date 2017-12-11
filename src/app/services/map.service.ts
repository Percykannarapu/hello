import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { map } from 'rxjs/operator/map';
import { forEach } from '@angular/router/src/utils/collection';

@Injectable()
export class MapService {

    private static mapView: __esri.MapView;
    public static layerNames: Set<string> = new Set<string>();
    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();

    private mapInstance: __esri.Map;

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
            center: { longitude: -98.5795, latitude: 39.8282 },
            zoom: 4
        };
        const mapView: __esri.MapView = new MapView(opts);

        // Create the LayerList widget with the associated actions
        // and add it to the top-right corner of the view.
        const layerList = new LayerList({
            view: mapView,
            container: document.createElement('div'),
            popup: {
                highlightEnabled: false,
                dockEnabled: true,
                dockOptions: {
                    breakpoint: false,
                    position: 'top-right'
                }
            },
            extent: {
                xmin: -3094834,
                ymin: -44986,
                xmax: 2752687,
                ymax: 3271654,
                spatialReference: {
                    wkid: 5070
                }
            },
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
            expandTooltip: 'Basemap Gallery',
        });
        const layerListExpand = new Expand({
            view: mapView,
            content: layerList.container,
            expandIconClass: 'esri-icon-layer-list',
            expandTooltip: 'Expand LayerList',
        });
        const legendExpand = new Expand({
            view: mapView,
            content: legend.container,
            expandIconClass: 'esri-icon-documentation',
            expandTooltip: 'Expand Legend',
        });


        // Add widgets to the viewUI
        mapView.ui.add(search, 'top-right');
        mapView.ui.add(legend, 'top-left');
        mapView.ui.add(bgExpand, 'bottom-right');
        mapView.ui.add(layerListExpand, 'top-right');
        mapView.ui.add(legendExpand, 'top-left');
        mapView.ui.add(home, 'top-left');
        mapView.ui.add(locate, 'top-left');
        mapView.ui.add(scaleBar, 'bottom-left');

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

    public async plotMarker(lat: number, lon: number, pointColor, popupTemplate?: __esri.PopupTemplate): Promise<EsriWrapper<__esri.MapView>> {

        console.log('fired plotMarker() in MapService');
        this.createGraphic(lat, lon, pointColor, popupTemplate).then(graphic => {
            MapService.mapView.graphics.add(graphic);
        });


        return { val: MapService.mapView };
    }

    public getMapView(): __esri.MapView {
        // to return Mapview
        return MapService.mapView;
    }

    public async removeMapLayers(): Promise<EsriWrapper<__esri.MapView>> {
        console.log('fired removeMapLayers() in MapService');

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, GraphicsLayer, MapLayer, geometryEngine] = await loader.loadModules([
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

    public async setMapLayers(selectedLayers: any[], analysisLevel: string): Promise<EsriWrapper<__esri.MapView>> {
        console.log('fired setMapLayers() in MapService');

        const Census = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer';
        const ATZ_Digital = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/digitalATZ/FeatureServer';
        const ZIP_Top_Vars = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Top_Vars/FeatureServer';
        const ATZ_Top_Vars = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer';
        const PCR_Top_Vars = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer';
        const ZIP_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Centroids/FeatureServer';
        const ATZ_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer';
        const PCR_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer';

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, GraphicsLayer, MapLayer, geometryEngine, ExpandVM] = await loader.loadModules([
            'esri/layers/FeatureLayer',
            'esri/layers/GraphicsLayer',
            'esri/layers/MapImageLayer',
            'esri/geometry/geometryEngine',
            'esri/widgets/Expand/ExpandViewModel',
            'dojo/domReady!'
        ]);

        const expandVM = new ExpandVM({
            view: MapService.mapView
        });

        // remove all layers
        MapService.mapView.map.layers.removeAll();
        // MapService.mapView.ui.layerListExpand.expand();

        // loop through array setting each layer based on layer type
        selectedLayers.forEach((element, index) => {
            if (analysisLevel === 'None') {
                if (element.indexOf('MapServer') !== -1) {
                    MapService.mapView.map.add(new MapLayer({ url: element, opacity: 0.65 }));
                    console.log('added MapLayer:' + element);
                } else
                    if (element.indexOf('FeatureServer') !== -1) {
                        MapService.mapView.map.add(new FeatureLayer({ url: element, opacity: 0.65 }));
                        console.log('added FeatureLayer:' + element);
                    }
            } else
                if (element !== ATZ_Centroids && element !== ZIP_Centroids && element !== PCR_Centroids &&
                    element !== ATZ_Top_Vars && element !== ZIP_Top_Vars && element !== PCR_Top_Vars) {
                    if (element.indexOf('MapServer') !== -1) {
                        MapService.mapView.map.add(new MapLayer({ url: element, opacity: 0.65 }));
                        console.log('added MapLayer:' + element);
                    } else
                        if (element.indexOf('FeatureServer') !== -1) {
                            MapService.mapView.map.add(new FeatureLayer({ url: element, opacity: 0.65 }));
                            console.log('added FeatureLayer:' + element);
                        }
                }
        });

        if (analysisLevel === 'Zip') {
            MapService.mapView.map.add(new FeatureLayer({ url: ZIP_Top_Vars, opacity: 1, visible: false }));
            MapService.mapView.map.add(new FeatureLayer({ url: ZIP_Centroids, opacity: 1, visible: false }));
        } else
            if (analysisLevel === 'Atz') {
                MapService.mapView.map.add(new FeatureLayer({ url: ATZ_Top_Vars, opacity: 1, visible: false }));
                MapService.mapView.map.add(new FeatureLayer({ url: ATZ_Digital, opacity: 1, visible: false }));
                MapService.mapView.map.add(new FeatureLayer({ url: ATZ_Centroids, opacity: 1, visible: false }));
            } else
                if (analysisLevel === 'Pcr') {
                    MapService.mapView.map.add(new FeatureLayer({ url: PCR_Top_Vars, opacity: 1, visible: false }));
                    MapService.mapView.map.add(new FeatureLayer({ url: PCR_Centroids, opacity: 1, visible: false }));
                }

        MapService.mapView.map.add(new MapLayer({ url: Census, opacity: 1 }));
        return { val: MapService.mapView };
    }

    public async drawCircle(lat: number, lon: number, pointColor, miles: number): Promise<EsriWrapper<__esri.MapView>> {
        console.log('inside drawCircle' + lat + 'long::' + lon + 'color::' + pointColor + 'miles::' + miles);
        const loader = EsriLoaderWrapperService.esriLoader;
        const [Map, array, geometryEngine, Collection, MapView, Circle, GraphicsLayer, Graphic, Point, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color]
            = await loader.loadModules([
                'esri/Map',
                'dojo/_base/array',
                'esri/geometry/geometryEngine',
                'esri/core/Collection',
                'esri/views/MapView',
                'esri/geometry/Circle',
                'esri/layers/GraphicsLayer',
                'esri/Graphic',
                'esri/geometry/Point',
                'esri/symbols/SimpleFillSymbol',
                'esri/symbols/SimpleLineSymbol',
                'esri/symbols/SimpleMarkerSymbol',
                'esri/Color', 'dojo/domReady!'
            ]);

        /*this.mapInstance = new Map(
            {   center: [lat, lon],
                basemap: 'topo' ,
                zoom: 9,
                slider: false
            }
        ); */


        let pointIndex = 0;
        let pointLongitude = lon;
        let pointLatitude = lat;

        let defaultSymbol: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol({
            style: 'circle',
            size: 12,
            color: pointColor
        });

        let sym: __esri.SimpleFillSymbol =
            new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID
                , new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, pointColor, 2)
                , pointColor
            );

        sym.outline.color = new Color([0, 0, 255, 0.25]);

        let gl: __esri.GraphicsLayer = new GraphicsLayer({ id: 'circles' });

        MapService.mapView.map.add(gl);

        console.log('miles radius' + miles);

        pointIndex++;
        // pointLatitude+=0.001;
        // pointLatitude+=0.001;

        let p = new Point({
            x: pointLongitude,
            y: pointLatitude,
            spatialReference: 4326
        });

        let circle = new Circle({
            radius: miles,
            center: p,
            geodesic: true,
            radiusUnit: 'miles'
        });

        let g = new Graphic({
            geometry: circle,
            symbol: sym
        });

        gl.add(g);
        return { val: MapService.mapView };
    }

    public async bufferMergeEach(lat: number, lon: number, pointColor, miles: number): Promise<EsriWrapper<__esri.MapView>> {

        console.log('inside bufferMergeEach:: UNDER CONSTRUCTION');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [Map, graphicsUtils, array, geometryEngine, Collection, MapView, Circle, GraphicsLayer, Graphic, Point, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color]
            = await loader.loadModules([
                'esri/Map',
                'esri/graphicsUtils',
                'dojo/_base/array',
                'esri/geometry/geometryEngine',
                'esri/core/Collection',
                'esri/views/MapView',
                'esri/geometry/Circle',
                'esri/layers/GraphicsLayer',
                'esri/Graphic',
                'esri/geometry/Point',
                'esri/symbols/SimpleFillSymbol',
                'esri/symbols/SimpleLineSymbol',
                'esri/symbols/SimpleMarkerSymbol',
                'esri/Color', 'dojo/domReady!'
            ]);

        let pointIndex = 0;
        let pointLongitude = lon;
        let pointLatitude = lat;

        let sym: __esri.SimpleFillSymbol =
            new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID
                , new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, pointColor, 2)
                , pointColor
            );

        sym.outline.color = new Color([0, 0, 255, 0.25]);

        let gl: __esri.GraphicsLayer = new GraphicsLayer({ id: 'circles' });

        MapService.mapView.map.add(gl);

        pointIndex++;
        let p = new Point({
            x: pointLongitude,
            y: pointLatitude,
            spatialReference: 4326
        });

        let circle = new Circle({
            radius: miles,
            center: p,
            geodesic: true,
            radiusUnit: 'miles'
        });

        let g = new Graphic({
            geometry: circle,
            symbol: sym
        });

        gl.add(g);

        // var featureLayer = MapService.mapView.layerViews(MapService.mapView.a)
        // map.get(MapService.mapView.map.g)
        //    geodesicBuffer(geometry: Geometry | Geometry[], distance: number | number[], unit: string | number, unionResults?: boolean): Polygon | Polygon[];

        // __esri.gr
        let geometries = graphicsUtils.geometries(gl.graphics);
        let bufferedGeometries = geometryEngine.geodesicBuffer(geometries, miles, 'Miles', true);

        array.forEach(bufferedGeometries, function (geometry) {
            MapService.mapView.graphics.add(new Graphic(geometry, sym));
        });
        return { val: MapService.mapView };
    }

    public async createFeatureLayer(graphics: __esri.Graphic[], layerName: string) {
        console.log('fired createFeautreLayer() in MapService');
        if (MapService.layerNames.has(layerName)) {
            console.log('layer name already exists');
            throw new Error('Layer name already exists, please use a different name');
        }
        MapService.layerNames.add(layerName);
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, Renderer] = await loader.loadModules(['esri/layers/FeatureLayer', 'esri/renderers/Renderer']);
        const featureRenderer = { type: 'simple' };

        const lyr = new FeatureLayer({
            fields: [
                {
                    name: 'ObjectID',
                    alias: 'ObjectID',
                    type: 'oid'
                }, {
                    name: 'type',
                    alias: 'Type',
                    type: 'string'
                }, {
                    name: 'place',
                    alias: 'Place',
                    type: 'string'
                }],
            objectIdField: 'ObjectID',
            geometryType: 'point',
            spatialReference: { wkid: 5070 },
            source: graphics,
            popupTemplate: null,
            renderer: featureRenderer,
            title: layerName,
            capabilities: {
                operations: {
                    supportsAdd: true,
                    supportsDelete: true,
                    supportsUpdate: true,
                    supportsEditing: true,
                    supportsCalculate: true,
                    supportsQuery: true
                }
            }
        });
        MapService.mapView.map.add(lyr);
        MapService.layers.add(lyr);
        MapService.layerNames.add(lyr.title);
    }

    public async updateFeatureLayer(graphics: __esri.Graphic[], layerTitle: string) {
        console.log('fired updateFeatureList() in MapService');

        // check to see if this is the first layer being added
        if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
            this.createFeatureLayer(graphics, layerTitle);
            return;
        }

        let layerUpdated: boolean = false;

        // loop through the existing layers to see if we can find one to update, otherwise create a new one
        MapService.layers.forEach(currentLayer => {
            if (layerTitle === currentLayer.title) {
                console.log('updating existing layer with '  + graphics.length + ' graphics');

                // add the new graphics to the existing layer
                for (const graphic of graphics) {
                    (<__esri.FeatureLayer>currentLayer).source.add(graphic);
                }
                layerUpdated = true;
            }
        });

        if (!layerUpdated) {
            console.log('FeatureLayer requested for update does not exist, creating');
            await this.createFeatureLayer(graphics, layerTitle);
            return;
        }
    }

    public async createGraphic(lat: number, lon: number, pointColor, popupTemplate?: __esri.PopupTemplate): Promise<__esri.Graphic> {
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
            style: 'diamond',
            size: 12,
            color: color
        };
        const symbol: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol(symbolProps);
        symbol.outline = null;


        // the point holds the coordinates the graphic will be displayed at
        const pointProps: __esri.PointProperties = {
            latitude: lat,
            longitude: lon
        };
        const point: __esri.Point = new Point(pointProps);

        // the grpahic is what ultimately gets rendered to the map
        const graphicProps: __esri.GraphicProperties = {
            geometry: point,
            symbol: symbol

        };

        // if we got a popup template add that to the graphic as well
        if (popupTemplate != null) {
            graphicProps.popupTemplate = popupTemplate;
        }
        const graphic: __esri.Graphic = new Graphic(graphicProps);
        return graphic;
    }

}

export interface EsriWrapper<T> {

    val: T;

}
