import { ImpGeofootprintGeoService } from './../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { GeocoderComponent } from './../components/geocoder/geocoder.component';
import { ImpGeofootprintGeo } from './../val-modules/targeting/models/ImpGeofootprintGeo';
import {ElementRef, Injectable} from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { Points } from '../models/Points';
import { MetricService } from '../val-modules/common/services/metric.service';
import { EsriLayerService } from './esri-layer.service';
import { mapFunctions } from '../app.component';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { AppConfig } from '../app.config';

@Injectable()
export class MapService {

    // Group Layers
    public static EsriGroupLayer: __esri.GroupLayer;
    public static ZipGroupLayer: __esri.GroupLayer;
    public static AtzGroupLayer: __esri.GroupLayer;
    public static PcrGroupLayer: __esri.GroupLayer;
    public static HHGroupLayer: __esri.GroupLayer;
    public static WrapGroupLayer: __esri.GroupLayer;
    public static DmaGroupLayer: __esri.GroupLayer;
    public static SitesGroupLayer: __esri.GroupLayer;
    public static CompetitorsGroupLayer: __esri.GroupLayer;

    public static layerNames: Set<string> = new Set<string>();
    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();

    public static selectedCentroidObjectIds: number[] = []; //  --> will keep track of selected centroids on the map
    public static hhDetails: number = 0;  // --> will keep track of houshold count
    public static hhIpAddress: number = 0; // --> will keep track of houshold ipaddress count
    public static medianHHIncome: String = '0';
    public static hhChildren: number = 0;
    public static tradeAreaInfoMap: Map<string, any> = new Map<string, any>(); // -> this will keep track of tradearea's on the map
    public static pointsArray: Points[] = []; // --> will keep track of all the poins on the map

    private map: __esri.Map;
    private mapView: __esri.MapView;

  // set a reference to global enum (defined in app.component)
    public mapFunction: mapFunctions = mapFunctions.Popups;
    public sketchViewModel: __esri.SketchViewModel;
    public sideBarToggle: boolean = false;
    public displayDBSpinner: boolean = false;

    constructor(private metricService: MetricService,
                private layerService: EsriLayerService,
                private esriMapService: EsriMapService,
                private impGeofootprintGeoService: ImpGeofootprintGeoService,
                private config: AppConfig) {
      this.esriMapService.onReady(() => {
        this.mapView = this.esriMapService.mapView;
        this.map = this.esriMapService.map;
      });
    }

    // Initialize Group Layers
    public initGroupLayers() : void {
        console.log('fired initGroupLayers()');

        MapService.EsriGroupLayer = new EsriModules.GroupLayer({
            title: 'ESRI',
            listMode: 'show-children',
            visible: true
        });

        MapService.ZipGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis ZIP',
            listMode: 'show-children',
            visible: true
        });

        MapService.DmaGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis DMA',
            listMode: 'show-children',
            visible: true
        });

        MapService.AtzGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis ATZ',
            listMode: 'show-children',
            visible: true
        });

        MapService.PcrGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis PCR',
            listMode: 'show-children',
            visible: true
        });

        MapService.WrapGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis WRAP',
            listMode: 'show-children',
            visible: true
        });

        MapService.HHGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis Households',
            listMode: 'show-children',
            visible: true
        });

        MapService.SitesGroupLayer = new EsriModules.GroupLayer({
            title: 'Sites',
            listMode: 'show-children',
            visible: true
        });

        MapService.CompetitorsGroupLayer = new EsriModules.GroupLayer({
            title: 'Competitors',
            listMode: 'show-children',
            visible: true
        });
    }

    // Execute each time the "Measure Length" action is clicked
    public measureThis() {
        const geom: __esri.Geometry = this.mapView.popup.selectedFeature.geometry;
        const distance: number = EsriModules.geometryEngine.geodesicLength(geom, 'miles');
        const area: number = EsriModules.geometryEngine.geodesicArea(<any>geom, 'square-miles');
        const distanceStr: string = String(parseFloat(Math.round((distance * 100) / 100).toFixed(2)));
        const areaStr: string = String(parseFloat(Math.round((area * 100) / 100).toFixed(2)));

        this.mapView.popup.content = //this.mapView.popup.selectedFeature.attributes.name +
        '<div style="background-color:DarkBlue;color:white"><b>' +
        'Length: ' + distanceStr + ' miles.<br>Area: ' + areaStr + ' square-miles.</b></div>';
    }

    // Execute each time the "Buffer" action is clicked
    public async bufferThis() {
        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        const [geometryEngine] = await loader.loadModules([
            'esri/geometry/geometryEngine'
        ]);

        const geom: __esri.Geometry = this.mapView.popup.selectedFeature.geometry;
    }

    // Select polygon using either a MapPoint (click) or passed Geometery (popup-action)
    public async selectPolyClick(evt:  __esri.MapViewClickEvent, geom?: __esri.Geometry, objectID?: number) {
        console.log('fired selectPolyClick');
        const color = {
                a: 1,
                r: 35,
                g: 93,
                b: 186
              };
        let layers: __esri.Layer[] = [];
        let i: number = 0;
        if (i === 0){
                i++;
                this.map.layers.forEach(function(layer: __esri.Layer) {
                  layers.push(layer);
                });
                let fLyrList: __esri.FeatureLayer[] = [];
                this.getAllFeatureLayers().then(list => {
                  fLyrList = list;
                });

                for (const lyr of layers){
                  if (lyr.title === 'Valassis ZIP' || lyr.title === 'Valassis ATZ'){
                    this.selectSinglePolygon(null, geom, objectID);
                    break;
                  }
                }
        }
        layers = [];
    }

    // Execute each time the "select-this" action is clicked
    public async selectThis() {
        console.log('fired popup action select-this()');
        const objectID: number = this.mapView.popup.selectedFeature.attributes.OBJECTID;
        const geom: __esri.Geometry = this.mapView.popup.selectedFeature.geometry;
        console.log ('-- objectID = ' + objectID);
        this.selectPolyClick(null, geom, objectID);
    }

    // create the MapView
    public createMapView() : void {
        // Create an instance of the Home widget
        const home = new EsriModules.widgets.Home({
            view: this.mapView
        });

        // Create an instace of the Compass widget
        const compass = new EsriModules.widgets.Compass({
            view: this.mapView
        });

        // Create an instace of the Locate widget
        const locate = new EsriModules.widgets.Locate({
            view: this.mapView
        });

        // Create an instance of the Search widget
        const search = new EsriModules.widgets.Search({
            view: this.mapView
        });

        // Create an instance of the Legend widget
        const legend = new EsriModules.widgets.Legend({
            view: this.mapView,
            container: document.createElement('div')
        });

        // Create an instance of the Scalebar widget
        const scaleBar = new EsriModules.widgets.ScaleBar({
            view: this.mapView,
            unit: 'dual' // The scale bar displays both metric and non-metric units.
        });

        // Create an instance of the BasemapGallery widget
        const basemapGallery = new EsriModules.widgets.BaseMapGallery({
            view: this.mapView,
            container: document.createElement('div')
        });

        // Create an instance of the BasemapGallery widget
        const print = new EsriModules.widgets.Print({
            view: this.mapView,
            printServiceUrl: 'https://valvcshad001vm.val.vlss.local/server/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
            container: document.createElement('div')
        });
        // Create an Expand instance and set the content
        // property to the DOM node of the basemap gallery widget
        // Use an Esri icon font to represent the content inside
        // of the Expand widget
        const bgExpand = new EsriModules.widgets.Expand({
            view: this.mapView,
            content: basemapGallery.container,
            expandIconClass: 'esri-icon-basemap',
            expandTooltip: 'Basemap Gallery',
        });
        const legendExpand = new EsriModules.widgets.Expand({
            view: this.mapView,
            content: legend.container,
            expandIconClass: 'esri-icon-documentation',
            expandTooltip: 'Expand Legend',
        });
        const printExpand = new EsriModules.widgets.Expand({
            view: this.mapView,
            content: print.container,
            expandIconClass: 'esri-icon-printer',
            expandTooltip: 'Print',
        });

        // Add widgets to the viewUI
        this.esriMapService.addWidget(search, 'top-right');
        // TODO: hard coded id is temporary
        this.layerService.initLayerList('colorSlider');
        this.esriMapService.addWidget(legend, 'top-left');
        this.esriMapService.addWidget(bgExpand, 'bottom-right');
        this.esriMapService.addWidget(legendExpand, 'top-left');
        this.esriMapService.addWidget(home, 'top-left');
        /*US6650: nallana
        --Removing the demo content
        --We need to keep this content for enhancements,
        --if we want to use the additional functionality
        */
        //this.esriMapService.addWidget(locate, 'top-left');
        //this.esriMapService.addWidget(printExpand, 'top-right');

        this.esriMapService.addWidget(scaleBar, 'bottom-left');
        // Setup Default Group Layers
        this.initGroupLayers();

        // GraphicsLayer to hold graphics created via sketch view model
        // const tempGraphicsLayer = new GraphicsLayer();
        // console.log('tempGraphicsLayer =' + tempGraphicsLayer);
        // create a new sketch view model
        this.sketchViewModel = new EsriModules.widgets.SketchViewModel(<any>{
            view: this.mapView,
            //layer: tempGraphicsLayer,
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

        // Event handler that fires each time a popup action is clicked.
        this.mapView.popup.on('trigger-action', (event) =>  {

            // Execute the measureThis() function if the measure-this action is clicked
            if (event.action.id === 'measure-this') {
                this.measureThis();
            }

            // Execute the selectThis() function if the select-this action is clicked
            if (event.action.id === 'select-this') {
                this.selectThis();
            }

            // Execute the measureThis() function if the measure-this action is clicked
            if (event.action.id === 'buffer-this') {
                this.bufferThis();
            }

        });

        // -----------------------------------------------------------------------------------
        // SketchViewModel
        // -----------------------------------------------------------------------------------
        // mapView.then(function(evt) {
        // ************************************************************
        // Get the completed graphic from the event and add it to view.
        // This event fires when user presses
        //  * "C" key to finish sketching point, polygon or polyline.
        //  * Double-clicks to finish sketching polyline or polygon.
        //  * Clicks to finish sketching a point geometry.
        // ***********************************************************
        this.sketchViewModel.on('draw-complete', function (evt: any) {

            // if multipoint geometry is created, then change the symbol
            // for the graphic
            if (evt.geometry.type === 'multipoint') {
                evt.graphic.symbol = {
                    type: 'simple-marker',
                    style: 'square',
                    color: 'green',
                    size: '16px',
                    outline: {
                        color: [255, 255, 255],
                        width: 3
                    }
                };
            }
            // add the graphic to the graphics layer
            // tempGraphicsLayer.add(evt.graphic);
            this.mapView.graphics.add(evt.graphic);
            //this.setActiveButton();
        });

        // });
        // -----------------------------------------------------------------------------------
    }

    // set active button
    public setActiveButton(selectedButton: any) {
        // focus the view to activate keyboard shortcuts for sketching
        //this.mapView.focus();
        const elements: any = document.getElementsByClassName('active');
        for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove('active');
        }
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    // Toggle Polygon Selection Mode
    public selectPolyButton() {
        this.mapFunction = mapFunctions.SelectPoly;
    }

    // Toggle Popups
    public popupsButton() {
        this.mapFunction = mapFunctions.Popups;
    }

    // Toggle Labels
    public labelsButton() {
        this.mapFunction = mapFunctions.Labels;
    }

    // activate the sketch to create a point
    public drawPointButton() {
        // set the sketch to create a point geometry
        this.mapFunction = mapFunctions.DrawPoint;
        this.sketchViewModel.create('point');
        //this.setActiveButton(this);
    }

    // activate the sketch to create a polyline
    public drawLineButton() {
        // set the sketch to create a polyline geometry
        this.mapFunction = mapFunctions.DrawLine;
        this.sketchViewModel.create('polyline');
        //this.setActiveButton(this);
    }

    // activate the sketch to create a polygon
    public drawPolygonButton() {
        // set the sketch to create a polygon geometry
        this.mapFunction = mapFunctions.DrawPoly;
        this.sketchViewModel.create('polygon');
        //this.setActiveButton(this);
    }

    // remove all graphics
    public removeGraphics() {
        this.mapFunction = mapFunctions.RemoveGraphics;
        this.mapView.graphics.removeAll();
        this.sketchViewModel.reset();
        //this.setActiveButton(this);
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

    // plotMarker
    public async plotMarker(lat: number, lon: number, pointColor, popupTemplate?: __esri.PopupTemplate, parentId?: number) : Promise<EsriWrapper<__esri.MapView>> {

        console.log('fired plotMarker() in MapService');
        this.createGraphic(lat, lon, pointColor, popupTemplate, parentId).then(graphic => {
            if (parentId != null)
                graphic.setAttribute('parentId', parentId);
            this.mapView.graphics.add(graphic);
        });

        return { val: this.mapView };
    }

    // Get MapView
    public getMapView() : __esri.MapView {
        // to return Mapview
        return this.mapView;
    }

    // Hide MapLayers
    public async hideMapLayers() : Promise<EsriWrapper<__esri.MapView>> {
        console.log('fired hideMapLayers() in MapService');
        // load required modules for this method
        const loader = EsriLoaderWrapperService.esriLoader;
        // Toggle all layers
        this.mapView.map.layers.forEach(function (layer, i) {
            if (layer.visible === true) {
                //console.log (i + '. layer visible: ' + this.mapView.map.layers.getItemAt(i).visible);
                this.mapView.map.layers.getItemAt(i).visible = false;
            }
        });
        return { val: this.mapView };
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
        this.mapView.map.layers.removeAll();
        return { val: this.mapView };
    }

    // Physically Remove MapLayer (or GroupLayer)
    public async removeLayer(layer: __esri.Layer) : Promise<EsriWrapper<__esri.MapView>> {
        // console.log('fired removeLayer() in MapService');
        // remove Group Layer
        this.mapView.map.remove(layer);
        return { val: this.mapView };
    }

    // Returns a layer instance from the map based on its title property
    public findLayerByTitle(title: string) : __esri.Layer {
        return this.mapView.map.layers.find(function (layer) {
            if (layer.title === title) {
                console.log('findLayerByTitle Found: ' + title);
            }
            return layer.title === title;
        });
    }

    // Returns a sublayer instance from the map based on its title property
    public findSubLayerByTitle(GroupLayer: __esri.GroupLayer, title: string) : __esri.Layer {
        return GroupLayer.layers.find(function (layer) {
            if (layer.title === title) {
                console.log('findSubLayerByTitle found: ' + layer.title);
                return layer.title === title;
            }
        });
    }

    public async setMapLayers(allLayers: any[], selectedLayers: any[], analysisLevels: string[]) : Promise<EsriWrapper<__esri.MapView>> {
        console.log('fired setMapLayers() in MapService');
        const Census = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer';

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
        let PopupTitle: string;
        let startPos: number;
        let endPos: number;

        const fromPortal = id => Layer.fromPortalItem({
            portalItem: {
                id: id
            }
        });

        // Add this action to the popup so it is always available in this view
        const measureThisAction = {
            title: 'Measure Length',
            id: 'measure-this',
            className: 'esri-icon-share'
        };

        // Add this action to the popup so it is always available in this view
        const selectThisAction = {
            title: 'Select Polygon',
            id: 'select-this',
            className: 'esri-icon-plus-circled'
        };

        // Add this action to the popup so it is always available in this view
        const bufferThisAction = {
            title: 'buffer',
            id: 'buffer-this',
            className: 'esri-icon-radio-checked'
          };

          // Remove ESRI Group Layer Sublayers (will be reloaded from checkboxes)
        MapService.EsriGroupLayer.visible = false;
        MapService.EsriGroupLayer.removeAll();

        MapService.DmaGroupLayer.visible = false;
        MapService.ZipGroupLayer.visible = false;
        MapService.AtzGroupLayer.visible = false;
        MapService.PcrGroupLayer.visible = false;
        MapService.HHGroupLayer.visible = false;
        MapService.WrapGroupLayer.visible = false;

        // MapService.SitesGroupLayer.visible = false;
        // MapService.CompetitorsGroupLayer.visible = false;

        // Esri Layers
        if (selectedLayers.length !== 0) {
            selectedLayers.forEach((element, index) => {
                console.log(element.name + ': ' + element.url);
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
                        MapService.EsriGroupLayer.add(new MapLayer({
                            url: element.url, outfields: ['*'],
                            popupTemplate: { title: popupTitle, content: '{*}' }, actions: [selectThisAction, measureThisAction], opacity: 0.65
                        }));
                        console.log('added MapLayer:' + element.name);
                    }
                } else
                    if (element.url.indexOf('FeatureServer') !== -1) {
                        if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, element.name)) {
                            MapService.EsriGroupLayer.add(new FeatureLayer({
                                url: element.url, outfields: ['*'],
                                popupTemplate: { title: popupTitle, content: '{*}' }, actions: [selectThisAction, measureThisAction], opacity: 0.65
                            }));
                            console.log('added FeatureLayer:' + element.name);
                        }
                    }
                // Add ZIP Group Layer if it does not already exist
                if (!this.findLayerByTitle('ESRI')) {
                    this.mapView.map.layers.add(MapService.EsriGroupLayer);
                }
                MapService.EsriGroupLayer.visible = true;
            });
        }

        // Analysis Levels
        if (analysisLevels.length !== 0) {
            // Loop through each of the selected analysisLevels
            analysisLevels.forEach((analysisLevel, index) => {

                if (analysisLevel === 'DMA') {
                    // Add DMA layer IDs
                    const layers = this.config.layerIds.dma.map(fromPortal);

                    // Add all DMA Layers via Promise
                    all(layers)
                        .then(results => {
                            results.forEach(x => {
                                PopupTitle = x.portalItem.title + ': {DMA_CODE} - {DMA_NAME}';
                                if (x.type === 'feature') {
                                    //x.minScale = 5000000;
                                    x.mode = FeatureLayer.MODE_AUTO;
                                    x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                } else {
                                    //x.maxScale = 5000000;
                                    x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                }
                                // Add Layer to Group Layer if it does not already exist
                                if (!this.findSubLayerByTitle(MapService.DmaGroupLayer, x.portalItem.title)) {
                                    console.log('adding subLayer: ' + x.portalItem.title);
                                    MapService.DmaGroupLayer.add(x);
                                }
                            });
                        })
                        .catch(error => console.warn(error.message));
                    // Add DMA Group Layer if it does not already exist
                    if (!this.findLayerByTitle('Valassis DMA')) {
                        this.mapView.map.layers.add(MapService.DmaGroupLayer);
                        MapService.layers.add(MapService.DmaGroupLayer);
                    }
                    MapService.DmaGroupLayer.visible = true;
                } else
                    if (analysisLevel === 'ZIP') {
                        // Add ZIP layer IDs
                        const layers = this.config.layerIds.zip.map(fromPortal);

                        // Add all ZIP Layers via Promise
                        all(layers)
                            .then(results => {
                                results.forEach(x => {
                                    PopupTitle = x.portalItem.title + ' - {GEOCODE}';
                                    if (x.type === 'feature') {
                                        x.minScale = 5000000;
                                        x.mode = FeatureLayer.MODE_AUTO;
                                        x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                    } else {
                                        x.maxScale = 5000000;
                                        x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                    }
                                    // Add Layer to Group Layer if it does not already exist
                                    if (!this.findSubLayerByTitle(MapService.ZipGroupLayer, x.portalItem.title)) {
                                        console.log('adding subLayer: ' + x.portalItem.title);
                                        MapService.ZipGroupLayer.add(x);
                                    }
                                });
                            })
                            .catch(error => console.warn(error.message));

                        // Add ZIP Group Layer if it does not already exist
                        if (!this.findLayerByTitle('Valassis ZIP')) {
                            this.mapView.map.layers.add(MapService.ZipGroupLayer);
                            MapService.layers.add(MapService.ZipGroupLayer);
                        }
                        MapService.ZipGroupLayer.visible = true;
                    } else
                        if (analysisLevel === 'ATZ') {
                            // Add atz layer IDs
                            const layers = this.config.layerIds.atz.map(fromPortal);

                            // Add all ATZ Layers via Promise
                            all(layers)
                                .then(results => {
                                    results.forEach(x => {
                                        PopupTitle = x.portalItem.title + ' - {GEOCODE}';
                                        if (x.type === 'feature') {
                                            x.minScale = 5000000;
                                            x.mode = FeatureLayer.MODE_AUTO;
                                            x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                        } else {
                                            x.maxScale = 5000000;
                                            x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                        }
                                        // Add Layer to Group Layer if it does not already exist
                                        if (!this.findSubLayerByTitle(MapService.AtzGroupLayer, x.portalItem.title)) {
                                            console.log('adding subLayer: ' + x.portalItem.title);
                                            MapService.AtzGroupLayer.add(x);
                                        }
                                    });
                                })
                                .catch(error => console.warn(error.message));

                            // Add ZIP Group Layer if it does not already exist
                            if (!this.findLayerByTitle('Valassis ATZ')) {
                                this.mapView.map.layers.add(MapService.AtzGroupLayer);
                            }
                            MapService.AtzGroupLayer.visible = true;
                        } else
                            if (analysisLevel === 'PCR') {
                                // Add PCR layer IDs
                                const layers = this.config.layerIds.pcr.map(fromPortal);

                                // Add all PCR Layers via Promise
                                all(layers)
                                    .then(results => {
                                        results.forEach(x => {
                                            PopupTitle = x.portalItem.title + ' - {GEOCODE}';
                                            if (x.type === 'feature') {
                                                x.minScale = 5000000;
                                                x.mode = FeatureLayer.MODE_AUTO;
                                                x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                            } else {
                                                x.maxScale = 5000000;
                                                x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                            }
                                            // Add Layer to Group Layer if it does not already exist
                                            if (!this.findSubLayerByTitle(MapService.PcrGroupLayer, x.portalItem.title)) {
                                                console.log('adding subLayer: ' + x.portalItem.title);
                                                MapService.PcrGroupLayer.add(x);
                                            }
                                        });
                                    })
                                    .catch(error => console.warn(error.message));

                                // Add PCR Group Layer if it does not already exist
                                if (!this.findLayerByTitle('Valassis PCR')) {
                                    this.mapView.map.layers.add(MapService.PcrGroupLayer);
                                }
                                MapService.PcrGroupLayer.visible = true;

                            } else
                                if (analysisLevel === 'WRAP') {
                                    // Add WRAP layer IDs
                                    const layers = this.config.layerIds.wrap.map(fromPortal);

                                    // Add all WRAP Layers via Promise
                                    all(layers)
                                        .then(results => {
                                            results.forEach(x => {
                                                PopupTitle = x.portalItem.title + ' - {GEOCODE}';
                                                if (x.type === 'feature') {
                                                    // x.minScale = 5000000;
                                                    x.mode = FeatureLayer.MODE_AUTO;
                                                    x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                                } else {
                                                    x.maxScale = 5000000;
                                                    x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                                }
                                                // Add Layer to Group Layer if it does not already exist
                                                if (!this.findSubLayerByTitle(MapService.WrapGroupLayer, x.portalItem.title)) {
                                                    console.log('adding subLayer: ' + x.portalItem.title);
                                                    MapService.WrapGroupLayer.add(x);
                                                }
                                            });
                                        })
                                        .catch(error => console.warn(error.message));

                                    // Add WRAP Group Layer if it does not already exist
                                    if (!this.findLayerByTitle('Valassis WRAP')) {
                                        this.mapView.map.layers.add(MapService.WrapGroupLayer);
                                    }
                                    MapService.WrapGroupLayer.visible = true;

                                } else
                                    if (analysisLevel === 'HH') {
                                        // Add HH layer IDs
                                        const layers = this.config.layerIds.hh.map(fromPortal);

                                        // Add all HH Layers via Promise
                                        all(layers)
                                            .then(results => {
                                                results.forEach(x => {
                                                    PopupTitle = x.portalItem.title;
                                                    if (x.type === 'feature') {
                                                        x.minScale = 2300000;
                                                        x.mode = FeatureLayer.MODE_AUTO;
                                                        x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                                    } else {
                                                        x.maxScale = 2300000;
                                                        x.popupTemplate = new PopupTemplate({ title: PopupTitle, content: '{*}', actions: [selectThisAction, measureThisAction], opacity: 0.65 });
                                                    }
                                                    // Add Layer to Group Layer if it does not already exist
                                                    if (!this.findSubLayerByTitle(MapService.HHGroupLayer, x.portalItem.title)) {
                                                        console.log('adding subLayer: ' + x.portalItem.title);
                                                        MapService.HHGroupLayer.add(x);
                                                    }
                                                });
                                            })
                                            .catch(error => console.warn(error.message));

                                        // Add HH Group Layer if it does not already exist
                                        if (!this.findLayerByTitle('Valassis Households')) {
                                            this.mapView.map.layers.add(MapService.HHGroupLayer);
                                        }
                                        MapService.HHGroupLayer.visible = true;
                                    }
            }); // End forEach analysisLevels
        }
        /*
        // -------------------------------------------------------------------------------
        // Add DMA Layer if it does not exist
        // Add all DMA Layers via Promise
        const layers = dma_layerids.map(fromPortal);

        all(layers)
            .then(results => {
            results.forEach(x => {
                PopupTitle = x.portalItem.title + ': {DMA_CODE} - {DMA_NAME}';
                if (x.type === 'feature') {
                //x.minScale = 2300000;
                x.mode = FeatureLayer.MODE_AUTO;
                x.visible = false;
                x.popupTemplate = new PopupTemplate ({ title: PopupTitle, content: '{*}',  actions: [selectThisAction, measureThisAction], opacity: 0.65 });
            } else {
                x.maxScale = 2300000;
                x.popupTemplate = new PopupTemplate ({ title: PopupTitle, content: '{*}',  actions: [selectThisAction, measureThisAction], opacity: 0.65 });
            }

            // Add Layer to Group Layer if it does not already exist
            if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, x.portalItem.title)) {
                console.log ('adding subLayer: ' + x.portalItem.title);
                MapService.EsriGroupLayer.add(x);
            }
            });
        })
        .catch(error => console.warn(error.message));
        */
        // -------------------------------------------------------------------------------
        /*
        // -------------------------------------------------------------------------------
        // Add Census Layer if it does not exist
        if (!this.findSubLayerByTitle(MapService.EsriGroupLayer, 'Census')) {
            MapService.EsriGroupLayer.add(new MapLayer({ url: Census, opacity: 1, visible: false }));
        }
        if (!this.findLayerByTitle('ESRI')) {
            this.mapView.map.layers.add(MapService.EsriGroupLayer);
        }
        MapService.EsriGroupLayer.visible = true;
        */
        // -------------------------------------------------------------------------------
        return { val: this.mapView };
    }

    public async drawCircle(lat: number, lon: number, pointColor, miles: number, title: string, outlineColor, parentId?: number) : Promise<EsriWrapper<__esri.MapView>> {
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

        sym.outline.color = outlineColor;

        //  let gl: __esri.GraphicsLayer = new GraphicsLayer({ id: 'circles' });

        //  this.mapView.map.add(gl);

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
        //hide the spinner after drawing buffer
        this.displayDBSpinner = false;
        // If a parentId was provided, set it as an attribute
        if (parentId != null)
            g.setAttribute('parentId', parentId);

        const graphicList: __esri.Graphic[] = [];
        graphicList.push(g);
        await this.updateFeatureLayer(graphicList, title);
        await this.selectCentroid(graphicList);
        //await this.zoomOnMap(graphicList);
        return { val: this.mapView };
    }

    public async bufferMergeEach(pointsArray: Points[], pointColor, kms: number, title: string, outlneColor, parentId?: number) {
        /*: Promise<EsriWrapper<__esri.MapView>>*/
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
        sym.outline.color = outlneColor;

        const pointList: __esri.Point[] = [];

        for (const point of pointsArray) {
            const p = new Point({
                x: point.longitude,
                y: point.latitude,
                spatialReference: 4326
            });
            pointList.push(p);
        }
        // this.mapView.graphics.removeAll();
        const graphicList: __esri.Graphic[] = [];
        const bufferedGeometries = geometryEngine.geodesicBuffer(pointList, kms, 'kilometers', true);
        array.forEach(bufferedGeometries, function (geometry) {
            console.log(' number of graphices from geodesicBuffer::' + bufferedGeometries.length);
            const g: __esri.Graphic = new Graphic();
            g.geometry = geometry;
            g.symbol = sym;
            if (parentId != null)
                g.setAttribute('parentId', parentId);
            graphicList.push(g);
        });
        await this.updateFeatureLayer(graphicList, title);
        console.log('draw buffer--------->' + graphicList.length);
        //await this.selectCentroid(graphicList);
        return graphicList;
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
            popupTemplate: { content: '{*}' },
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

        if (layerName.includes('Site') || layerName.includes('ZIP') || layerName.includes('ATZ')) {
            const index = MapService.SitesGroupLayer.layers.length;
            MapService.SitesGroupLayer.layers.unshift(lyr);

            if (!this.findLayerByTitle('Sites')) {
                this.mapView.map.layers.add(MapService.SitesGroupLayer);
                MapService.layers.add(MapService.SitesGroupLayer);
                MapService.SitesGroupLayer.visible = true;
            }
        }

        if (layerName.includes('Competitor')) {
            const index = MapService.CompetitorsGroupLayer.layers.length;
            MapService.CompetitorsGroupLayer.add(lyr, index);
            if (!this.findLayerByTitle('Competitors')) {
                this.mapView.map.layers.add(MapService.CompetitorsGroupLayer);
                MapService.layers.add(MapService.CompetitorsGroupLayer);
                MapService.CompetitorsGroupLayer.visible = true;
            }
        }

        MapService.layers.add(lyr);
        MapService.layerNames.add(lyr.title);
    }

    public clearFeatureLayer(layerTitle: string) {
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
            if (layerTitle === currentLayer.title) {
                console.log('Clearing layer: ' + layerTitle);
                (<__esri.FeatureLayer>currentLayer).source.removeAll();
                layerCleared = true;
            }
        });

        if (!layerCleared)
            console.log('Did not find layer: ' + layerTitle + ' to clear');
    }

    public clearFeatureLayerAt(layerTitle: string, lat: number, lon: number) {
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
            if (layerTitle === currentLayer.title) {
                console.log('Clearing layer: ' + layerTitle);
                const currLayer: __esri.FeatureLayer = (<__esri.FeatureLayer>currentLayer);
                const src: __esri.Collection<__esri.Graphic> = currLayer.source;

                for (let i: number = 0; i < src.length; i++) {
                    console.log('Clearing graphic ' + i + ' / ' + src.length);
                    const graphic: __esri.Graphic = src.getItemAt(i);
                    const point: __esri.Point = (<__esri.Point>graphic.geometry);
                    console.log('long: ' + point.longitude + ', lat: ' + point.latitude + ' vs ' + lon + ', ' + lat);
                    if (point.latitude === lat && point.longitude === lon) {
                        console.log('found graphic at lat: ' + lat + ', lon: ' + lon);
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

    public clearAllFeatureLayersAt(lat: number, lon: number) {
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

    public aproximatelyEqual(valueA: number, valueB: number, epsilon: number) {
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

    public clearGraphicsForParent(parentId: number) {
        // this.setGraphicAttribute (graphic, 'parentId', parentId);
        // If there are no layers, there is nothing to do
        if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
            console.log('fired clearGraphicsForParent() in MapService, but there were no feature layers to clear');
            return;
        }
        else
            if (parentId == null) {
                console.log('fired clearGraphicsForParent() in MapService, but no parentId was provided');
                return;
            }
            else
                console.log('fired clearGraphicsForParent() in MapService');

        // loop through the existing layers to see if we can find one to clear
        MapService.layers.forEach(currentLayer => {
            console.log('Clearing layer: ' + currentLayer.title);
            const currLayer: __esri.FeatureLayer = (<__esri.FeatureLayer>currentLayer);
            const src: __esri.Collection<__esri.Graphic> = currLayer.source;

            if (src != null) {
                for (let i: number = 0; i < src.length; i++) {
                    console.log('Looking at graphic ' + (i + 1) + ' / ' + src.length);
                    const graphic: __esri.Graphic = src.getItemAt(i);
                    const currParentId: number = graphic.getAttribute('parentId');
                    console.log('parentId: ' + currParentId);

                    // Determine if the current parent matches the search parent
                    if (currParentId === parentId) {
                        console.log('Clearing graphic with parentId: ' + parentId);
                        src.remove(graphic);
                    }
                    else {
                        console.log('NOT clearing graphic with parent: ' + currParentId);
                    }
                }
            }
            else
                console.log('Layer ' + currLayer.title + ' has no source graphics');
        });
    }

    public setGraphicAttribute(graphic: __esri.Graphic, name: string, value: any) {
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
        //this.mapView.map.allLayers
        MapService.layers.forEach(currentLayer => {
            if (layerTitle === currentLayer.title) {
                console.log('updating existing layer with ' + graphics.length + ' graphics');
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
            //    style: 'circle',
            style: 'path',
            size: 12,
            color: color,
            path: 'M 240.000 260.000 L 263.511 272.361 L 259.021 246.180 L 278.042 227.639 L 251.756 223.820 L 240.000 200.000 L 228.244 223.820 L 201.958 227.639 L 220.979 246.180 L 216.489 272.361 L 240.000 260.000'
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

        // call getgeohome to get inhome geo 


        // if we got a popup template add that to the graphic as well
        if (popupTemplate != null) {
           
            await this.getHomeGeocode(graphicProps, popupTemplate).then( res => {
                popupTemplate = res;
            });
            graphicProps.popupTemplate = popupTemplate;
        }
        /*let graphic: __esri.Graphic = new Graphic();
        await this.getHomeGeocode(graphicProps).then( res => {
            graphic = res;
        });*/
        const graphic: __esri.Graphic = new Graphic(graphicProps);

        console.log('Graphic parentId: ' + parentId);
        if (parentId != null) {
            console.log('Set parentId: ' + parentId);
            // this.setGraphicAttribute (graphic, 'parentId', parentId);
            graphic.setAttribute('parentId', parentId);
        }

        return graphic;
    }

    public async zoomOnMap(graphics: __esri.Graphic[]) {
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

        await graphics.forEach(function (current: any) {
            //console.log('test inside current obj::'+current.geometry.latitude)
            p.latitude = current.geometry.latitude;
            p.longitude = current.geometry.longitude;
            pList.push(p);
            lonList.push(p.longitude);   /// this is X
            latList.push(p.latitude);   /// this is y
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
            this.mapView.extent = extent;
        } catch (error) {
            throw new Error(error.message);
        }

        // if we are zooming to a single site we want to increase the zoom level
        if (graphics.length === 1) {
            this.mapView.zoom = 12;
        }
    }

    public async selectCentroid(graphicList: __esri.Graphic[]) {
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

        const centroidGraphics: __esri.Graphic[] = [];
        let fLyrList: __esri.FeatureLayer[] = [];
        await this.getAllFeatureLayers().then(list => {
            fLyrList = list;
        });


        for (const lyr of fLyrList) {
            if (lyr.title === 'ZIP_Centroids_FL' || lyr.title === 'ATZ_Centroids') {
                let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();
                await lyr.load().then((f1: __esri.FeatureLayer) => {
                    loadedFeatureLayer = f1;
                });
                for (const graphic of graphicList) {
                    const qry = lyr.createQuery();
                    qry.geometry = graphic.geometry;
                    qry.outSpatialReference = this.mapView.spatialReference;
                    await lyr.queryFeatures(qry).then(featureSet => {
                        for (let i = 0; i < featureSet.features.length; i++) {
                            if (featureSet.features[i].attributes.GEOMETRY_TYPE === 'Polygon') {
                                centroidGraphics.push(featureSet.features[i]);
                            }
                        }
                    });
                }
                await this.selectPoly(centroidGraphics);
            }
        }
    }

    public async getGeocodes() {
      console.log('getGeocodes fired');

      const impGeofootprintGeos: ImpGeofootprintGeo[] = [];

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

      const centroidGraphics: __esri.Graphic[] = [];
      let fLyrList: __esri.FeatureLayer[] = [];
      await this.getAllFeatureLayers().then(list => {
          fLyrList = list;
      });


      for (const lyr of fLyrList) {
         if (lyr.title === 'ZIP_Centroids_FL' || lyr.title === 'ATZ_Centroids') {
            let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();
            await lyr.load().then((f1: __esri.FeatureLayer) => {
                  loadedFeatureLayer = f1;
         });

         const qry = lyr.createQuery();
//       qry.geometry = graphic.geometry;
         qry.outSpatialReference = this.mapView.spatialReference;
         await lyr.queryFeatures(qry).then(featureSet => {
               for (let i = 0; i < featureSet.features.length; i++)
               {
                  console.log('featureSet.features[' + i + ']', featureSet.features[i].toJSON());
                  impGeofootprintGeos.push(new ImpGeofootprintGeo({geocode: featureSet.features[i].attributes.GEOCODE}));
//                  if (featureSet.features[i].attributes.GEOMETRY_TYPE === 'Polygon') {
//                     centroidGraphics.push(featureSet.features[i]);
//                  }
               }
            });

            if (MapService.selectedCentroidObjectIds && MapService.selectedCentroidObjectIds.length > 0) {
               for (let i = 0; i < MapService.selectedCentroidObjectIds.length; i++)
               {
                  console.log('selectedCentroidObjectIds[' + i + ']', MapService.selectedCentroidObjectIds);
               }
            }

            this.impGeofootprintGeoService.clearAll();
            this.impGeofootprintGeoService.add(impGeofootprintGeos);
           // console.log(MapService.SitesGroupLayer);

         // if (MapService.selectedCentroidObjectIds.length < 0 || !MapService.selectedCentroidObjectIds.includes(polyFeatureSet.features[i].attributes.OBJECTID)) {
         //       MapService.hhDetails = MapService.hhDetails + polyFeatureSet.features[i].attributes.HHLD_W;
         //       MapService.hhIpAddress = MapService.hhIpAddress + polyFeatureSet.features[i].attributes.NUM_IP_ADDRS;
         //       MapService.medianHHIncome = '$' + polyFeatureSet.features[i].attributes.CL2I0O;
         //       MapService.hhChildren = polyFeatureSet.features[i].attributes.CL0C00;
         //       polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry, symbol123, polyFeatureSet.features[i].attributes.OBJECTID));
         //       MapService.selectedCentroidObjectIds.push(polyFeatureSet.features[i].attributes.OBJECTID);
         // }

            //   for (const graphic of graphicList) {
            //       const qry = lyr.createQuery();
            //       qry.geometry = graphic.geometry;
            //       qry.outSpatialReference = this.mapView.spatialReference;
            //       await lyr.queryFeatures(qry).then(featureSet => {
            //           for (let i = 0; i < featureSet.features.length; i++) {
            //               if (featureSet.features[i].attributes.GEOMETRY_TYPE === 'Polygon') {
            //                   centroidGraphics.push(featureSet.features[i]);
            //               }
            //           }
            //       });
            //   }
            //   await this.selectPoly(centroidGraphics);
          }
      }

      // console.log('### LIST OF GEOS ###');
      // for (const geo of impGeofootprintGeos)
      // {
      //    console.log('geo: ', geo);
      // }
  }

    public async selectPoly(centroidGraphics: __esri.Graphic[]) {
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

        for (const lyr of fLyrList) {
            if (lyr.title === 'ZIP_Top_Vars' || lyr.title === 'ATZ_Top_Vars') {
                let layername = null;
                if (lyr.title === 'ZIP_Top_Vars')
                    layername = 'Selected Geography - ZIP';
                else
                    layername = 'Selected Geography - ATZ';
                const polyGraphics: __esri.Graphic[] = [];
                let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();

                await lyr.load().then((f1: __esri.FeatureLayer) => {
                    loadedFeatureLayer = f1;
                    // loadedFeatureLayer.renderer = f1
                });

                await this.removeSubLayer(layername, MapService.SitesGroupLayer);
                // MapService.selectedCentroidObjectIds = [];
                MapService.hhDetails = 0;
                MapService.hhIpAddress = 0;
                MapService.medianHHIncome = '0';
                MapService.hhChildren = 0;
                this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
                this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());
                this.metricService.add('AUDIENCE', 'Median Household Income', MapService.medianHHIncome.toString());
                this.metricService.add('AUDIENCE', 'Households with Children', MapService.hhChildren.toString());

                await array.forEach(centroidGraphics, (centroidGraphic) => {
                    const qry1 = loadedFeatureLayer.createQuery();
                    qry1.geometry = centroidGraphic.geometry;
                    qry1.outSpatialReference = this.mapView.spatialReference;

                    loadedFeatureLayer.queryFeatures(qry1).then(polyFeatureSet => {
                        //const t0 = performance.now();

                        for (let i = 0; i < polyFeatureSet.features.length; i++) {
                            if (MapService.selectedCentroidObjectIds.length < 0 || !MapService.selectedCentroidObjectIds.includes(polyFeatureSet.features[i].attributes.OBJECTID)) {
                                MapService.hhDetails = MapService.hhDetails + polyFeatureSet.features[i].attributes.HHLD_W;
                                MapService.hhIpAddress = MapService.hhIpAddress + polyFeatureSet.features[i].attributes.NUM_IP_ADDRS;
                                MapService.medianHHIncome = '$' + polyFeatureSet.features[i].attributes.CL2I0O;
                                MapService.hhChildren = polyFeatureSet.features[i].attributes.CL0C00;
                                polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry, symbol123, polyFeatureSet.features[i].attributes.OBJECTID));
                                MapService.selectedCentroidObjectIds.push(polyFeatureSet.features[i].attributes.OBJECTID);
                            }
                            //lyr.applyEdits({updateFeatures : [new Graphic(polyFeatureSet.features[i].geometry,symbol123)]});
                        }
                        //this.mapView.graphics.addMany(polyGraphics);
                        this.updateFeatureLayer(polyGraphics, layername);
                        this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                        this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                        this.metricService.add('AUDIENCE', 'Median Household Income', MapService.medianHHIncome.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '$'));
                        this.metricService.add('AUDIENCE', 'Households with Children', MapService.hhChildren.toString());
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
                        //qry1.outSpatialReference = this.mapView.spatialReference;
                        let featureLayerView = null;
                        await this.mapView.whenLayerView(lyr).then(view => {featureLayerView = view;})
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
                     this.mapView.graphics.addMany(polyGraphics);
                }
            }
        } */

    public async selectSinglePolygon(evt: __esri.MapViewClickEvent, geom?: __esri.Geometry, objID?: number) {
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

        for (const lyr of fLyrList) {
            if (lyr.title === 'ZIP_Top_Vars' || lyr.title === 'ATZ_Top_Vars') {
                const query = lyr.createQuery();
                if (geom) {
                    console.log ('selectSinglePoly() - geom:' + objID);
                    const currentClick = query.geometry = geom;
                } else {
                    console.log ('selectSinlgePoly() - Mapclick' + evt);
                    const currentClick = query.geometry = evt.mapPoint;
                }
                query.outSpatialReference = Query.SPATIAL_REL_INTERSECTS;
                await lyr.queryFeatures(query).then(polyFeatureSet => {
                       if (MapService.selectedCentroidObjectIds.includes(polyFeatureSet.features[0].attributes.OBJECTID)){

                            const graphi: __esri.Graphic = polyFeatureSet.features[0];
                            this.mapView.graphics.forEach((graphic) => {
                                   if (objID === graphic.attributes){
                                        console.log('deselect objID in mapview');
                                     this.mapView.graphics.remove(graphic);
                                    } else {
                                        if (graphi.attributes.OBJECTID === graphic.attributes){
                                            console.log('deselect to mapview');
                                          this.mapView.graphics.remove(graphic);
                                        }
                                    }
                                    //const index = MapService.selectedCentroidObjectIds.indexOf(graphi.attributes.OBJECTID);
                                    //MapService.selectedCentroidObjectIds.splice(index, 1);

                                    if (objID !== null) {
                                        const index = MapService.selectedCentroidObjectIds.indexOf(objID);
                                        MapService.selectedCentroidObjectIds.splice(index, 1);
                                    } else {
                                        const index = MapService.selectedCentroidObjectIds.indexOf(graphi.attributes.OBJECTID);
                                        MapService.selectedCentroidObjectIds.splice(index, 1);
                                    }
                                    MapService.hhDetails = MapService.hhDetails - polyFeatureSet.features[0].attributes.HHLD_W;
                                    MapService.hhIpAddress = MapService.hhIpAddress - polyFeatureSet.features[0].attributes.NUM_IP_ADDRS;
                                    this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                                    this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                                }
                            );
                        }else{
                            console.log('select to mapview');
                            if (objID != null) {
                                MapService.selectedCentroidObjectIds.push(objID);
                                this.mapView.graphics.add(new Graphic(geom, symbol, objID));
                            }
                            else {
                               MapService.selectedCentroidObjectIds.push(polyFeatureSet.features[0].attributes.OBJECTID);
                               this.mapView.graphics.add(new Graphic(polyFeatureSet.features[0].geometry, symbol, polyFeatureSet.features[0].attributes.OBJECTID));
                            }
                            MapService.hhDetails = MapService.hhDetails + polyFeatureSet.features[0].attributes.HHLD_W;
                            MapService.hhIpAddress = MapService.hhIpAddress + polyFeatureSet.features[0].attributes.NUM_IP_ADDRS;
                            //MapService.medianHHIncome = polyFeatureSet.features[0].attributes.CL2I0O;
                            //MapService.hhChildren = polyFeatureSet.features[0].attributes.CL0C00;
                            this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                            this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                            //this.metricService.add('AUDIENCE', 'Median Household Income', MapService.medianHHIncome.toString());
                            //this.metricService.add('AUDIENCE', 'Households with Children', MapService.hhChildren.toString());

                    }
                });
            }
        }

    }

    public async getAllFeatureLayers() : Promise<__esri.FeatureLayer[]> {
        console.log('fired getAllFeatureLayers');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [GroupLayer, FeatureLayer] = await loader.loadModules([
            'esri/layers/GroupLayer',
            'esri/layers/FeatureLayer'
        ]);
        //this.mapView.map.allLayers.length;
        const fLyrList: __esri.FeatureLayer[] = [];
        this.mapView.map.allLayers.forEach(function (lyr: __esri.FeatureLayer) {
            //  console.log('lyrs names before adding::'+lyr.title);
            if (lyr instanceof FeatureLayer) {
                //  console.log('lyrs names After adding::'+lyr.title);
                fLyrList.push(lyr);
            }
        });
        return fLyrList;
    }

    public async removeSubLayer(deleteLayerName: string, groupLayer: __esri.GroupLayer) {
        this.getAllFeatureLayers().then(list => {
            for (const layer of list) {
                if (layer.title.startsWith(deleteLayerName)) {
                    groupLayer.remove(layer);
                    MapService.layers.delete(layer);
                    MapService.layerNames.delete(layer.title);
                    this.getMapView().map.remove(layer);
                    // mapView.map.remove(layer);
                }
            }
        });
    }

    async callTradeArea() {
        console.log('callTradeArea fired::');
        if (MapService.tradeAreaInfoMap.has('miles')) {
            console.log('callTradeArea has keys::');
            const tradeAreaMap: Map<string, any> = MapService.tradeAreaInfoMap;
            let milesList: number[] = [];

            const lyrName = tradeAreaMap.get('lyrName');
            if (lyrName.startsWith('Site -')) {
                await this.removeSubLayer('Site -', MapService.SitesGroupLayer);
            }
            if (lyrName.startsWith('Competitor -')) {
                await this.removeSubLayer(lyrName, MapService.CompetitorsGroupLayer);
            }
            if (tradeAreaMap.get('mergeType') === 'MergeEach') {
                milesList = tradeAreaMap.get('miles');
                //let graphicList: __esri.Graphic[];
                const max = Math.max(...milesList);
                for (const miles of milesList) {
                    const kmsMereEach = miles / 0.62137;
                    await this.bufferMergeEach(MapService.pointsArray, tradeAreaMap.get('color'), kmsMereEach, tradeAreaMap.get('lyrName'), tradeAreaMap.get('outlneColor'), null)
                        .then(res => {
                            //graphicList = res;
                            if (max === miles) {
                                this.selectCentroid(res);
                            }
                        });
                }
            }
            if (tradeAreaMap.get('mergeType') === 'MergeAll') {
                await this.bufferMergeEach(MapService.pointsArray, tradeAreaMap.get('color'), tradeAreaMap.get('milesMax'), tradeAreaMap.get('lyrName'), tradeAreaMap.get('outlneColor'), null)
                    .then(res => {
                        this.selectCentroid(res);
                    });
            }
            if (tradeAreaMap.get('mergeType') === 'NoMerge') {
                milesList = tradeAreaMap.get('miles');
                for (const miles of milesList) {
                    const kmsNomerge = miles / 0.62137;
                    for (const point of MapService.pointsArray) {
                        await this.drawCircle(point.latitude, point.longitude, tradeAreaMap.get('color'), kmsNomerge, tradeAreaMap.get('lyrName'), tradeAreaMap.get('outlneColor'), null);
                    }
                }
            }
        }
    }

    public removePoint(point: Points) {
    }

    async getHomeGeocode(graphicProps: __esri.GraphicProperties, popupTemplate: __esri.PopupTemplate) : Promise<__esri.PopupTemplate>{
        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, Graphic, PopupTemplate]
            = await loader.loadModules([
                'esri/layers/FeatureLayer', 'esri/Graphic', 'esri/PopupTemplate']);
         const graphic: __esri.Graphic = new Graphic(graphicProps);       
         console.log('getHomeGeocode fired');    

         let lyyr: __esri.FeatureLayer;
        await this.getAllFeatureLayers().then(list => {
            for (const layer of list) {
                console.log('layer name:::::::::' + layer.title);
                if (layer.title === 'ZIP_Top_Vars' || layer.title === 'ATZ_Top_Vars') {
                    lyyr = layer;
                   
                }
            }
        });
        const qry = lyyr.createQuery();
        qry.geometry = graphic.geometry;
        const popUp: __esri.PopupTemplate = new PopupTemplate();
         await lyyr.queryFeatures(qry).then(polyFeatureSet => {
                const homeGeocode = polyFeatureSet.features[0].attributes.GEOCODE;
                let popupTemp = null;
                popupTemp = popupTemplate.content;
                const homeGeocodepopup = '<tbody><tr><th>HOME GEOCODE</th><td>' + homeGeocode + '</td></tr>';
                popupTemp = popupTemp.replace(/<tbody>/g, homeGeocodepopup);
                popUp.content = popupTemp;
        });
        return popUp;
      }
}


export interface EsriWrapper<T> {

    val: T;

}
