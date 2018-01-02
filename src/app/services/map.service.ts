import { map } from 'rxjs/operators';
//import { MapService } from './map.service';
import { SelectButtonModule } from 'primeng/primeng';
import { element } from 'protractor';
import { Injectable, OnInit } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
//import { map } from 'rxjs/operator/map';
import { forEach } from '@angular/router/src/utils/collection';
import { Points } from '../Models/Points';
import { Query } from '@angular/core/src/metadata/di';

// import primeng 
import { SelectItem } from 'primeng/primeng';

@Injectable()
export class MapService {

    // Group Layers
    private static EsriGroupLayer: __esri.GroupLayer;
    private static ZipGroupLayer: __esri.GroupLayer;
    private static AtzGroupLayer: __esri.GroupLayer;
    private static PcrGroupLayer: __esri.GroupLayer;
    private static HHGroupLayer: __esri.GroupLayer;
    private static SitesGroupLayer: __esri.GroupLayer;
    private static CompetitorsGroupLayer: __esri.GroupLayer;

    private static mapView: __esri.MapView;
    public static layerNames: Set<string> = new Set<string>();
    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();
    public static featureLayerView: __esri.FeatureLayerView;

    public static selectedGraphics : __esri.Graphic[] = [];

    private mapInstance: __esri.Map;

    constructor() {
    }

    public async initGroupLayers() : Promise<__esri.Map> {
        console.log('fired initGroupLayers()');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [GroupLayer] = await loader.loadModules([
            'esri/layers/GroupLayer'
        ]);
        MapService.EsriGroupLayer = new GroupLayer({
            title: 'ESRI',
            listMode: 'show-children',
            visible: true
        });

        MapService.ZipGroupLayer = new GroupLayer({
            title: 'Valassis ZIP',
            listMode: 'show-children',
            visible: true
        });
        
        MapService.AtzGroupLayer = new GroupLayer({
            title: 'Valassis ATZ',
            listMode: 'show-children',
            visible: true
        });

        MapService.PcrGroupLayer = new GroupLayer({
            title: 'Valassis PCR',
            listMode: 'show-children',
            visible: true
        });

        MapService.HHGroupLayer = new GroupLayer({
            title: 'Valassis Households',
            listMode: 'show-children',
            visible: true
        });

        MapService.SitesGroupLayer = new GroupLayer({
            title: 'Valassis Sites',
            listMode: 'show-children',
            visible: true
        });

        MapService.CompetitorsGroupLayer = new GroupLayer({
            title: 'Valassis Competitors',
            listMode: 'show-children',
            visible: true
        });

        return this.mapInstance;
    } 


    public async getMap(): Promise<__esri.Map> {
        if (!!this.mapInstance) {
            return this.mapInstance;
        };
        const loader = EsriLoaderWrapperService.esriLoader;
        const [Map, GroupLayer, Basemap] = await loader.loadModules([
            'esri/Map',
            'esri/layers/GroupLayer',
            'esri/Basemap'
        ]);
        if (!this.mapInstance) {
            this.mapInstance = new Map(
                { basemap: Basemap.fromId('streets'),
                  layers: []
                }
            );

        }
        return this.mapInstance;
    }

    public async createMapView(element: HTMLDivElement): Promise<EsriWrapper<__esri.MapView>> {
        const loader = EsriLoaderWrapperService.esriLoader;
        const theMap = await this.getMap();
        const [MapView,
            GroupLayer,
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
            'esri/layers/GroupLayer',
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
            printServiceUrl: 'https://valvcshad001vm.val.vlss.local/server/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
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

        // Setup Default Group Layers
        this.initGroupLayers();
        
        MapService.mapView = mapView;
        return { val: mapView };
    }
/*
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
*/
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

    public async hideMapLayers() : Promise<EsriWrapper<__esri.MapView>> {
        console.log('fired hideMapLayers() in MapService');

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
 
        // Toggle all layers
        MapService.mapView.map.layers.forEach(function(layer, i) {
            if (layer.visible === true) {
                //console.log (i + '. layer visible: ' + MapService.mapView.map.layers.getItemAt(i).visible);
                MapService.mapView.map.layers.getItemAt(i).visible = false;
            }
        });
        return { val: MapService.mapView };
    }

    // Physically Remove All MapLayers
    public async removeMapLayers() : Promise<EsriWrapper<__esri.MapView>> {
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


    // Physically Remove MapLayer (or GroupLayer)
    public async removeLayer(layer: __esri.Layer) : Promise<EsriWrapper<__esri.MapView>> {
        // console.log('fired removeLayer() in MapService');
        // remove Group Layer
        MapService.mapView.map.remove(layer);
        return { val: MapService.mapView };
    }


      // Returns a layer instance from the map based on its title property
      public findLayerByTitle(title: string)  : __esri.Layer {
        return MapService.mapView.map.layers.find(function(layer) {
            if (layer.title === title) {
                console.log ('findLayerByTitle Found: ' + title);
            }
            return layer.title === title;
        });
      }

      // Returns a sublayer instance from the map based on its title property
      public findSubLayerByTitle(GroupLayer: __esri.GroupLayer, title: string)  : __esri.Layer {
        return GroupLayer.layers.find(function(layer) {
            if (layer.title === title) {
                console.log ('findSubLayerByTitle found: ' + layer.title );
                return layer.title === title;                  
            } 
        });
      }


    public async setMapLayers(allLayers: any[], selectedLayers: any[], analysisLevels: string[]): Promise<EsriWrapper<__esri.MapView>> {
        console.log('fired setMapLayers() in MapService');
        const Census        = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer';

/*        
        const Census        = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer';
        const ATZ_Digital   = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/digitalATZ/FeatureServer';
        const ZIP_Top_Vars  = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Top_Vars/FeatureServer';
        const ATZ_Top_Vars  = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer';
        const PCR_Top_Vars  = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer';
        const ZIP_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Centroids/FeatureServer';
        const ATZ_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer';
        const PCR_Centroids = 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer';
*/        

        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [esriConfig, PopupTemplate, GroupLayer, LayerList, Layer, FeatureLayer, GraphicsLayer, MapLayer, geometryEngine, first, all] = await loader.loadModules([
            'esri/config',
            'esri/PopupTemplate',
            'esri/layers/GroupLayer',
            'esri/widgets/LayerList',                   
            'esri/layers/Layer',
            'esri/layers/FeatureLayer',
            'esri/layers/GraphicsLayer',
            'esri/layers/MapImageLayer',
            'esri/geometry/geometryEngine',
            'dojo/promise/first',
            'dojo/promise/all',
            'dojo/domReady!'
        ]);

        let popupTitle: string[];
        let startPos: number;
        let endPos: number;

         const zip_layerids = [
             'e35d20b9905c441b9f9bd0532b8e175e', // ZIP Top Vars
             'defb065089034dd181d8fdd6186e076b'  // ZIP Centroids
         ];       
         const atz_layerids = [
           'bf8c44d22e6f484285ca33a7efe0b6ec', // ATZ_Top_Vars
           '9e250767027e4e1e8eb60eddde628e46'  // ATZ_Digital
        ];
        const pcr_layerids = [];
        const hh_layerids = [
            '837f4f8be375464a8971c56a0856198e', // vt layer
            '5a99095bc95b45a7a830c9e25a389712'  // source featurelayer
          ];
 
        const fromPortal = id => Layer.fromPortalItem({
            portalItem: {
              id: id
            }
          });

        // Remove ESRI Group Layer Sublayers (will be reloaded from checkboxes)  
        MapService.EsriGroupLayer.visible = false;  
        MapService.EsriGroupLayer.removeAll();

        MapService.ZipGroupLayer.visible = false;  
        MapService.AtzGroupLayer.visible = false;  
        MapService.PcrGroupLayer.visible = false;  
        MapService.HHGroupLayer.visible = false;  

    // Esri Layers    
    if (selectedLayers.length != 0) {
        selectedLayers.forEach((element, index) => {
            console.log (element.name + ': ' + element.url);
            // dynamically set the popup title to the layer being loaded
            startPos = element.url.indexOf('/rest/services/');
            endPos = element.url.indexOf('/FeatureServer');
            if (endPos === -1) {
                endPos = element.url.indexOf('/MapServer');
                popupTitle = element.url.slice(startPos + 15, endPos);
            } else {
                popupTitle = element.url.slice(startPos + 15, endPos);
            }
            console.log('PopupTitle=' + popupTitle);
            // Load other optional selected layers
            if (element.url.indexOf('MapServer') !== -1) {
                if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, element.name)) {
                    MapService.EsriGroupLayer.add(new MapLayer({ url: element.url, outfields: ["*"], popupTemplate: { title: popupTitle, content: '{*}' }, opacity: 0.65 }));
                    console.log('added MapLayer:' + element.name);
                }    
            } else
                if (element.url.indexOf('FeatureServer') !== -1) {
                    if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, element.name)) {
                        MapService.EsriGroupLayer.add(new FeatureLayer({ url: element.url, outfields: ["*"], popupTemplate: { title: popupTitle, content: '{*}' }, opacity: 0.65 }));
                        console.log('added FeatureLayer:' + element.name);
                    }   
                };
            // Add ZIP Group Layer if it does not already exist
            if (!this.findLayerByTitle('ESRI')) {
                MapService.mapView.map.layers.add(MapService.EsriGroupLayer);
            }    
            MapService.EsriGroupLayer.visible = true;  
        });
    }

    // Analysis Levels
    if (analysisLevels.length != 0) {
        // Loop through each of the selected analysisLevels
        analysisLevels.forEach((analysisLevel, index) => {

        if (analysisLevel === 'ZIP') {
             // Add ZIP layer IDs 
             const layers = zip_layerids.map(fromPortal);
  
             // Add all ZIP Layers via Promise
             all(layers)
                 .then(results => {
                 results.forEach(x => {
                   if (x.type === "feature") {
                     x.minScale = 5000000;
                     x.mode = FeatureLayer.MODE_AUTO;
                   }
                   else {
                     x.maxScale = 5000000;
                   }
                   // Add Layer to Group Layer if it does not already exist
                   if (!this.findSubLayerByTitle(MapService.ZipGroupLayer, x.portalItem.title)) {
                       console.log ('adding subLayer: ' + x.portalItem.title)
                       MapService.ZipGroupLayer.add(x);
                   }
                });
            })
            .catch(error => console.warn(error.message));

               // Add ZIP Group Layer if it does not already exist
               if (!this.findLayerByTitle('Valassis ZIP')) {
                   MapService.mapView.map.layers.add(MapService.ZipGroupLayer);
                   MapService.layers.add(MapService.ZipGroupLayer);
               }    
               MapService.ZipGroupLayer.visible = true;  
        } else
            if (analysisLevel === 'ATZ') {
                // Add atz layer IDs 
                const layers = atz_layerids.map(fromPortal);
  
                // Add all ATZ Layers via Promise
                all(layers)
                 .then(results => {
                 results.forEach(x => {
                   if (x.type === "feature") {
                     x.minScale = 5000000;
                     x.mode = FeatureLayer.MODE_AUTO;
                   }
                   else {
                     x.maxScale = 5000000;
                   }
                   // Add Layer to Group Layer if it does not already exist
                   if (!this.findSubLayerByTitle(MapService.AtzGroupLayer, x.portalItem.title)) {
                       console.log ('adding subLayer: ' + x.portalItem.title)
                       MapService.AtzGroupLayer.add(x);
                   }
                });
            })
            .catch(error => console.warn(error.message));

               // Add ZIP Group Layer if it does not already exist
               if (!this.findLayerByTitle('Valassis ATZ')) {
                   MapService.mapView.map.layers.add(MapService.AtzGroupLayer);
               }    
               MapService.AtzGroupLayer.visible = true;  
            } else
                if (analysisLevel === 'PCR') {  
                    // Add PCR layer IDs 
                    const layers = pcr_layerids.map(fromPortal);
  
                    // Add all PCR Layers via Promise
                    all(layers)
                     .then(results => {
                     results.forEach(x => {
                       if (x.type === "feature") {
                         x.minScale = 5000000;
                         x.mode = FeatureLayer.MODE_AUTO;
                       }
                       else {
                         x.maxScale = 5000000;
                       }
                       // Add Layer to Group Layer if it does not already exist
                       if (!this.findSubLayerByTitle(MapService.PcrGroupLayer, x.portalItem.title)) {
                           console.log ('adding subLayer: ' + x.portalItem.title)
                           MapService.PcrGroupLayer.add(x);
                       }
                       });
                    })
                    .catch(error => console.warn(error.message));

                    // Add PCR Group Layer if it does not already exist
                    if (!this.findLayerByTitle('Valassis PCR')) {
                        MapService.mapView.map.layers.add(MapService.PcrGroupLayer);
                    }
                    MapService.PcrGroupLayer.visible = true;  

                } else
                    if (analysisLevel === 'HH') {
                        // Add HH layer IDs 
                        const layers = hh_layerids.map(fromPortal);
  
                        // Add all HH Layers via Promise
                        all(layers)
                         .then(results => {
                         results.forEach(x => {
                           if (x.type === "feature") {
                               x.minScale = 2300000;
                               x.mode = FeatureLayer.MODE_AUTO;
                           }
                           else {
                             x.maxScale = 2300000;
                           }
                           // Add Layer to Group Layer if it does not already exist
                           if (!this.findSubLayerByTitle(MapService.HHGroupLayer, x.portalItem.title)) {
                               console.log ('adding subLayer: ' + x.portalItem.title)
                               MapService.HHGroupLayer.add(x);
                           }
                           });
                        })
                        .catch(error => console.warn(error.message));

                        // Add HH Group Layer if it does not already exist
                        if (!this.findLayerByTitle('Valassis Households')) {
                            MapService.mapView.map.layers.add(MapService.HHGroupLayer);
                        }
                        MapService.HHGroupLayer.visible = true;  
                } 
        }); // End forEach analysisLevels   
    }
        // -------------------------------------------------------------------------------
        // Add Census Layer if it does not exist
        if (!this.findSubLayerByTitle(MapService.EsriGroupLayer,'Census')) {
            MapService.EsriGroupLayer.add(new MapLayer({ url: Census, opacity: 1 }));
        }    
        if (!this.findLayerByTitle('ESRI')) {
            MapService.mapView.map.layers.add(MapService.EsriGroupLayer);
        }    
        MapService.EsriGroupLayer.visible = true;  
        // -------------------------------------------------------------------------------
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
            //await this.zoomOnMap(graphicList);
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
        
        // TODO: Add Content to SitesGroupLayer
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
        //MapService.mapView.map.allLayers
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
        

        //var graphic = graphicList[0];
        var fSet : __esri.FeatureSet;
        var fLyrList : __esri.FeatureLayer[] = [];
        await this.getAllFeatureLayers().then(list =>{
            fLyrList = list;
        });
       /* await MapService.layers.forEach(function(lyr:__esri.FeatureLayer){
            fLyrList.push(lyr); 
            
        });

        MapService.ZipGroupLayer.layers.forEach(function(zipLyr:__esri.FeatureLayer){
            fLyrList.push(zipLyr); 
        }); */

        for(let lyr of fLyrList){
            if(lyr.title === 'ZIP_centroids'){
                for(let graphic of graphicList){
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
    }

    public async selectPoly(centroidGraphics : __esri.Graphic[]){
        console.log('fired selectPoly');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [Query,GroupLayer,FeatureLayer,Graphic,SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,Color]
         = await loader.loadModules([
            'esri/tasks/support/Query',
            'esri/layers/GroupLayer',
            'esri/layers/FeatureLayer',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color','dojo/domReady!'  
        ]);
        console.log('centroidGraphics length:::'+centroidGraphics.length);
        var symbol123 = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0,255,0,0.65]), 2
            ),
            new Color([0,255,0,0.35])
        );
        var fLyrList : __esri.FeatureLayer[] = [];
         await this.getAllFeatureLayers().then(list =>{
            fLyrList = list;
        });

        for(let lyr of fLyrList){
            if(lyr.title === 'ZIP_Top_Vars'){
                var polyGraphics : __esri.Graphic[] = [];
                for(let centroidGraphic of centroidGraphics){
                    var qry1 = lyr.createQuery();
                    qry1.geometry = centroidGraphic.geometry;
                    qry1.outSpatialReference = MapService.mapView.spatialReference;
                    var edits;
                    //edits.
                    await lyr.queryFeatures(qry1).then(function(polyFeatureSet){
                        for(var i =0 ; i<polyFeatureSet.features.length ; i++){
                            polyFeatureSet.features[i].symbol = symbol123;
                            polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry,symbol123));
                            MapService.mapView.graphics.add(new Graphic(polyFeatureSet.features[i].geometry,symbol123)); 
                          //  lyr.applyEdits(Graphic(polyFeatureSet.features[i].geometry,symbol123));
                        }
                       /* for(const polyGraphic of polyGraphics){
                            MapService.mapView.graphics.add(polyGraphic); 
                        }*/
                    });
                 }

               /* await this.getAllFeatureLayers().then(list =>{
                     for(let polyLayer of list){
                        if (polyLayer.title ==='ZIP_Top_Vars') {
                            this.updateFeatureLayer(polyGraphics,polyLayer.title);
                        }
                     }
                });*/
               /* await this.getAllFeatureLayers().then(list =>{
                    for(const polyLayer of list){
                         if (polyLayer.title ==='ZIP_Top_Vars') {
                            for(const polyGraphic of polyGraphics){
                                MapService.mapView.graphics.add(polyGraphic); 
                            }
                        }
                    }
                 });*/
                // MapService.selectedGraphics = centroidGraphics;
            }
        }
    }

    public async selectSinglePolygon(evt :__esri.MapViewClickEvent){
        console.log('fired selectSinglePolygon');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [Query,GroupLayer,FeatureLayer,Graphic,SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,Color]
         = await loader.loadModules([
            'esri/tasks/support/Query',
            'esri/layers/GroupLayer',
            'esri/layers/FeatureLayer',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color','dojo/domReady!'  
        ]);
        var polyGraphics : __esri.Graphic[] = [];

        var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0,255,0,0.65]), 2
            ),
            new Color([0,255,0,0.35])
          );
       
        var fLyrList : __esri.FeatureLayer[] = [];

        await this.getAllFeatureLayers().then(list =>{
            fLyrList = list;
        });

        console.log('fLyrList size --->'+fLyrList.length);

        /*await MapService.layers.forEach(function(lyr:__esri.FeatureLayer){
            fLyrList.push(lyr);
        });

        MapService.ZipGroupLayer.layers.forEach(function(zipLyr:__esri.FeatureLayer){
            fLyrList.push(zipLyr); 
        });*/

        for(let lyr of fLyrList){
            if(lyr.title ==='ZIP_Top_Vars'){
                var query = lyr.createQuery();
                var currentClick = query.geometry = evt.mapPoint;
                query.outSpatialReference = Query.SPATIAL_REL_INTERSECTS;
                await lyr.queryFeatures(query).then(function(polyFeatureSet){
                    for(var i =0 ; i<polyFeatureSet.features.length ; i++){
                        polyFeatureSet.features[i].symbol = symbol;
                       // polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry,symbol));
                       MapService.mapView.graphics.add(new Graphic(polyFeatureSet.features[i].geometry,symbol)); 
                    }
                });
            }
        }
        /*await MapService.ZipGroupLayer.layers.forEach(function (polyLayer : __esri.FeatureLayer){
            if (polyLayer.title ==='ZIP_Top_Vars') {
                for(const polyGraphic of polyGraphics){
                    MapService.mapView.graphics.add(polyGraphic); 
                }
            }
         });*/
        /* await this.getAllFeatureLayers().then(list =>{
            for(let polyLayer of list){
               if (polyLayer.title ==='ZIP_Top_Vars') {
                   this.updateFeatureLayer(polyGraphics,polyLayer.title);
               }
            }
         }); */

        /* await this.getAllFeatureLayers().then(list =>{
            for(const polyLayer of list){
                 if (polyLayer.title ==='ZIP_Top_Vars') {
                    for(const polyGraphic of polyGraphics){
                        MapService.mapView.graphics.add(polyGraphic); 
                    }
                }
            }
         });*/
         await MapService.mapView.map.layers.forEach( (lyr) =>{
            if(lyr instanceof GroupLayer){
                var gpLyr : __esri.GroupLayer = <__esri.GroupLayer>lyr;
                gpLyr.layers.forEach((subLyr) =>{
                    if(subLyr instanceof FeatureLayer){
                        console.log('test data')
                    }
                    if(subLyr.title ==='ZIP_Top_Vars'){
                        this.updateFeatureLayer(polyGraphics,subLyr.title);
                    }
                });
            }
        });
    }

    public async getAllFeatureLayers() : Promise<__esri.FeatureLayer[]>{
        console.log('fired getAllFeatureLayers');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [GroupLayer,FeatureLayer] = await loader.loadModules([
            'esri/layers/GroupLayer',
            'esri/layers/FeatureLayer'
        ]);
        //MapService.mapView.map.allLayers.length;
        var fLyrList : __esri.FeatureLayer[] = [];
        MapService.mapView.map.allLayers.forEach(function(lyr : __esri.FeatureLayer){
          //  console.log('lyrs names before adding::'+lyr.title);
            if( lyr instanceof FeatureLayer){
              //  console.log('lyrs names After adding::'+lyr.title);
                fLyrList.push(lyr);
            }
        });
        return fLyrList;
    }
}

export interface EsriWrapper<T> {

    val: T;

}
