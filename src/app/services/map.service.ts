import { map } from 'rxjs/operators';
import { SelectButtonModule } from 'primeng/primeng';
import { element } from 'protractor';
import { Injectable, OnInit } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { forEach } from '@angular/router/src/utils/collection';
import { Points } from '../Models/Points';
import { Query } from '@angular/core/src/metadata/di';

// import primeng
import { SelectItem } from 'primeng/primeng';
import { MetricService } from '../val-modules/common/services/metric.service';
import {EsriLayerService} from './esri-layer.service';

@Injectable()
export class MapService {

    // Group Layers
    private static EsriGroupLayer: __esri.GroupLayer;
    private static ZipGroupLayer: __esri.GroupLayer;
    private static AtzGroupLayer: __esri.GroupLayer;
    private static PcrGroupLayer: __esri.GroupLayer;
    private static HHGroupLayer: __esri.GroupLayer;
    private static WrapGroupLayer: __esri.GroupLayer;
    private static SitesGroupLayer: __esri.GroupLayer;
    private static CompetitorsGroupLayer: __esri.GroupLayer;

    private static mapView: __esri.MapView;
    public static layerNames: Set<string> = new Set<string>();
    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();
    public static featureLayerView: __esri.FeatureLayerView;

    public static selectedCentroidObjectIds: number[] = [];
    public static hhDetails: number = 0;
    public static hhIpAddress: number = 0;

    public static sketchViewModel: __esri.SketchViewModel;
    public sideBarToggle: boolean = false;
    private mapInstance: __esri.Map;

    constructor(private metricService: MetricService, private layerService: EsriLayerService) {
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

        MapService.WrapGroupLayer = new GroupLayer({
            title: 'Valassis WRAP',
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


    public async getMap() : Promise<__esri.Map> {
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

    public async createMapView(element: HTMLDivElement) : Promise<EsriWrapper<__esri.MapView>> {
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
            Print,
            SketchViewModel,
            Graphic
        ] = await loader.loadModules([
            'esri/views/MapView',
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
            'esri/widgets/Print',
            'esri/widgets/Sketch/SketchViewModel',
            'esri/Graphic'
        ]);
        const opts: __esri.MapViewProperties = {
            container: element,
            map: theMap,
            center: { longitude: -98.5795, latitude: 39.8282 },
            zoom: 4
        };
        const mapView: __esri.MapView = new MapView(opts);
        this.layerService.initLayerList(mapView);

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
        mapView.ui.add(legendExpand, 'top-left');
        mapView.ui.add(home, 'top-left');
        mapView.ui.add(locate, 'top-left');
        mapView.ui.add(scaleBar, 'bottom-left');
        mapView.ui.add(printExpand, 'top-right');

        // Setup Default Group Layers
        this.initGroupLayers();

        // -----------------------------------------------------------------------------------
        // SketchViewModel
        // -----------------------------------------------------------------------------------
        mapView.then(function(evt) {
        // create a new sketch view model
        MapService.sketchViewModel = new SketchViewModel({
              view: mapView,
              pointSymbol: { // symbol used for points
                type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
                style: 'square',
                color: '#8A2BE2',
                size: '16px',
                outline: { // autocasts as new SimpleLineSymbol()
                  color: [255, 255, 255],
                  width: 3 // points
                }
              },
              polylineSymbol: { // symbol used for polylines
                type: 'simple-line', // autocasts as new SimpleMarkerSymbol()
                color: '#8A2BE2',
                width: '4',
                style: 'dash'
              },
              polygonSymbol: { // symbol used for polygons
                type: 'simple-fill', // autocasts as new SimpleMarkerSymbol()
                color: 'rgba(138,43,226, 0.8)',
                style: 'solid',
                outline: {
                  color: 'white',
                  width: 1
                }
              }
        });
        console.log('this.sketchViewModel = ' + this.sketchViewModel)
        console.log('MapService.sketchViewModel = ' + MapService.sketchViewModel)
        // ************************************************************
        // Get the completed graphic from the event and add it to view.
        // This event fires when user presses
        //  * "C" key to finish sketching point, polygon or polyline.
        //  * Double-clicks to finish sketching polyline or polygon.
        //  * Clicks to finish sketching a point geometry.
        // ***********************************************************
        MapService.sketchViewModel.on('draw-complete', function(evt: any) {
            mapView.graphics.add(evt.graphic);
            this.setActiveButton();
          });

        });
        // -----------------------------------------------------------------------------------
        console.log('sketchViewModel = ' + MapService.sketchViewModel);
        MapService.mapView = mapView;
        return { val: mapView };
    }

    setActiveButton(selectedButton: any) {
        // focus the view to activate keyboard shortcuts for sketching
        MapService.mapView.focus();
        const elements: any = document.getElementsByClassName('active');
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.remove('active');
        }
        if (selectedButton) {
          selectedButton.classList.add('active');
        }
      }

    // activate the sketch to create a point
    drawPointButton() {
        // set the sketch to create a point geometry
        MapService.sketchViewModel.create('point');
        this.setActiveButton(this);
      }

     // activate the sketch to create a polyline
     drawLineButton() {
        // set the sketch to create a polyline geometry
        MapService.sketchViewModel.create('polyline');
        this.setActiveButton(this);
      }

     // activate the sketch to create a polygon
    drawPolygonButton() {
        // set the sketch to create a polygon geometry
        MapService.sketchViewModel.create('polygon');
        this.setActiveButton(this);
      }

     resetBtn() {
        MapService.mapView.graphics.removeAll();
        MapService.sketchViewModel.reset();
        this.setActiveButton(this);
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

    public async plotMarker(lat: number, lon: number, pointColor, popupTemplate?: __esri.PopupTemplate, parentId?: number) : Promise<EsriWrapper<__esri.MapView>> {

        console.log('fired plotMarker() in MapService');
        this.createGraphic(lat, lon, pointColor, popupTemplate, parentId).then(graphic => {
            if (parentId != null)
               graphic.setAttribute('parentId', parentId);
            MapService.mapView.graphics.add(graphic);
        });

        return { val: MapService.mapView };
    }

    public getMapView() : __esri.MapView {
        // to return Mapview
        return MapService.mapView;
    }

    public getFeaturLayer() : __esri.FeatureLayer{

        var featurelyr: __esri.FeatureLayer[] = [];
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

         const dma_layerids = ['9205b77cd8c74773aefad268b6705543']; // DMA_Boundaries

         const zip_layerids = [
           '5742f3faba51493ab29f9e78bc5598d4', // ZIP Top Vars
           '0c6aaec5babb4900ba6cdc5253d64293'  // ZIP_Centroids_FL
         ];
         const atz_layerids = [
           '14821e583a5f4ff5b75304c16081b25a', // ATZ_Top_Vars
           '3febf907f1a5441f898a475546a8b1e2', // ATZ_Centroids 
           '2393d7bb2ac547c4a6bfa3d16f8febaa', // DIG_ATZ_Top_Vars 
           'c4dd486769284105bbd1c1c6a0c0cb07'  // DIG_ATZ_Centroids
        ];
        const pcr_layerids = [];
        const wrap_layerids = [
           'c686977dac124e53a3438189e87aa90f'  // WRAP_Top_Vars
          ];
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
        MapService.WrapGroupLayer.visible = false;

    // Esri Layers
    if (selectedLayers.length !== 0) {
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
                    MapService.EsriGroupLayer.add(new MapLayer({ url: element.url, outfields: ['*'], popupTemplate: { title: popupTitle, content: '{*}' }, opacity: 0.65 }));
                    console.log('added MapLayer:' + element.name);
                }
            } else
                if (element.url.indexOf('FeatureServer') !== -1) {
                    if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, element.name)) {
                        MapService.EsriGroupLayer.add(new FeatureLayer({ url: element.url, outfields: ['*'], popupTemplate: { title: popupTitle, content: '{*}' }, opacity: 0.65 }));
                        console.log('added FeatureLayer:' + element.name);
                    }
                }
            // Add ZIP Group Layer if it does not already exist
            if (!this.findLayerByTitle('ESRI')) {
                MapService.mapView.map.layers.add(MapService.EsriGroupLayer);
            }
            MapService.EsriGroupLayer.visible = true;
        });
    }

    // Analysis Levels
    if (analysisLevels.length !== 0) {
        // Loop through each of the selected analysisLevels
        analysisLevels.forEach((analysisLevel, index) => {

        if (analysisLevel === 'ZIP') {
             // Add ZIP layer IDs
             const layers = zip_layerids.map(fromPortal);

             // Add all ZIP Layers via Promise
             all(layers)
                 .then(results => {
                 results.forEach(x => {
                   if (x.type === 'feature') {
                     x.minScale = 5000000;
                     x.mode = FeatureLayer.MODE_AUTO;
                   }else {
                    x.maxScale = 5000000;
                   }
                   // Add Layer to Group Layer if it does not already exist
                   if (!this.findSubLayerByTitle(MapService.ZipGroupLayer, x.portalItem.title)) {
                       console.log ('adding subLayer: ' + x.portalItem.title);
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
                   if (x.type === 'feature') {
                     x.minScale = 5000000;
                     x.mode = FeatureLayer.MODE_AUTO;
                   } else {
                     x.maxScale = 5000000;
                   }
                   // Add Layer to Group Layer if it does not already exist
                   if (!this.findSubLayerByTitle(MapService.AtzGroupLayer, x.portalItem.title)) {
                       console.log ('adding subLayer: ' + x.portalItem.title);
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
                       if (x.type === 'feature') {
                         x.minScale = 5000000;
                         x.mode = FeatureLayer.MODE_AUTO;
                       } else {
                         x.maxScale = 5000000;
                       }
                       // Add Layer to Group Layer if it does not already exist
                       if (!this.findSubLayerByTitle(MapService.PcrGroupLayer, x.portalItem.title)) {
                           console.log ('adding subLayer: ' + x.portalItem.title);
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
                if (analysisLevel === 'WRAP') {
                    // Add WRAP layer IDs
                    const layers = wrap_layerids.map(fromPortal);

                    // Add all WRAP Layers via Promise
                    all(layers)
                     .then(results => {
                     results.forEach(x => {
                       if (x.type === 'feature') {
                         // x.minScale = 5000000;
                         x.mode = FeatureLayer.MODE_AUTO;
                       } else {
                         x.maxScale = 5000000;
                       }
                       // Add Layer to Group Layer if it does not already exist
                       if (!this.findSubLayerByTitle(MapService.WrapGroupLayer, x.portalItem.title)) {
                           console.log ('adding subLayer: ' + x.portalItem.title);
                           MapService.WrapGroupLayer.add(x);
                       }
                       });
                    })
                    .catch(error => console.warn(error.message));

                    // Add WRAP Group Layer if it does not already exist
                    if (!this.findLayerByTitle('Valassis WRAP')) {
                        MapService.mapView.map.layers.add(MapService.WrapGroupLayer);
                    }
                    MapService.WrapGroupLayer.visible = true;

                } else
                    if (analysisLevel === 'HH') {
                        // Add HH layer IDs
                        const layers = hh_layerids.map(fromPortal);

                        // Add all HH Layers via Promise
                        all(layers)
                         .then(results => {
                         results.forEach(x => {
                           if (x.type === 'feature') {
                               x.minScale = 2300000;
                               x.mode = FeatureLayer.MODE_AUTO;
                           } else {
                             x.maxScale = 2300000;
                           }
                           // Add Layer to Group Layer if it does not already exist
                           if (!this.findSubLayerByTitle(MapService.HHGroupLayer, x.portalItem.title)) {
                               console.log ('adding subLayer: ' + x.portalItem.title);
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
        // Add DMA Layer if it does not exist
        // Add all DMA Layers via Promise
        const layers = dma_layerids.map(fromPortal);

        all(layers)
            .then(results => {
            results.forEach(x => {
            if (x.type === 'feature') {
                //x.minScale = 2300000;
                x.mode = FeatureLayer.MODE_AUTO;
                x.visible = false;
             } else {
                x.maxScale = 2300000;
            }

            // Add Layer to Group Layer if it does not already exist
            if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, x.portalItem.title)) {
                console.log ('adding subLayer: ' + x.portalItem.title);
                MapService.EsriGroupLayer.add(x);
            }
            });
        })
        .catch(error => console.warn(error.message));

        // -------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------
        // Add Census Layer if it does not exist
        if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, 'Census')) {
            MapService.EsriGroupLayer.add(new MapLayer({ url: Census, opacity: 1, visible: false }));
        }
        if (!this.findLayerByTitle('ESRI')) {
            MapService.mapView.map.layers.add(MapService.EsriGroupLayer);
        }
        MapService.EsriGroupLayer.visible = true;
        // -------------------------------------------------------------------------------
        return { val: MapService.mapView };
    }

    public async drawCircle(lat: number, lon: number, pointColor, miles: number, title: string, outlneColor, parentId?: number) : Promise<EsriWrapper<__esri.MapView>> {
        console.log('inside drawCircle' + lat + 'long::' + lon + 'color::' + pointColor + 'miles::' + miles + 'title::' + title);
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
        const pointLongitude = lon;
        const pointLatitude = lat;

        const defaultSymbol: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol({
            style: 'circle',
            size: 12,
            color: pointColor
        });

        const sym: __esri.SimpleFillSymbol =
            new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID
                , new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, pointColor, 2)
                , pointColor
            );

        sym.outline.color = outlneColor;

      //  let gl: __esri.GraphicsLayer = new GraphicsLayer({ id: 'circles' });

      //  MapService.mapView.map.add(gl);

        console.log('miles radius' + miles);

        pointIndex++;
        // pointLatitude+=0.001;
        // pointLatitude+=0.001;

        const p = new Point({
            x: pointLongitude,
            y: pointLatitude,
            spatialReference: 4326
        });

        const circle = new Circle({
            radius: miles,
            center: p,
            geodesic: true,
            radiusUnit: 'kilometers'
        });

        const g = new Graphic({
            geometry: circle,
            symbol: sym
        });

        // If a parentId was provided, set it as an attribute
        if (parentId != null)
          g.setAttribute('parentId', parentId);

        const graphicList: __esri.Graphic [] = [];
        graphicList.push(g);
        await this.updateFeatureLayer(graphicList , title);
        await this.selectCentroid(graphicList);
        //await this.zoomOnMap(graphicList);
        return { val: MapService.mapView };
    }

    public async bufferMergeEach(pointsArray: Points[], pointColor, kms: number, title: string, outlneColor, parentId?: number) { /*: Promise<EsriWrapper<__esri.MapView>>*/
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

            const sym: __esri.SimpleFillSymbol =
            new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID
                , new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, pointColor, 2)
                , pointColor
            );
            sym.outline.color  = outlneColor;

            const pointList: __esri.Point[] = [];

            for (const point of pointsArray){
                const p = new Point({
                    x: point.longitude,
                    y: point.latitude,
                    spatialReference: 4326
                  });
                  pointList.push(p);
            }
           // MapService.mapView.graphics.removeAll();
            const graphicList: __esri.Graphic [] = [];
            const bufferedGeometries = geometryEngine.geodesicBuffer(pointList, kms, 'kilometers', true);
           array.forEach(bufferedGeometries, function(geometry){
                //MapService.mapView.graphics.add(new Graphic(geometry,sym));

               // Construct a new graphic and assign the parent
               let g: __esri.Graphic = new Graphic();
               g.geometry = geometry;
               g.symbol =  sym;
               if (parentId != null)
                  g.setAttribute('parentId', parentId);
               graphicList.push(g);
               console.log('Pushed parentId: ', parentId);
//             graphicList.push(new Graphic(geometry, sym));
            });
            //await this.createFeatureLayer(graphicList , "testGraphicMerge");
            console.log('Updating feature layer: ' + title);
            await this.updateFeatureLayer(graphicList , title);
            console.log('draw buffer--------->' + graphicList.length);
            //await this.zoomOnMap(graphicList);
            const t0 = performance.now();
            await this.selectCentroid(graphicList);
            const t1 = performance.now();
            console.log('Call to select polygon took: ' + (t1 - t0) + ' :milliseconds.');
            console.log('completed select buffer::');

       // return { val: MapService.mapView };
    }

    public async createFeatureLayer(graphics: __esri.Graphic[], layerName: string) {
        console.log('fired createFeautreLayer() in MapService');
        if (MapService.layerNames.has(layerName)) {
            console.log('layer name already exists');
            throw new Error('Layer name already exists, please use a different name');
        }
        MapService.layerNames.add(layerName);
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, Renderer, Polygon] = await loader.loadModules(['esri/layers/FeatureLayer',
        'esri/renderers/Renderer', 'esri/geometry/Polygon']);
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

   public clearFeatureLayer(layerTitle: string)
   {
      // If there are no layers, there is nothing to do
      if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
         console.log('fired clearFeatureLayer() in MapService, but there were no feature layers to clear');
         return;
      }
      else
         console.log('fired clearFeatureLayer() in MapService');

      let layerCleared: boolean = false;

      // loop through the existing layers to see if we can find one to clear
      MapService.layers.forEach(currentLayer => {
         if (layerTitle === currentLayer.title)
         {
            console.log('Clearing layer: '  + layerTitle);
            (<__esri.FeatureLayer>currentLayer).source.removeAll();
            layerCleared = true;
         }
      });

      if (!layerCleared)
         console.log('Did not find layer: ' + layerTitle + ' to clear');
   }

   public clearFeatureLayerAt(layerTitle: string, lat: number, lon: number)
   {
      // If there are no layers, there is nothing to do
      if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
         console.log('fired clearFeatureLayerAt() in MapService, but there were no feature layers to clear');
         return;
      }
      else
         console.log('fired clearFeatureLayerAt() in MapService');

      let layerCleared: boolean = false;

      // loop through the existing layers to see if we can find one to clear
      MapService.layers.forEach(currentLayer => {
         console.log('Skipping layer: ' + currentLayer.title);
         if (layerTitle === currentLayer.title)
         {
            console.log('Clearing layer: '  + layerTitle);
            const currLayer: __esri.FeatureLayer = (<__esri.FeatureLayer>currentLayer);
            const src: __esri.Collection<__esri.Graphic> = currLayer.source;

            for (let i: number = 0; i < src.length; i++ )
            {
               console.log('Clearing graphic ' + i + ' / ' + src.length);
               const graphic: __esri.Graphic = src.getItemAt(i);
               const point: __esri.Point = (<__esri.Point> graphic.geometry);
               console.log('long: ' + point.longitude + ', lat: ' + point.latitude + ' vs ' + lon + ', ' + lat);
               if (point.latitude === lat && point.longitude === lon)
               {
                  console.log ('found graphic at lat: ' + lat + ', lon: ' + lon);
                  src.remove(graphic);
                  layerCleared = true;
                  break;
               }
            }
         }
      });

      if (!layerCleared)
         console.log('Did not find layer: ' + layerTitle + ' to clear');
   }

   public clearAllFeatureLayersAt(lat: number, lon: number)
   {
      // If there are no layers, there is nothing to do
      if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
         console.log('fired clearAllFeatureLayersAt() in MapService, but there were no feature layers to clear');
         return;
      }
      else
         console.log('fired clearAllFeatureLayersAt() in MapService');

      // loop through the existing layers to see if we can find one to clear
      MapService.layers.forEach(currentLayer => {
         console.log('Clearing layer: ' + currentLayer.title);
         this.clearFeatureLayerAt(currentLayer.title, lat, lon);
      });
   }

   public aproximatelyEqual(valueA: number, valueB: number, epsilon: number)
   {
      if (epsilon == null) {
        epsilon = 0.001;
      }
      return Math.abs(valueA - valueB) < epsilon;
    }

   /* Technically this worked as transpiled javascript, but typescript threw errors
      error TS2339: Property 'centroid' does not exist on type 'Geometry'.
      Wanted to save a version of this work just in case.

   public clearGraphicsAt(lat: number, lon: number)
   {
      // If there are no layers, there is nothing to do
      if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
         console.log('fired clearGraphicsAt() in MapService, but there were no feature layers to clear');
         return;
      }
      else
         console.log('fired clearGraphicsAt() in MapService');

      let layerCleared: boolean = false;

      // loop through the existing layers to see if we can find one to clear
      MapService.layers.forEach(currentLayer => {
         console.log('Clearing layer: '  + currentLayer.title);
         const currLayer: __esri.FeatureLayer = (<__esri.FeatureLayer>currentLayer);
         const src: __esri.Collection<__esri.Graphic> = currLayer.source;

         if (src != null)
         {
            for (let i: number = 0; i < src.length; i++ )
            {
               console.log('Clearing graphic ' + i + ' / ' + src.length);
               const graphic: __esri.Graphic = src.getItemAt(i);
               console.log ('graphic: ' + graphic.toJSON());
               const point: __esri.Point = (<__esri.Point> graphic.geometry);
               console.log('long: ' + point.longitude + ', lat: ' + point.latitude + ' vs ' + lon + ', ' + lat);
               if (point.latitude == lat && point.longitude == lon)
               {
                  console.log ('Clearing graphic at lat: ' + lat + ', lon: ' + lon);
                  src.remove(graphic);
                  layerCleared = true;
                  break;
               }
               else
               {
                  console.log ('NOT clearing graphic at lat: ' + point.latitude + ', lon: ' + point.longitude);
                  const centroid = graphic.geometry.spatialReference;
                  console.log('centroid.lat: ' + graphic.geometry.centroid.latitude);
                  console.log('compare lat:  ' + lat);
//                  if (Number((graphic.geometry.centroid.latitude).toFixed(6)) == lat && Number((graphic.geometry.centroid.longitude).toFixed(6)) == lon)
                  if (this.aproximatelyEqual(graphic.geometry.centroid.latitude, lat, 0.001) &&
                      this.aproximatelyEqual(graphic.geometry.centroid.longitude, lon, 0.001))
                  {
                     console.log('Found centroid at lat: ' + graphic.geometry.centroid.latitude + ', lon: ' + graphic.geometry.centroid.longitude);
                     src.remove(graphic);
                  }
                  else
                     console.log('Did NOT find centroid at lat: ' + graphic.geometry.centroid.latitude + ', lon: ' + graphic.geometry.centroid.longitude);

                  if (graphic.attributes != null)
                  {
                     console.log('graphic.attributes: ' + graphic.attributes);
                     for (const key of graphic.attributes)
                     {
                        console.log('key: ' + key + ', value: ' + graphic.attributes[key]);
                     }
                  }
                  else
                  {
                     console.log('Graphic attributes was null');
                     console.log('... setting a test attribute');
                     this.setGraphicAttribute(graphic, 'Test', 'Duffman!');
                     console.log('attribute - test = ' + graphic.getAttribute('Test'));
                  }
               }
            }
         }
         else
            console.log('Layer ' + currLayer.title + ' has no source graphics');
      });
   }*/

   public clearGraphicsForParent(parentId: number)
   {
      // this.setGraphicAttribute (graphic, 'parentId', parentId);
      // If there are no layers, there is nothing to do
      if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
         console.log('fired clearGraphicsForParent() in MapService, but there were no feature layers to clear');
         return;
      }
      else
         if (parentId == null)
         {
            console.log('fired clearGraphicsForParent() in MapService, but no parentId was provided');
            return;
         }
         else
            console.log('fired clearGraphicsForParent() in MapService');

      // loop through the existing layers to see if we can find one to clear
      MapService.layers.forEach(currentLayer =>
      {
         console.log('Clearing layer: '  + currentLayer.title);
         const currLayer: __esri.FeatureLayer = (<__esri.FeatureLayer>currentLayer);
         const src: __esri.Collection<__esri.Graphic> = currLayer.source;

         if (src != null)
         {
            for (let i: number = 0; i < src.length; i++ )
            {
               console.log('Looking at graphic ' + (i + 1) + ' / ' + src.length);
               const graphic: __esri.Graphic = src.getItemAt(i);
               const currParentId: number = graphic.getAttribute('parentId');
               console.log ('parentId: ' + currParentId);

               // Determine if the current parent matches the search parent
               if (currParentId == parentId)
               {
                  console.log ('Clearing graphic with parentId: ' + parentId);
                  src.remove(graphic);
               }
               else
               {
                  console.log ('NOT clearing graphic with parent: ' + currParentId);
               }
            }
         }
         else
            console.log('Layer ' + currLayer.title + ' has no source graphics');
      });
   }

   public setGraphicAttribute (graphic: __esri.Graphic, name: string, value: any)
   {
      graphic.setAttribute(name, value);
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

    public async createGraphic(lat: number, lon: number, pointColor, popupTemplate?: __esri.PopupTemplate, parentId?: number) : Promise<__esri.Graphic> {
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

        console.log ('Graphic parentId: ' + parentId);
        if (parentId != null)
        {
           console.log ('Set parentId: ' + parentId);
       // this.setGraphicAttribute (graphic, 'parentId', parentId);
           graphic.setAttribute('parentId', parentId);
        }

        return graphic;
    }

    public async zoomOnMap(graphics: __esri.Graphic[]){
        const loader = EsriLoaderWrapperService.esriLoader;
        const [SimpleMarkerSymbol, Point, Graphic, Color, Extent] = await loader.loadModules([
            'esri/symbols/SimpleMarkerSymbol',
            'esri/geometry/Point',
            'esri/Graphic',
            'esri/Color',
            'esri/geometry/Extent'
        ]);
        let lyr: __esri.FeatureLayer;
        MapService.layers.forEach(layer => {
            lyr = <__esri.FeatureLayer>layer;
        });


        const p: __esri.Point = new Point();
        const pList: __esri.Point[] = [];
        const latList: number[] = [];
        const lonList: number[] = [];
        const graphicList1: __esri.Graphic[] = [];

      await  graphics.forEach(function(current: any){
            //console.log('test inside current obj::'+current.geometry.latitude)
            p.latitude  = current.geometry.latitude;
            p.longitude = current.geometry.longitude;
            pList.push(p);
            lonList.push(p.longitude);   /// this is X
            latList.push(p.latitude) ;   /// this is y
            graphicList1.push(current);
        });
        console.log('number of points on the map' + pList.length);
        const minX = Math.min(...lonList);
        const minY = Math.min(...latList);
        const maxX = Math.max(...lonList);
        const maxY = Math.max(...latList);

        console.log('minX::' + minX + '::minY::' + minY + '::maxX::' + maxX + '::maxY::' + maxY);
        let extent: __esri.Extent; // = new Extent();

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

       // if we are zooming to a single site we want to increase the zoom level
       if (graphics.length === 1) {
        MapService.mapView.zoom = 12;
       }
    }

    public async selectCentroid(graphicList: __esri.Graphic[]){
        console.log('selectCentroid fired::::');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, Graphic, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color]
         = await loader.loadModules([
            'esri/layers/FeatureLayer',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color', 'dojo/domReady!'
        ]);

        let fSet: __esri.FeatureSet;
        let fLyrList: __esri.FeatureLayer[] = [];
        await this.getAllFeatureLayers().then(list => {
            fLyrList = list;
        });


        for (const lyr of fLyrList){
            if (lyr.title === 'ZIP_Centroids_FL' || lyr.title === 'ATZ_Centroids'){
                let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();
                await lyr.load().then((f1: __esri.FeatureLayer)  => {
                    loadedFeatureLayer = f1;
                });
                for (const graphic of graphicList){
                    const qry = lyr.createQuery();
                    qry.geometry = graphic.geometry;
                    qry.outSpatialReference = MapService.mapView.spatialReference;
                    await lyr.queryFeatures(qry).then(featureSet => {
                        for (let i = 0 ; i < featureSet.features.length; i++){
                            fSet = featureSet;
                        }

                    });
                }
                await this.selectPoly(fSet.features);
            }
        }
    }

    public async selectPoly(centroidGraphics: __esri.Graphic[]){
        console.log('fired selectPoly');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, array, geometryEngine, Graphic, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color]
         = await loader.loadModules([
            'esri/layers/FeatureLayer',
            'dojo/_base/array',
            'esri/geometry/geometryEngine',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color', 'dojo/domReady!'
        ]);
        console.log('centroidGraphics length:::' + centroidGraphics.length);
        const symbol123 = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0, 255, 0, 0.65]), 2
            ),
            new Color([0, 255, 0, 0.10])
        );
        let fLyrList: __esri.FeatureLayer[] = [];
         await this.getAllFeatureLayers().then(list => {
            fLyrList = list;
        });
       MapService.selectedCentroidObjectIds = [];

        for (const lyr of fLyrList){
            if (lyr.title === 'ZIP_Top_Vars' || lyr.title === 'ATZ_Top_Vars'){
                const polyGraphics: __esri.Graphic[] = [];
                let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();

                await lyr.load().then((f1: __esri.FeatureLayer)  => {
                    loadedFeatureLayer = f1;
                   // loadedFeatureLayer.renderer = f1
                });

                MapService.mapView.graphics.removeAll();
                MapService.hhDetails = 0;
                MapService.hhIpAddress = 0;
                this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
                this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());

                await array.forEach(centroidGraphics, (centroidGraphic) => {
                    const qry1 = loadedFeatureLayer.createQuery();
                    qry1.geometry = centroidGraphic.geometry;
                    qry1.outSpatialReference = MapService.mapView.spatialReference;

                    loadedFeatureLayer.queryFeatures(qry1).then(polyFeatureSet => {
                        //const t0 = performance.now();

                        for (let i = 0 ; i < polyFeatureSet.features.length; i++){
                               if (MapService.selectedCentroidObjectIds.length < 0 || !MapService.selectedCentroidObjectIds.includes(polyFeatureSet.features[i].attributes.OBJECTID) ){
                                    MapService.hhDetails = MapService.hhDetails + polyFeatureSet.features[i].attributes.HHLD_W;
                                    MapService.hhIpAddress = MapService.hhIpAddress + polyFeatureSet.features[i].attributes.NUM_IP_ADDRS;
                                    polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry, symbol123, polyFeatureSet.features[i].attributes.OBJECTID));
                                    MapService.selectedCentroidObjectIds.push( polyFeatureSet.features[i].attributes.OBJECTID) ;
                               }
                              //lyr.applyEdits({updateFeatures : [new Graphic(polyFeatureSet.features[i].geometry,symbol123)]});
                        }
                        MapService.mapView.graphics.addMany(polyGraphics);
                        this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
                        this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());
                    });
                });
            }
        }
    }
     // to select based on featureLayerView
/*    public async selectPoly(centroidGraphics: __esri.Graphic[]){
        console.log('fired selectPoly');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [Query, geometryEngine, FeatureLayer, Point, Extent, Graphic, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color]
         = await loader.loadModules([
            'esri/tasks/support/Query',
            'esri/geometry/geometryEngine',
            'esri/layers/FeatureLayer',
            'esri/geometry/Point',
            'esri/geometry/Extent',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color', 'dojo/domReady!'
        ]);

        const geometries: __esri.Geometry[] = new Array<__esri.Geometry>();
        for (const centroid of centroidGraphics) {
            geometries.push(centroid.geometry);
        }

        console.log('centroidGraphics length:::' + centroidGraphics.length);
        const symbol123 = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0, 255, 0, 0.65]), 2
            ),
            new Color([0, 255, 0, 0.10])
        );
        let fLyrList: __esri.FeatureLayer[] = [];
         await this.getAllFeatureLayers().then(list => {
            fLyrList = list;
        });
       MapService.selectedCentroidObjectIds = [];

        for (const lyr of fLyrList){
            if (lyr.title === 'ZIP_Top_Vars' || lyr.title === 'ATZ_Top_Vars'){
                const polyGraphics: __esri.Graphic[] = [];
                //for (const centroidGraphic of centroidGraphics){
                    const qry1 = new Query();
                    const unionGeos = geometryEngine.union(geometries)
                    qry1.geometry = unionGeos.extent;
                    qry1.spatialRelationship = "intersects";
                    //qry1.geometry = centroidGraphic.geometry;
                    //qry1.outSpatialReference = MapService.mapView.spatialReference;
                    let featureLayerView = null;
                    await MapService.mapView.whenLayerView(lyr).then(view => {featureLayerView = view;})
                     .then(res => featureLayerView.queryFeatures(qry1).then(function(polyFeatureSet){
                        for (let i = 0 ; i < polyFeatureSet.length ; i++){

                               if (MapService.selectedCentroidObjectIds.length < 0 || !MapService.selectedCentroidObjectIds.includes(polyFeatureSet[i].attributes.OBJECTID) ){
                                    MapService.hhDetails = MapService.hhDetails + polyFeatureSet[i].attributes.HHLD_W;
                                    MapService.hhIpAddress = MapService.hhIpAddress + polyFeatureSet[i].attributes.NUM_IP_ADDRS;

                                    polyGraphics.push(new Graphic(polyFeatureSet[i].geometry, symbol123, polyFeatureSet[i].attributes.OBJECTID));
                                    MapService.selectedCentroidObjectIds.push( polyFeatureSet[i].attributes.OBJECTID) ;
                               }
                              //lyr.applyEdits({updateFeatures : [new Graphic(polyFeatureSet.features[i].geometry,symbol123)]});
                        }
                    }));
                //}
                 MapService.mapView.graphics.addMany(polyGraphics);
            }
        }
    } */

    public async selectSinglePolygon(evt:__esri.MapViewClickEvent){
        console.log('fired selectSinglePolygon');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [Query, GroupLayer, FeatureLayer, Graphic, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color]
         = await loader.loadModules([
            'esri/tasks/support/Query',
            'esri/layers/GroupLayer',
            'esri/layers/FeatureLayer',
            'esri/Graphic',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/Color', 'dojo/domReady!'
        ]);
        const polyGraphics: __esri.Graphic[] = [];

        const symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0, 255, 0, 0.65]), 2
            ),
            new Color([0, 255, 0, 0.10])
          );

        let fLyrList: __esri.FeatureLayer[] = [];

        await this.getAllFeatureLayers().then(list => {
            fLyrList = list;
        });

        for (const lyr of fLyrList){
            if (lyr.title === 'ZIP_Top_Vars' || lyr.title === 'ATZ_Top_Vars'){
                const query = lyr.createQuery();
                const currentClick = query.geometry = evt.mapPoint;
                query.outSpatialReference = Query.SPATIAL_REL_INTERSECTS;
                await lyr.queryFeatures(query).then(polyFeatureSet => {
                       if (MapService.selectedCentroidObjectIds.includes(polyFeatureSet.features[0].attributes.OBJECTID)){

                            const graphi: __esri.Graphic = polyFeatureSet.features[0];
                            MapService.mapView.graphics.forEach((graphic) => {
                                if (graphi.attributes.OBJECTID ===  graphic.attributes){
                                    console.log('deselect to mapview');
                                    MapService.mapView.graphics.remove(graphic);
                                    const index = MapService.selectedCentroidObjectIds.indexOf(graphi.attributes.OBJECTID);
                                    MapService.selectedCentroidObjectIds.splice(index, 1);
                                    MapService.hhDetails = MapService.hhDetails - polyFeatureSet.features[0].attributes.HHLD_W;
                                    MapService.hhIpAddress = MapService.hhIpAddress - polyFeatureSet.features[0].attributes.NUM_IP_ADDRS;
                                    this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
                                    this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());
                                }
                            });
                        }else{
                            console.log('select to mapview');
                            MapService.selectedCentroidObjectIds.push(polyFeatureSet.features[0].attributes.OBJECTID);
                            MapService.mapView.graphics.add(new Graphic(polyFeatureSet.features[0].geometry, symbol, polyFeatureSet.features[0].attributes.OBJECTID));
                            MapService.hhDetails = MapService.hhDetails + polyFeatureSet.features[0].attributes.HHLD_W;
                            MapService.hhIpAddress = MapService.hhIpAddress + polyFeatureSet.features[0].attributes.NUM_IP_ADDRS;
                            this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
                            this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());

                        }
                });
            }
        }

    }

    public async getAllFeatureLayers() : Promise<__esri.FeatureLayer[]>{
        console.log('fired getAllFeatureLayers');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [GroupLayer, FeatureLayer] = await loader.loadModules([
            'esri/layers/GroupLayer',
            'esri/layers/FeatureLayer'
        ]);
        //MapService.mapView.map.allLayers.length;
        const fLyrList: __esri.FeatureLayer[] = [];
        MapService.mapView.map.allLayers.forEach(function(lyr: __esri.FeatureLayer){
          //  console.log('lyrs names before adding::'+lyr.title);
            if ( lyr instanceof FeatureLayer){
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
