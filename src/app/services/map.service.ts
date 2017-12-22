import { element } from 'protractor';
import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { map } from 'rxjs/operator/map';
import { forEach } from '@angular/router/src/utils/collection';
import { Points } from '../Models/Points';
import { Query } from '@angular/core/src/metadata/di';

@Injectable()
export class MapService {

    private static mapView: __esri.MapView;
    public static layerNames: Set<string> = new Set<string>();
    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();
    public static featureLayerView : __esri.FeatureLayerView;

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
            BasemapGallery,
            Print
        ] = await loader.loadModules(['esri/views/MapView',
            'esri/widgets/Home',
            'esri/widgets/Search',
            'esri/widgets/Legend',
            'esri/widgets/LayerList',
            'esri/widgets/ScaleBar',
            'esri/widgets/Locate',
            'esri/widgets/Compass',
            'esri/widgets/Expand',
            'esri/widgets/BasemapGallery',
            'esri/widgets/Print'
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

        // Create an instance of the BasemapGallery widget
        const print = new Print({
            view: mapView,
            printServiceUrl: "https://valvcshad001vm.val.vlss.local/server/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
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

        const printExpand = new Expand({
            view: mapView,
            content: print.container,
            expandIconClass: 'esri-icon-printer',
            expandTooltip: 'Print',
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
        mapView.ui.add(printExpand, 'top-right');

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

    public getFeaturLayer() : __esri.FeatureLayer{

        var featurelyr : __esri.FeatureLayer[] = [];
       // MapService.mapView.map.layers.f
       /* MapService.mapView.map.add(lyr);
        MapService.layers.add(lyr);
        MapService.layerNames.add(lyr.title);*/


        return null;
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

        const Census        = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer';
        const ATZ_Digital   = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/digitalATZ/FeatureServer';
        const ZIP_Top_Vars  = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Top_Vars/FeatureServer';
        const ATZ_Top_Vars  = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer';
        const PCR_Top_Vars  = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer';
        const ZIP_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Centroids/FeatureServer';
        const ATZ_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer';
        const PCR_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer';

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [PopupTemplate, FeatureLayer, GraphicsLayer, MapLayer, geometryEngine, ExpandVM] = await loader.loadModules([
            'esri/PopupTemplate',
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
        let popupTitle: string[];
        let startPos: number;
        let endPos: number;

        selectedLayers.forEach((element, index) => {

            // dynamically set the popup title to the layer being loaded
            startPos = element.indexOf('/rest/services/');
            endPos = element.indexOf('/FeatureServer');
            if (endPos === -1) {
                endPos = element.indexOf('/MapServer');
                popupTitle = element.slice(startPos + 15, endPos);
            } else {
                popupTitle = element.slice(startPos + 15, endPos);
            }
            console.log('PopupTitle=' + popupTitle);

            // Load other optional selected layers
            if (analysisLevel === 'None') {
                if (element.indexOf('MapServer') !== -1) {
                    MapService.mapView.map.add(new MapLayer({ url: element, outfields: ["*"], popupTemplate: { title: popupTitle , content: '{*}' }, opacity: 0.65 }));
                    console.log('added MapLayer:' + element);
                } else
                    if (element.indexOf('FeatureServer') !== -1) {
                        MapService.mapView.map.add(new FeatureLayer({ url: element, outfields: ["*"], popupTemplate: { title: popupTitle , content: '{*}' }, opacity: 0.65 }));
                        console.log('added FeatureLayer:' + element);
                    }
            } else
                if (element !== ATZ_Centroids && element !== ZIP_Centroids && element !== PCR_Centroids &&
                    element !== ATZ_Top_Vars && element !== ZIP_Top_Vars && element !== PCR_Top_Vars) {
                    if (element.indexOf('MapServer') !== -1) {
                        MapService.mapView.map.add(new MapLayer({ url: element, outfields: ["*"], popupTemplate: { title: popupTitle, content: '{*}' }, opacity: 0.65 }));
                        console.log('added MapLayer:' + element);
                    } else
                        if (element.indexOf('FeatureServer') !== -1) {
                            MapService.mapView.map.add(new FeatureLayer({ url: element, outfields: ["*"], popupTemplate: { title: popupTitle, content: '{*}' }, opacity: 0.65 }));
                            console.log('added FeatureLayer:' + element);
                        }
                }
        });

        if (analysisLevel === 'Zip') {
            MapService.mapView.map.add(new FeatureLayer({ url: ZIP_Top_Vars,  outfields: ["*"], popupTemplate: { title: 'ZIP Top Vars' , content: '{*}' }, opacity: 1, visible: false }));
            MapService.mapView.map.add(new FeatureLayer({ url: ZIP_Centroids, outfields: ["*"], popupTemplate: { title: 'ZIP Centroids', content: '{*}' }, opacity: 1, visible: false }));
        } else
            if (analysisLevel === 'Atz') {
                var atzDigitalFlyr = new FeatureLayer({ url: ATZ_Digital,   outfields: ["*"], popupTemplate: { title: 'Atz Digital'  , content: '{*}' }, opacity: 1, visible: false });
                var atzTopVarsFlyr = new FeatureLayer({ url: ATZ_Top_Vars,  outfields: ["*"], popupTemplate: { title: 'Atz Top Vars' , content: '{*}' }, opacity: 1, visible: false });
                var atzCentroidFlyr = new FeatureLayer({ url: ATZ_Centroids, outfields: ["*"], popupTemplate: { title: 'Atz Centroids', content: '{*}' }, opacity: 1, visible: false });
                MapService.mapView.map.add(atzDigitalFlyr);
                MapService.mapView.map.add(atzTopVarsFlyr);
                MapService.mapView.map.add(atzCentroidFlyr);
                MapService.layers.add(atzDigitalFlyr);
                MapService.layers.add(atzTopVarsFlyr);
                MapService.layers.add(atzCentroidFlyr);
            } else
                if (analysisLevel === 'Pcr') {
                    MapService.mapView.map.add(new FeatureLayer({ url: PCR_Top_Vars,  outfields: ["*"], popupTemplate: { title: 'PCR Top Vars', content: '{*}' }, opacity: 1, visible: false }));
                    MapService.mapView.map.add(new FeatureLayer({ url: PCR_Centroids, outfields: ["*"], popupTemplate: { title: 'PCR Centroids', content: '{*}' }, opacity: 1, visible: false }));
                }

        MapService.mapView.map.add(new MapLayer({ url: Census, opacity: 1 }));
        return { val: MapService.mapView };
    }

    public async drawCircle(lat: number, lon: number, pointColor, miles: number,title: string,outlneColor): Promise<EsriWrapper<__esri.MapView>> {
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

        sym.outline.color = outlneColor;

        let gl: __esri.GraphicsLayer = new GraphicsLayer({ id: 'circles' });

      //  MapService.mapView.map.add(gl);

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
            radiusUnit: 'kilometers'
        });

        let g = new Graphic({
            geometry: circle,
            symbol: sym
        });
        var graphicList : __esri.Graphic [] = [];
        graphicList.push(g);
        await this.updateFeatureLayer(graphicList , title);
        await this.selectCentroid(graphicList);
        //await this.zoomOnMap(graphicList);
        return { val: MapService.mapView };
    }

    public async bufferMergeEach(pointsArray: Points[],pointColor,kms: number,title : string,outlneColor)
    : Promise<EsriWrapper<__esri.MapView>>{
            console.log("inside bufferMergeEach:: UNDER CONSTRUCTION")
            console.log("number of kilometers::::"+kms);
            const loader = EsriLoaderWrapperService.esriLoader;
            const [Map,array,geometryEngine,Collection,MapView,Circle,GraphicsLayer,Graphic,Point,SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,Color]
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
                'esri/Color','dojo/domReady!'  
            ]);
        
            let sym : __esri.SimpleFillSymbol = 
            new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID
                , new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,pointColor,2)
                ,pointColor
            );
            sym.outline.color  = outlneColor;
        
            let pointList : __esri.Point[] =[];
        
            for(let point of pointsArray){
                let p = new Point({
                    x: point.longitude,
                    y: point.latitude,
                    spatialReference: 4326
                  });
                  pointList.push(p);
            }
           // MapService.mapView.graphics.removeAll();
            var graphicList : __esri.Graphic [] = [];
            let bufferedGeometries = geometryEngine.geodesicBuffer(pointList, kms, "kilometers", true);
           array.forEach(bufferedGeometries,function(geometry){
                //MapService.mapView.graphics.add(new Graphic(geometry,sym));
                graphicList.push(new Graphic(geometry,sym));
            });
            //await this.createFeatureLayer(graphicList , "testGraphicMerge");
            await this.updateFeatureLayer(graphicList , title);
            console.log('draw buffer--------->'+graphicList.length);
           // await this.zoomOnMap(graphicList);
            await this.selectCentroid(graphicList);
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
        const [FeatureLayer, Renderer,Polygon] = await loader.loadModules(['esri/layers/FeatureLayer', 
        'esri/renderers/Renderer','esri/geometry/Polygon']);
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
            popupTemplate: {content: '{*}'},
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

       // MapService.mapView.zoom = 7;
        console.log('Test zoom:::');
       // this.zoomOnMap(graphics);
       this.zoomOnMap(graphics);
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

       // await this.zoomOnMap(graphics);
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
            style: 'circle',
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

    public async zoomOnMap(graphics: __esri.Graphic[]){
        const loader = EsriLoaderWrapperService.esriLoader;
        const [SimpleMarkerSymbol, Point, Graphic, Color,Extent] = await loader.loadModules([
            'esri/symbols/SimpleMarkerSymbol',
            'esri/geometry/Point',
            'esri/Graphic',
            'esri/Color',
            'esri/geometry/Extent'
        ]);
        var lyr : __esri.FeatureLayer;
        MapService.layers.forEach(layer => {
            lyr = <__esri.FeatureLayer>layer;
        });
        

        var p : __esri.Point = new Point();
        var pList : __esri.Point[] = [];
        var latList : number[] = [];
        var lonList : number[] = [];
        var graphicList1 : __esri.Graphic[] = [];

      await  graphics.forEach(function(current : any){
            //console.log('test inside current obj::'+current.geometry.latitude)
            p.latitude  = current.geometry.latitude;
            p.longitude = current.geometry.longitude; 
            pList.push(p);
            lonList.push(p.longitude);   /// this is X
            latList.push(p.latitude) ;   /// this is y
            graphicList1.push(current);
        });
        console.log("number of points on the map"+pList.length);
        var minX = Math.min(...lonList);
        var minY = Math.min(...latList);
        var maxX = Math.max(...lonList);
        var maxY = Math.max(...latList);

        console.log("minX::"+minX+"::minY::"+minY+"::maxX::"+maxX+"::maxY::"+maxY);
        var extent: __esri.Extent;// = new Extent();
        
        extent = new Extent({
            xmin: minX,
            ymin: minY,
            xmax: maxX,
            ymax: maxY,
            spatialReference: {
                wkid: 4326
            }
        });
        try {
            if (extent.width === 0) {
                extent.xmin = extent.xmin - 0.15;
                extent.xmax = extent.xmax + 0.15;
            }
            if (extent.height === 0) {
                extent.ymin = extent.ymin - 0.15;
                extent.ymax = extent.ymax + 0.15;
            }
            MapService.mapView.extent = extent;
        } catch (error) {
            throw new Error(error.message);
        }
       // MapService.mapView.goTo(graphicList1);
       // MapService.mapView.zoom = 6;
    }

    public async selectCentroid(graphicList : __esri.Graphic[]){
        console.log('selectCentroid fired::::');
        

        var graphic = graphicList[0];
        var fSet : __esri.FeatureSet;
        var fLyrList : __esri.FeatureLayer[] = [];
        await MapService.layers.forEach(function(lyr:__esri.FeatureLayer){
            fLyrList.push(lyr); 
            
        });

        for(let lyr of fLyrList){
            if(lyr.title.startsWith('IMPOWER')){
                var qry = lyr.createQuery();
                qry.geometry = graphic.geometry;
                qry.outSpatialReference = MapService.mapView.spatialReference;
               await lyr.queryFeatures(qry).then(function(featureSet){
                    fSet = featureSet;
                });
               await this.selectPoly(fSet.features);
            }
        }
    }

    public async selectPoly(centroidGraphics : __esri.Graphic[]){
        console.log('fired selectPoly');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [Query,Graphic,SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,Color]
         = await loader.loadModules([
            'esri/tasks/support/Query',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color','dojo/domReady!'  
        ]);

        var symbol123 = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0,255,0,0.65]), 2
            ),
            new Color([0,255,0,0.35])
          );
          var fLyrList : __esri.FeatureLayer[] = [];
        await MapService.layers.forEach(function(lyr:__esri.FeatureLayer){
            fLyrList.push(lyr);
        });

        for(let lyr of fLyrList){
            if(lyr.title.startsWith('ATZ Top')){
                var polyGraphics : __esri.Graphic[] = [];
                for(let centroidGraphic of centroidGraphics){
                    var qry1 = lyr.createQuery();
                    qry1.geometry = centroidGraphic.geometry;
                    qry1.outSpatialReference = MapService.mapView.spatialReference;
                    
                    await lyr.queryFeatures(qry1).then(function(polyFeatureSet){
                        for(var i =0 ; i<polyFeatureSet.features.length ; i++){
                            polyFeatureSet.features[i].symbol = symbol123;
                            polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry,symbol123));
                        }
                    });
                 }
                MapService.layers.forEach(function(polyLayer : __esri.FeatureLayer){
                   if (polyLayer.title.startsWith('ATZ Top')) {
                      for(const polyGraphic of polyGraphics){
                         //(<__esri.FeatureLayer>polyLayer).source.add(polyGraphic);
                         MapService.mapView.graphics.add(polyGraphic); 
                        //polyLayer.source.push(polyGraphic);
                        }
                    }
                });
            }
        }
    }
}

export interface EsriWrapper<T> {

    val: T;

}
