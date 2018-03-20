import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { Points } from '../models/Points';
import { MetricService } from '../val-modules/common/services/metric.service';
import { ValLayerService } from './app-layer.service';
import { mapFunctions } from '../app.component';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { GeoFootPrint } from './geofootprint.service';
import { AuthService } from './auth.service';
import { DefaultLayers } from '../models/DefaultLayers';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { LayerDefinition } from '../../environments/environment';

@Injectable()
export class MapService {

    // Group Layers
    public static EsriGroupLayer: __esri.GroupLayer;
    public static ZipGroupLayer: __esri.GroupLayer;
    public static AtzGroupLayer: __esri.GroupLayer;
    public static DigitalAtzGroupLayer: __esri.GroupLayer;
    public static PcrGroupLayer: __esri.GroupLayer;
    public static HHGroupLayer: __esri.GroupLayer;
    public static WrapGroupLayer: __esri.GroupLayer;
    public static DmaGroupLayer: __esri.GroupLayer;
    public static SitesGroupLayer: __esri.GroupLayer;
    public static CompetitorsGroupLayer: __esri.GroupLayer;
    public static CountyGroupLayer: __esri.GroupLayer;

    public static layerNames: Set<string> = new Set<string>();
    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();

    public static selectedCentroidObjectIds: number[] = []; //  --> will keep track of selected centroids on the map
    public static hhDetails: number = 0;  // --> will keep track of houshold count
    public static hhIpAddress: number = 0; // --> will keep track of houshold ipaddress count
    public static medianHHIncome: String = '0';
    public static hhChildren: number = 0;
    public static totInvestment: number = 0; // keeps track of total investment
    public static proBudget: number = 0;     // keeps track of Progess to Budget %
    public static t: number = 0;               // a temp variable to calculate Progress to budget
    public static circBudget: number = 0;      // a variable to calculate Progress to budget based on Circ budget
    public static dollarBudget: number = 0;    // a variable to calculate Progress to budget based on dollar budget
    public static tradeAreaInfoMap: Map<string, any> = new Map<string, any>(); // -> this will keep track of tradearea's on the map
    //TODO we need to remove pointsArray after adi's uploadfunction.
    public static pointsArray: Points[] = []; // --> will keep track of all the poins on the map

    //public static analysisLevlDiscInput: string;

    private map: __esri.Map;
    private mapView: __esri.MapView;

    // set a reference to global enum (defined in app.component)
    public mapFunction: mapFunctions = mapFunctions.Popups;
    public sketchViewModel: __esri.SketchViewModel;
    //public sideBarToggle: boolean = false;
    public displayDBSpinner: boolean;
    public displaySpinnerMessage: string = 'Drawing Trade Area ...';

    constructor(private metricService: MetricService,
        private layerService: ValLayerService,
        private esriMapService: EsriMapService,
        private impGeofootprintGeoService: ImpGeofootprintGeoService,
        private config: AppConfig,
        private impGeofootprintLocationService: ImpGeofootprintLocationService,
        private impDiscoveryService: ImpDiscoveryService,
        private geoFootPrintService: GeoFootPrint,
        private authService: AuthService,
        private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService) {
        this.esriMapService.onReady$.subscribe(ready => {
            if (ready) {
                this.mapView = this.esriMapService.mapView;
                this.map = this.esriMapService.map;
            }
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

        MapService.DigitalAtzGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis Digital ATZ',
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

        MapService.CountyGroupLayer = new EsriModules.GroupLayer({
            title: 'Counties',
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
    public bufferThis() {
        // TODO: This method does nothing, do we need it?
        // load required modules for this method
        // const loader = EsriLoaderWrapperService.esriLoader;
        // const [geometryEngine] = await loader.loadModules([
        //     'esri/geometry/geometryEngine'
        // ]);

        const geom: __esri.Geometry = this.mapView.popup.selectedFeature.geometry;
    }

    // // Select polygon using either a MapPoint (click) or passed Geometery (popup-action)
    // public selectPolyClick(evt:  __esri.MapViewClickEvent, geom?: __esri.Geometry, objectID?: number) {
    //     console.log('fired selectPolyClick');
    //     const color = {
    //             a: 1,
    //             r: 35,
    //             g: 93,
    //             b: 186
    //           };
    //     let layers: __esri.Layer[] = [];
    //     let i: number = 0;
    //     if (i === 0){
    //             i++;
    //             this.map.layers.forEach(function(layer: __esri.Layer) {
    //               layers.push(layer);
    //             });
    //             let fLyrList: __esri.FeatureLayer[] = [];
    //             this.getAllFeatureLayers().then(list => {
    //               fLyrList = list;
    //             });
    //
    //             for (const lyr of layers){
    //               if (lyr.title === 'Valassis ZIP' || lyr.title === 'Valassis ATZ'){
    //                 this.selectSinglePolygon(null, geom, objectID);
    //                 break;
    //               }
    //             }
    //     }
    //     layers = [];
    // }

    // Execute each time the "select-this" action is clicked
    public selectThis() {
        console.log('fired popup action select-this()');
        const objectID: number = ValLayerService.getAttributeValue(this.mapView.popup.selectedFeature.attributes, 'OBJECTID');
        const geom: __esri.Geometry = this.mapView.popup.selectedFeature.geometry;
        console.log('-- objectID = ' + objectID);
        this.selectSinglePolygon(null, geom, objectID);
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

        /*
        // Create an instance of the Search widget
        const search = new EsriModules.widgets.Search({
            view: this.mapView
        });
        */

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
        const search = new EsriModules.widgets.Search({
            view: this.mapView,
            container: document.createElement('div')
        });
        /*
        // Create an instance of the BasemapGallery widget
        const print = new EsriModules.widgets.Print({
            view: this.mapView,
            printServiceUrl: this.config.valPrintServiceURL,
            container: document.createElement('div')
        });
        */

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
        const searchExpand = new EsriModules.widgets.Expand({
            view: this.mapView,
            content: search.container,
            expandIconClass: 'esri-icon-search',
            expandTooltip: 'Search',
        });

        /*
        const printExpand = new EsriModules.widgets.Expand({
            view: this.mapView,
            content: print.container,
            expandIconClass: 'esri-icon-printer',
            expandTooltip: 'Print',
        });
        */

        // Add widgets to the viewUI
        this.esriMapService.addWidget(home, 'top-left');
        this.esriMapService.addWidget(searchExpand, 'top-left');
        // TODO: hard coded id is temporary
        this.layerService.initLayerList('colorSlider');

        //this.esriMapService.addWidget(legend, 'top-left');
        this.esriMapService.addWidget(legendExpand, 'top-left');
        this.esriMapService.addWidget(bgExpand, 'top-left');
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
                /*
                type: 'simple-line', // autocasts as new SimpleMarkerSymbol()
                color: '#8A2BE2',
                width: '4',
                style: 'dash'
                */
                type: 'simple-line',
                style: 'short-dash',
                width: 1.25,
                color: [230, 0, 0, 1]
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
        this.mapView.popup.on('trigger-action', (event) => {

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
        this.sketchViewModel.on('draw-complete', (evt: any) => {

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
            this.mapView.graphics.add(evt.graphic);

            // ----------------------------------------------------------------------------------------
            // Measure Length of PolyLine
            if (this.mapFunction === mapFunctions.MeasureLine) {
                const polyline = evt.graphic.geometry;
                // calculate the area of the polygon
                const length: number = EsriModules.geometryEngine.geodesicLength(polyline, 'miles');
                console.log('drawMeasureLine (length) = ' + length);
                if (length > 0) {
                    // start displaying the length of the polyline
                    this.labelMeasurePolyLine(polyline, length);
                }
                this.removeActiveButtons();
                const el: any = document.getElementById('popupsButton');
                el.classList.add('active');
                this.mapFunction = mapFunctions.Popups;
            }
            // ----------------------------------------------------------------------------------------
        });
        // -----------------------------------------------------------------------------------
    }

    // set active button
    public setActiveButton(event: MouseEvent) {
        // focus the view to activate keyboard shortcuts for sketching
        this.mapView.focus();
        const elements: any = document.getElementsByClassName('active');
        const el: any = document.getElementById(event.srcElement.id);
        for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove('active');
        }
        if (event) {
            el.classList.add('active');
        }
    }

    // remove active button css
    public removeActiveButtons() {
        // focus the view to activate keyboard shortcuts for sketching
        this.mapView.focus();
        const elements: any = document.getElementsByClassName('active');
        for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove('active');
        }
    }

    // Label polyon with its Length
    private labelMeasurePolyLine(polyline: __esri.Polyline, length: number) {

        // autocasts as new TextSymbol()
        const textSym = {
            type: 'text',
            color: 'black',
            //haloColor: 'red',
            //haloSize: '1',
            text: length.toFixed(4) + ' miles',
            xoffset: 50,
            yoffset: 3,
            font: { // autocast as Font
                size: 10,
                weight: 'bold',
                family: 'sans-serif'
            }
        };

        // create a point geometry
        const pt = {
            type: 'point',  // autocasts as new Point()
            longitude: polyline.getPoint(0, 0).longitude,
            latitude: polyline.getPoint(0, 0).latitude
        };

        // autocasts as Graphic
        const graphic: any = {
            geometry: pt,
            symbol: textSym
        };

        this.mapView.graphics.add(graphic);
    }

    // Toggle Polygon Selection Mode
    public selectPolyButton(event: MouseEvent) {
        this.mapFunction = mapFunctions.SelectPoly;
        this.setActiveButton(event);
        this.toggleFeatureLayerPopups();
    }

    // Toggle Popups
    public popupsButton(event: MouseEvent) {
        this.mapFunction = mapFunctions.Popups;
        this.setActiveButton(event);
        this.toggleFeatureLayerPopups();
    }

    // Toggle Labels
    // public labelsButton(event: MouseEvent) {
    //     this.mapFunction = mapFunctions.Labels;
    //     this.setActiveButton(event);
    // }
    //
    // // activate the sketch to create a point
    // public drawPointButton(event: MouseEvent) {
    //     this.mapFunction = mapFunctions.DrawPoint;
    //     this.setActiveButton(event);
    //     // set the sketch to create a point geometry
    //     this.sketchViewModel.create('point');
    // }
    //
    // // activate the sketch to create a polyline
    // public drawLineButton(event: MouseEvent) {
    //     this.mapFunction = mapFunctions.DrawLine;
    //     this.setActiveButton(event);
    //     // set the sketch to create a polyline geometry
    //     this.sketchViewModel.create('polyline');
    // }
    //
    // // activate the sketch to create a polygon
    // public drawPolygonButton(event: MouseEvent) {
    //     this.mapFunction = mapFunctions.DrawPoly;
    //     this.setActiveButton(event);
    //     // set the sketch to create a polygon geometry
    //     this.sketchViewModel.create('polygon');
    // }

    // activate the sketch to create a "Measure" polyline
    public measureLineButton(event: MouseEvent) {
        this.mapFunction = mapFunctions.MeasureLine;
        this.setActiveButton(event);
        // set the sketch to create a polyline geometry
        this.sketchViewModel.create('polyline');
    }

    // remove all graphics
    public removeGraphics(event: MouseEvent) {
        this.mapFunction = mapFunctions.RemoveGraphics;
        this.setActiveButton(event);
        this.mapView.graphics.removeAll();
        this.sketchViewModel.reset();
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
    // public plotMarker(lat: number, lon: number, pointColor, popupTemplate?: __esri.PopupTemplate, parentId?: number) : EsriWrapper<__esri.MapView> {
    //
    //     console.log('fired plotMarker() in MapService');
    //     this.createGraphic(lat, lon, pointColor, popupTemplate, parentId).then(graphic => {
    //         if (parentId != null)
    //             graphic.setAttribute('parentId', parentId);
    //         this.mapView.graphics.add(graphic);
    //     });
    //
    //     return { val: this.mapView };
    // }

    // Get MapView
    public getMapView() : __esri.MapView {
        // to return Mapview
        return this.mapView;
    }

    // Hide MapLayers
    public hideMapLayers() : EsriWrapper<__esri.MapView> {
        console.log('fired hideMapLayers() in MapService');
        // Toggle all layers
        this.mapView.map.layers.forEach((layer, i) => {
            if (layer.visible === true) {
                //console.log (i + '. layer visible: ' + this.mapView.map.layers.getItemAt(i).visible);
                this.mapView.map.layers.getItemAt(i).visible = false;
            }
        });
        return { val: this.mapView };
    }

    // Physically Remove All MapLayers
    // public removeMapLayers() : EsriWrapper<__esri.MapView> {
    //     console.log('fired removeMapLayers() in MapService');
    //
    //     // remove all layers
    //     this.mapView.map.layers.removeAll();
    //     return { val: this.mapView };
    // }

    // Physically Remove MapLayer (or GroupLayer)
    public removeLayer(layer: __esri.Layer) : EsriWrapper<__esri.MapView> {
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
    // public findSubLayerByTitle(GroupLayer: __esri.GroupLayer, title: string) : __esri.Layer {
    //     return GroupLayer.layers.find(function (layer) {
    //         if (layer.title === title) {
    //             console.log('findSubLayerByTitle found: ' + layer.title);
    //             return layer.title === title;
    //         }
    //     });
    // }

    // Toggle FeatureLayer popups
    public toggleFeatureLayerPopups() {
        console.log('fired: toggleFeatureLayerPopups');
        const layersWithPopups = [this.config.layerIds.atz.topVars, this.config.layerIds.digital_atz.digitalTopVars,
        this.config.layerIds.pcr.topVars, this.config.layerIds.wrap.topVars, this.config.layerIds.zip.topVars,
        this.config.layerIds.counties.boundaries, this.config.layerIds.dma.boundaries];
        this.mapView.map.allLayers.forEach((x: __esri.FeatureLayer) => {
            //console.log('title: ' + x.title + ' type: ' + x.type);
            if (x.type === 'feature') {
                if (this.mapFunction === mapFunctions.Popups) {
                    x.popupEnabled = (x.portalItem && layersWithPopups.some(layerDef => layerDef.id === x.portalItem.id)) || x.title === DefaultLayers.COMPETITORS || x.title === DefaultLayers.SITES;
                    //console.log(x.title + 'popupEnabled = ' + x.popupEnabled);
                } else {
                    x.popupEnabled = false;
                    //console.log(x.title + 'popupEnabled = ' + x.popupEnabled);
                }
            }
        });
    }

    private setupMapGroup(group: __esri.GroupLayer, layerDefinitions: LayerDefinition[]) {
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
        const groupContainsLayer = (layerDef) => (layer: __esri.FeatureLayer) => layer.portalItem && layer.portalItem.id === layerDef.id;
        //const currentLayer = (layerDef) => (layer: __esri.FeatureLayer) => curren = (layerDef => {EsriModules.Layer.fromPortalItem(<any>{portalItem: { id: layerDef.id}});

        // if (layerDefinitions.filter(i => i != null && i.id != null)){
        //     for (let i: number = 0; i < layerDefinitions.length; i++) {
        //         const popupTitle = layerDef.name + layerDef.popupTitleSuffix;


        // }

        layerDefinitions.filter(i => i != null && i.id != null).forEach(layerDef => {
            EsriModules.Layer.fromPortalItem(<any>{
                portalItem: {
                    id: layerDef.id
                }
            }).then((currentLayer: __esri.FeatureLayer) => {

                const popupTitle = layerDef.name + layerDef.popupTitleSuffix;
                const localPopUpFields = new Set(layerDef.popUpFields);
                currentLayer.visible = layerDef.defaultVisibility;
                currentLayer.title = layerDef.name;
                currentLayer.minScale = layerDef.minScale;

                if (layerDef.popUpFields.length > 0){
                currentLayer.popupTemplate = new EsriModules.PopupTemplate(<any>{ title: popupTitle, content: '{*}', actions: [selectThisAction, measureThisAction] });

                currentLayer.on('layerview-create', e => {
                    const localLayer = (e.layerView.layer as __esri.FeatureLayer);
                    localLayer.popupTemplate.fieldInfos = localLayer.fields.filter(f => {
                      return localPopUpFields.has(f.name);
                    }).map(f => {
                      return {fieldName: f.name, label: f.alias};
                    });
                    localLayer.popupTemplate.content = [{
                      type: 'fields'
                    }];
                  });
                } else {
                    currentLayer.popupEnabled = false;
                }
                // Add Layer to Group Layer if it does not already exist
                if (!group.layers.some(groupContainsLayer(layerDef))) {
                    group.add(currentLayer);
                }
            });
        });
        if (!this.map.layers.some(l => l === group)) {
            this.map.layers.add(group);
            MapService.layers.add(group);
        }
        group.visible = true;
    }

    public setMapLayers(analysisLevels: string[]) : void {
        console.log('fired setMapLayers() in MapService');
        // Remove ESRI Group Layer Sublayers (will be reloaded from checkboxes)
        MapService.DmaGroupLayer.visible = false;
        MapService.ZipGroupLayer.visible = false;
        MapService.AtzGroupLayer.visible = false;
        MapService.DigitalAtzGroupLayer.visible = false;
        MapService.PcrGroupLayer.visible = false;
        MapService.HHGroupLayer.visible = false;
        MapService.WrapGroupLayer.visible = false;
        MapService.CountyGroupLayer.visible = false;

        // Analysis Levels
        if (analysisLevels.length !== 0) {
            // Loop through each of the selected analysisLevels
            analysisLevels.forEach(analysisLevel => {
                switch (analysisLevel) {
                    case 'DMA':
                        this.setupMapGroup(MapService.DmaGroupLayer, Object.values(this.config.layerIds.dma));
                        break;
                    case 'ZIP':
                        this.setupMapGroup(MapService.ZipGroupLayer, Object.values(this.config.layerIds.zip));
                        break;
                    case 'ATZ':
                        this.setupMapGroup(MapService.AtzGroupLayer, Object.values(this.config.layerIds.atz));
                        break;
                    case 'DIG_ATZ':
                        this.setupMapGroup(MapService.DigitalAtzGroupLayer, Object.values(this.config.layerIds.digital_atz));
                        break;
                    case 'PCR':
                        this.setupMapGroup(MapService.PcrGroupLayer, Object.values(this.config.layerIds.pcr));
                        break;
                    case 'WRAP':
                        this.setupMapGroup(MapService.WrapGroupLayer, Object.values(this.config.layerIds.wrap));
                        break;
                    case 'HH':
                        //this.setupMapGroup(MapService.HHGroupLayer, Object.values(this.config.layerIds.hh));
                        break;
                    case 'COUNTY':
                        this.setupMapGroup(MapService.CountyGroupLayer, Object.values(this.config.layerIds.counties));
                        break;
                    default:
                        console.error(`MapService.setMapLayers encountered an unknown analysis level: ${analysisLevel}`);
                }
            }); // End forEach analysisLevels
        }
    }

    public async drawCircle(lat: number, lon: number, pointColor, miles: number, title: string, outlineColor, selector, parentId?: number) {
        // console.log('inside drawCircle' + lat + 'long::' + lon + 'color::' + pointColor + 'miles::' + miles + 'title::' + title);
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
            spatialReference: this.config.val_spatialReference
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
        //this.displayDBSpinner = false;
        // If a parentId was provided, set it as an attribute
        if (parentId != null)
            g.setAttribute('parentId', parentId);

        const graphicList: __esri.Graphic[] = [];
        graphicList.push(g);
        await this.updateFeatureLayer(graphicList, title);

        //await this.zoomOnMap(graphicList);
        return graphicList;
    }

    public async bufferMergeEach(pointColor, kms: number, title: string, outlneColor, selector, parentId?: number) {
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
        //const compList: __esri.Point[] = [];

        console.log('impGeofootprintLocList length:::' + this.impGeofootprintLocationService.get().length);

        for (const point of this.impGeofootprintLocationService.get()) {
            if (point.impClientLocationType.toString() == 'Site' && selector === 'Site') {
                const p = new Point({
                    x: point.xcoord,
                    y: point.ycoord,
                    spatialReference: this.config.val_spatialReference
                });
                pointList.push(p);
            } else if (point.impClientLocationType.toString() == 'Competitor' && selector === 'Competitor') { //set different colors for rings for competitors
                const p = new Point({
                    x: point.xcoord,
                    y: point.ycoord,
                    spatialReference: this.config.val_spatialReference
                });
                pointList.push(p);
            }
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
        this.displayDBSpinner = false;
        //await this.selectCentroid(graphicList);
        return graphicList;
    }

    public createFeatureLayer(graphics: __esri.Graphic[], layerName: string, layerHasPopup: boolean = false) {
        console.log('fired createFeatureLayer(' + layerName + ') in MapService');
        if (MapService.layerNames.has(layerName)) {
            console.log('layer name already exists');
            throw new Error('Layer name already exists, please use a different name');
        }
        MapService.layerNames.add(layerName);
        const featureRenderer = { type: 'simple' };

        const lyr = new EsriModules.FeatureLayer(<any>{
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
            //spatialReference: { wkid: 5070 },
            spatialReference: { wkid: this.config.val_spatialReference },
            source: graphics,
            popupEnabled: layerHasPopup,
            popupTemplate: '{*}',
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
                },
                query: {
                    supportsCentroid: false,
                    supportsDistance: true,
                    supportsDistinct: true,
                    supportsExtent: true,
                    supportsGeometryProperties: false,
                    supportsOrderBy: true,
                    supportsPagination: true,
                    supportsQuantization: true,
                    supportsQueryByOthers: true,
                    supportsResultType: true,
                    supportsSqlExpression: true,
                    supportsStandardizedQueriesOnly: true,
                    supportsStatistics: true
                }
            },
            advancedQueryCapabilities: {
                supportsAdvancedQueryRelated: true,
                supportsCountDistinct: true,
                supportsDistinct: true,
                supportsHavingClause: true,
                supportsOrderBy: true,
                supportsOutFieldSQLExpression: true,
                supportsPagination: true,
                supportsPaginationOnAggregatedQueries: true,
                supportsQueryRelatedPagination: true,
                supportsQueryWithDatumTransformation: true,
                supportsQueryWithDistance: true,
                supportsQueryWithResultType: true,
                supportsReturningGeometryCentroid: true,
                supportsReturningGeometryProperties: true,
                supportsReturningQueryExtent: true,
                supportsSqlExpression: true,
                supportsStatistics: true
            }
        });

        if (layerName.includes('Site') || layerName.includes('ZIP') || layerName.includes('ATZ') || layerName.includes('PCR')) {
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

    // public clearFeatureLayerAt(layerTitle: string, lat: number, lon: number) {
    //     // If there are no layers, there is nothing to do
    //     if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
    //         console.log('fired clearFeatureLayerAt() in MapService, but there were no feature layers to clear');
    //         return;
    //     }
    //     else
    //         console.log('fired clearFeatureLayerAt() in MapService');
    //
    //     let layerCleared: boolean = false;
    //
    //     // loop through the existing layers to see if we can find one to clear
    //     MapService.layers.forEach(currentLayer => {
    //         console.log('Skipping layer: ' + currentLayer.title);
    //         if (layerTitle === currentLayer.title) {
    //             console.log('Clearing layer: ' + layerTitle);
    //             const currLayer: __esri.FeatureLayer = (<__esri.FeatureLayer>currentLayer);
    //             const src: __esri.Collection<__esri.Graphic> = currLayer.source;
    //
    //             for (let i: number = 0; i < src.length; i++) {
    //                 console.log('Clearing graphic ' + i + ' / ' + src.length);
    //                 const graphic: __esri.Graphic = src.getItemAt(i);
    //                 const point: __esri.Point = (<__esri.Point>graphic.geometry);
    //                 console.log('long: ' + point.longitude + ', lat: ' + point.latitude + ' vs ' + lon + ', ' + lat);
    //                 if (point.latitude === lat && point.longitude === lon) {
    //                     console.log('found graphic at lat: ' + lat + ', lon: ' + lon);
    //                     src.remove(graphic);
    //                     layerCleared = true;
    //                     break;
    //                 }
    //             }
    //         }
    //     });
    //
    //     if (!layerCleared)
    //         console.log('Did not find layer: ' + layerTitle + ' to clear');
    // }

    // public clearAllFeatureLayersAt(lat: number, lon: number) {
    //     // If there are no layers, there is nothing to do
    //     if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
    //         console.log('fired clearAllFeatureLayersAt() in MapService, but there were no feature layers to clear');
    //         return;
    //     }
    //     else
    //         console.log('fired clearAllFeatureLayersAt() in MapService');
    //
    //     // loop through the existing layers to see if we can find one to clear
    //     MapService.layers.forEach(currentLayer => {
    //         console.log('Clearing layer: ' + currentLayer.title);
    //         this.clearFeatureLayerAt(currentLayer.title, lat, lon);
    //     });
    // }

    // public aproximatelyEqual(valueA: number, valueB: number, epsilon: number) {
    //     if (epsilon == null) {
    //         epsilon = 0.001;
    //     }
    //     return Math.abs(valueA - valueB) < epsilon;
    // }

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

    // public setGraphicAttribute(graphic: __esri.Graphic, name: string, value: any) {
    //     graphic.setAttribute(name, value);
    // }

    public updateFeatureLayer(graphics: __esri.Graphic[], layerTitle: string, showPopup: boolean = false) {
        // console.log('fired updateFeatureList() in MapService');
        // check to see if this is the first layer being added
        if (MapService.layers.size === 0 && MapService.layerNames.size === 0) {
            this.createFeatureLayer(graphics, layerTitle, showPopup);
            return;
        }

        let layerUpdated: boolean = false;

        // loop through the existing layers to see if we can find one to update, otherwise create a new one
        //this.mapView.map.allLayers
        MapService.layers.forEach(currentLayer => {
            if (layerTitle === currentLayer.title) {
                // console.log('updating existing layer with ' + graphics.length + ' graphics');
                // add the new graphics to the existing layer
                for (const graphic of graphics) {
                    (<__esri.FeatureLayer>currentLayer).source.add(graphic);
                }
                layerUpdated = true;
            }
        });
        if (!layerUpdated) {
            console.log('FeatureLayer requested for update does not exist, creating: ' + layerTitle);
            this.createFeatureLayer(graphics, layerTitle, showPopup);
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

        // Red Wings color
        // color.r = 175;
        // color.g = 0;
        // color.b = 0;

        // set up the first required piece, a symbol
        const symbolProps: __esri.SimpleMarkerSymbolProperties = {
            //    style: 'circle',
            style: 'path',
            size: 12, // Star Size
            //          size: 30, // Red Wings Size
            color: color,
            // Star path
            path: 'M 240.000 260.000 L 263.511 272.361 L 259.021 246.180 L 278.042 227.639 L 251.756 223.820 L 240.000 200.000 L 228.244 223.820 L 201.958 227.639 L 220.979 246.180 L 216.489 272.361 L 240.000 260.000'

            /*          // Red Wings Logo Path
                        path: 'M2820 2217 c-14 -8 -54 -36 -88 -64 -108 -87 -291 -172 -446 -208 -180 -42 -256 ' +
                              '-48 -581 -50 -293 -1 -326 -3 -396 -22 -151 -42 -290 -132 -373 -240 l-38 -50 -106 ' +
                              ' -6 c-140 -8 -214 -28 -347 -92 -209 -101 -359 -281 -421 -506 -25 -89 -25 -299 0 ' +
                              '-389 114 -424 559 -673 1002 -560 205 52 386 181 489 349 35 56 38 59 85 64 68 8 130 ' +
                              '42 143 78 9 22 18 29 37 29 14 0 57 9 95 19 71 20 125 62 125 96 0 8 10 17 23 19 114 ' +
                              '22 149 32 198 57 69 35 123 92 116 126 -4 20 5 28 67 61 96 50 156 108 156 150 0 28 7 ' +
                              '37 57 69 110 70 188 158 181 206 -2 17 10 34 41 62 55 50 101 120 101 155 0 28 -23 55 ' +
                              '-52 61 -14 3 -12 12 18 59 58 92 77 154 78 251 1 72 -2 90 -18 108 -11 12 -27 21 -38 21 ' +
                              '-16 0 -18 9 -18 68 0 90 -25 113 -90 79z m-29 -172 c-40 -114 -124 -226 -229 -306 l-67 ' +
                              '-52 39 8 c81 14 174 72 277 172 108 105 108 104 84 -10 -20 -97 -68 -179 -163 -279 l-83 ' +
                              '-87 62 -3 63 -3 -51 -51 c-28 -28 -83 -71 -122 -95 -39 -24 -71 -47 -71 -51 0 -5 22 -8 49 ' +
                              '-8 28 0 52 -4 55 -9 15 -23 -142 -134 -256 -181 -32 -13 -58 -27 -58 -31 0 -4 15 -12 33 -19 ' +
                              'l32 -11 -25 -21 c-37 -31 -176 -94 -250 -113 -36 -9 -66 -18 -68 -19 -1 -2 16 -15 38 -30 22 ' +
                              '-14 40 -30 40 -35 0 -13 -99 -41 -185 -52 -44 -6 -102 -13 -128 -17 l-49 -7 41 -30 c22 -16 43 ' +
                              '-35 45 -42 7 -18 -53 -32 -161 -40 l-92 -6 14 -28 c18 -34 12 -39 -62 -46 -49 -5 -58 -10 -72 -36 ' +
                              '-88 -163 -188 -266 -324 -332 -111 -53 -212 -75 -345 -75 -335 0 -621 227 -686 543 -42 202 6 407 131 ' +
                              '562 138 171 363 275 595 275 l98 0 21 43 c30 58 141 164 218 209 117 68 264 88 632 87 370 0 550 29 ' +
                              '744 120 80 38 178 106 225 156 32 34 35 20 11 -50z ' +
                              'M2675 1975 c-183 -142 -400 -195 -792 -195 -179 0 -427 -17 -518 -35 -110 -23 -222 -83 -292 -159 ' +
                              '-33 -35 -65 -77 -71 -94 -10 -28 -8 -31 19 -42 16 -7 31 -11 32 -9 77 124 149 186 255 219 95 30 274 ' +
                              '50 440 50 217 1 476 16 567 35 85 17 197 65 267 113 48 33 145 127 159 154 13 24 14 25 -66 -37z ' +
                              'M2787 1785 c-27 -25 -86 -63 -130 -85 -146 -72 -306 -92 -712 -89 -159 1 -321 1 -360 0 -205 -6 ' +
                              '-396 -118 -481 -281 -27 -51 -29 -63 -30 -180 -1 -137 -11 -185 -56 -273 -16 -33 -27 -61 -24 -64 ' +
                              '2 -3 23 14 45 37 52 54 79 128 91 249 5 53 15 114 21 136 24 86 124 202 213 247 100 51 98 51 521 58 ' +
                              '435 8 493 14 648 70 126 47 255 131 290 189 10 17 17 31 15 31 -2 -1 -25 -21 -51 -45z ' +
                              'M2790 1740 c-36 -36 -86 -76 -112 -88 -25 -13 -49 -29 -52 -37 -3 -8 ' +
                              '-14 -15 -24 -15 -10 0 -37 -9 -60 -20 -22 -11 -59 -20 -80 -20 -22 0 -45 -6 ' +
                              '-51 -14 -6 -8 -36 -17 -66 -21 -30 -3 -57 -11 -61 -16 -3 -5 -21 -7 -40 -3 ' +
                              '-24 4 -40 2 -52 -9 -9 -8 -26 -17 -37 -19 -11 -2 -19 -9 -18 -15 2 -11 -73 ' +
                              '-34 -109 -34 -10 0 -20 -4 -23 -10 -4 -5 0 -9 8 -9 8 0 29 -7 47 -16 29 -15 ' +
                              '44 -15 133 -5 199 24 380 103 514 222 82 74 138 138 149 171 3 11 4 20 2 21 ' +
                              '-1 1 -32 -27 -68 -63z ' +
                              'M2020 1503 c-8 -2 -22 -7 -30 -10 -22 -9 -64 -12 -175 -13 -55 0 ' +
                              '-106 -4 -113 -9 -21 -13 48 -51 91 -51 87 0 276 51 285 78 4 12 -28 15 -58 5z ' +
                              'M1515 1473 c-16 -2 -39 -8 -50 -13 -11 -5 -33 -14 -49 -20 -16 -6 ' +
                              '-26 -13 -22 -17 3 -3 -4 -11 -16 -17 -13 -6 -24 -19 -26 -29 -3 -14 4 -17 42 ' +
                              '-17 82 0 276 52 276 74 0 3 -18 15 -40 26 -38 19 -53 21 -115 13z ' +
                              'M2605 1445 c-22 -8 -52 -14 -67 -14 -18 -1 -28 -6 -28 -16 0 -10 -11 ' +
                              '-15 -35 -15 -19 0 -35 -4 -35 -10 0 -5 -22 -10 -49 -10 -28 0 -52 -4 -55 -9 ' +
                              '-3 -4 -40 -14 -83 -21 -43 -7 -82 -16 -88 -20 -5 -4 -33 -10 -62 -12 -29 -3 ' +
                              '-59 -12 -68 -21 -9 -10 -29 -17 -45 -17 -16 0 -32 -4 -35 -10 -3 -6 4 -10 18 ' +
                              '-10 13 0 32 -9 43 -21 17 -19 26 -21 99 -14 126 10 232 34 322 70 84 34 241 ' +
                              '123 263 150 11 13 8 15 -21 14 -19 -1 -52 -7 -74 -14z ' +
                              'M680 1415 c-110 -24 -256 -104 -336 -182 -71 -69 -126 -141 -144 ' +
                              '-187 -7 -20 -6 -24 5 -19 11 4 15 -3 16 -23 l1 -29 10 30 c30 84 165 234 262 ' +
                              '290 157 92 369 115 529 59 38 -14 43 -13 54 3 16 21 10 25 -72 47 -87 24 -246 ' +
                              '29 -325 11z ' +
                              'M1687 1403 c-16 -3 -31 -11 -34 -19 -3 -8 -17 -14 -32 -14 -15 0 -31 ' +
                              '-4 -36 -9 -6 -5 -26 -11 -45 -13 -30 -3 -32 -5 -15 -12 11 -5 32 -20 47 -34 ' +
                              '26 -24 29 -25 165 -20 130 5 276 29 297 49 11 10 -65 46 -139 65 -47 13 -146 ' +
                              '16 -208 7z ' +
                              'M1298 1319 c-21 -11 -38 -25 -38 -33 0 -7 -9 -21 -20 -31 -11 -10 ' +
                              '-18 -20 -15 -23 3 -3 0 -11 -6 -19 -9 -10 -4 -13 29 -13 79 0 292 50 292 69 0 ' +
                              '13 -92 51 -149 61 -29 6 -54 10 -55 10 0 -1 -18 -10 -38 -21z ' +
                              'M740 1250 c-115 -21 -243 -95 -303 -173 -42 -55 -84 -154 -97 -226 ' +
                              '-42 -237 142 -478 400 -521 159 -27 346 39 444 157 29 35 28 47 -4 56 -13 3 ' +
                              '-24 -1 -30 -13 -14 -26 -125 -103 -180 -124 -69 -28 -187 -32 -265 -11 -210 ' +
                              '56 -344 259 -306 461 16 89 42 137 110 204 131 129 292 168 461 109 30 -10 56 ' +
                              '-19 58 -19 2 0 2 15 0 33 -3 29 -8 34 -56 49 -63 22 -171 30 -232 18z ' +
                              'M1582 1243 c-18 -3 -36 -11 -39 -19 -3 -8 -18 -14 -33 -14 -16 0 -32 ' +
                              '-4 -35 -10 -3 -5 -1 -10 4 -10 6 0 11 -7 11 -15 0 -8 6 -15 14 -15 7 0 19 -6 ' +
                              '25 -14 20 -24 148 -31 229 -12 38 9 83 22 99 30 15 8 40 20 56 27 15 7 27 16 ' +
                              '27 19 0 4 -26 15 -58 24 -55 15 -210 20 -300 9z ' +
                              'M2417 1237 c-38 -7 -65 -15 -61 -19 7 -8 -47 -13 -97 -9 -17 1 -29 ' +
                              '-4 -33 -15 -5 -14 -15 -15 -56 -10 -39 5 -52 4 -56 -8 -4 -10 -15 -13 -39 -9 ' +
                              '-44 7 -161 -15 -176 -33 -6 -8 -26 -14 -43 -15 -17 0 -40 -4 -51 -8 -18 -7 ' +
                              '-15 -11 22 -29 23 -12 44 -26 48 -32 16 -26 284 0 420 41 114 34 283 125 265 ' +
                              '142 -12 13 -81 14 -143 4z ' +
                              'M1212 1159 c-12 -12 -22 -31 -22 -40 0 -10 -4 -20 -9 -23 -5 -3 -7 ' +
                              '-15 -4 -26 4 -16 14 -20 48 -20 51 0 173 23 230 43 l39 14 -29 19 c-43 28 -92 ' +
                              '43 -166 50 -60 6 -68 5 -87 -17z ' +
                              'M737 1153 c-4 -3 -7 -34 -7 -68 l0 -62 76 1 75 1 -6 45 c-13 93 -11 ' +
                              '90 -74 90 -32 0 -61 -3 -64 -7z ' +
                              'M1505 1078 c-43 -36 -69 -48 -107 -48 -31 -1 -32 -2 -12 -13 12 -7 ' +
                              '19 -17 17 -23 -2 -5 13 -18 33 -27 31 -15 47 -16 120 -7 91 11 227 50 259 74 ' +
                              '18 13 14 15 -50 35 -39 12 -106 25 -150 28 -75 5 -82 4 -110 -19z ' +
                              'M520 1024 c-23 -25 -40 -50 -38 -56 3 -7 26 -30 52 -52 46 -39 49 ' +
                              '-40 60 -22 6 11 26 36 44 57 19 21 31 42 28 47 -3 4 -27 22 -55 39 l-50 31 ' +
                              '-41 -44z ' +
                              'M1165 1027 c-2 -7 -13 -36 -24 -64 l-19 -53 48 0 c51 0 180 35 180 ' +
                              '49 0 9 -121 65 -158 74 -13 3 -25 0 -27 -6z ' +
                              'M2205 1019 c-22 -4 -63 -9 -92 -10 -34 -1 -54 -6 -57 -16 -3 -8 -10 ' +
                              '-12 -14 -9 -5 3 -54 10 -110 15 -104 11 -117 9 -162 -25 -8 -7 -42 -19 -75 ' +
                              '-29 -56 -16 -58 -18 -35 -28 14 -5 102 -10 195 -11 150 -1 180 2 250 22 89 26 ' +
                              '195 71 195 82 0 19 -32 22 -95 9z ' +
                              'M1364 915 c-10 -8 -35 -15 -54 -15 -20 0 -41 -5 -47 -11 -7 -7 -44 ' +
                              '-11 -91 -11 -61 1 -81 -2 -86 -13 -7 -18 -1 -21 70 -40 110 -28 270 -13 365 ' +
                              '35 22 12 37 25 34 30 -8 13 -102 40 -140 40 -17 0 -40 -7 -51 -15z ' +
                              'M1591 864 c-24 -13 -49 -24 -57 -24 -8 0 -14 -4 -14 -9 0 -17 136 ' +
                              '-44 245 -49 98 -4 242 9 267 24 20 13 -16 34 -58 34 -23 0 -54 4 -68 10 -14 5 ' +
                              '-27 6 -30 1 -5 -8 -144 11 -163 22 -30 18 -81 15 -122 -9z ' +
                              'M769 841 c-43 -43 -38 -91 12 -116 15 -8 35 -15 44 -15 24 0 75 55 ' +
                              '75 80 0 28 -52 80 -80 80 -12 0 -35 -13 -51 -29z ' +
                              'M1050 821 c0 -18 147 -132 220 -170 73 -38 209 -81 258 -81 37 0 23 ' +
                              '31 -20 46 -21 7 -53 25 -72 39 -20 15 -36 21 -38 15 -2 -7 -14 -3 -31 10 -15 ' +
                              '12 -31 18 -37 15 -6 -4 -36 16 -67 44 -39 35 -63 49 -75 45 -10 -3 -43 6 -74 ' +
                              '20 -64 29 -64 29 -64 17z ' +
                              'M490 807 c-63 -14 -71 -30 -50 -100 l11 -38 67 3 c61 3 67 5 64 23 ' +
                              '-2 11 -6 44 -9 73 -3 29 -10 52 -17 51 -6 0 -36 -6 -66 -12z ' +
                              'M301 799 c0 -8 -8 -24 -16 -35 -15 -19 -15 -19 -30 0 -10 14 -18 16 ' +
                              '-27 8 -17 -14 -50 -18 -65 -9 -18 11 -7 -68 24 -165 29 -96 103 -209 181 -278 ' +
                              '70 -62 208 -135 293 -155 35 -8 107 -15 159 -15 177 0 329 61 455 184 64 62 ' +
                              '165 199 165 223 0 7 -141 55 -147 49 -2 -2 24 -44 53 -84 16 -21 16 -22 -12 ' +
                              '-22 -16 0 -43 4 -61 9 -29 8 -34 6 -62 -29 -39 -48 -154 -125 -228 -153 -85 ' +
                              '-31 -243 -30 -337 2 -189 65 -313 221 -336 426 -4 33 -8 53 -9 44z ' +
                              'M1355 786 c-38 -6 -69 -15 -69 -21 2 -17 162 -76 243 -91 101 -18 ' +
                              '231 -19 231 -1 0 16 -57 50 -69 42 -5 -3 -13 0 -16 6 -4 6 -18 8 -31 5 -16 -4 ' +
                              '-42 3 -75 19 -28 15 -57 24 -64 21 -7 -2 -27 4 -44 15 -17 10 -32 18 -34 18 ' +
                              '-1 -1 -33 -6 -72 -13z ' +
                              'M980 771 c-18 -34 -11 -48 46 -100 87 -77 264 -162 264 -126 0 14 ' +
                              '-65 67 -73 59 -3 -3 -15 9 -27 25 -12 17 -27 31 -34 31 -7 0 -23 11 -36 25 ' +
                              '-13 14 -29 25 -37 25 -7 0 -13 4 -13 8 0 15 -53 72 -66 72 -7 0 -18 -9 -24 ' +
                              '-19z ' +
                              'M580 586 c-16 -25 -30 -51 -30 -59 0 -17 38 -53 69 -65 22 -8 30 -3 ' +
                              '69 41 l44 50 -33 18 c-19 9 -43 26 -53 38 -11 12 -23 21 -27 21 -4 0 -22 -20 ' +
                              '-39 -44z ' +
                              'M885 554 c-22 -7 -55 -13 -74 -13 -29 -1 -33 -4 -28 -23 3 -13 9 -40 ' +
                              '13 -61 8 -46 19 -52 82 -40 l47 8 9 64 c4 34 4 66 0 70 -5 4 -27 2 -49 -5z '*/
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
        if (popupTemplate != null) {
            graphicProps.popupTemplate = popupTemplate;
        }
        const graphic: __esri.Graphic = new Graphic(graphicProps);

        //        console.log('Graphic parentId: ' + parentId);
        if (parentId != null) {
            //            console.log('Set parentId: ' + parentId);
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
                wkid: this.config.val_spatialReference
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
        this.displayDBSpinner = true;
        this.displaySpinnerMessage = 'Displaying Selections ...';
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

        let layer: __esri.FeatureLayer;
        const discoveryUI: ImpDiscoveryUI[] = this.impDiscoveryService.get();
        console.log('discovery UI Details:::', discoveryUI[0].analysisLevel);
        for (const lyr of fLyrList) {
            if (lyr.portalItem != null) {

                if (discoveryUI[0].analysisLevel === 'ATZ' &&
                    lyr.portalItem.id === this.config.layerIds.atz.centroids.id) {
                    layer = lyr;
                }
                if (discoveryUI[0].analysisLevel === 'ZIP' &&
                    lyr.portalItem.id === this.config.layerIds.zip.centroids.id) {
                    layer = lyr;
                }
                if (discoveryUI[0].analysisLevel === 'Digital ATZ' &&
                    lyr.portalItem.id === this.config.layerIds.digital_atz.digitalCentroids.id) {
                    layer = lyr;
                }
                if (discoveryUI[0].analysisLevel === 'PCR' &&
                    lyr.portalItem.id === this.config.layerIds.pcr.centroids.id) {
                    layer = lyr;
                }
            }
        }

        if (layer != null && layer.portalItem != null) {
            let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();
            await layer.load().then((f1: __esri.FeatureLayer) => {
                loadedFeatureLayer = f1;
            });
            //console.log('test:::', centroidGraphics);
            for (const graphic of graphicList) {
                const qry = layer.createQuery();
                qry.geometry = graphic.geometry;
                qry.outSpatialReference = this.mapView.spatialReference;
                await layer.queryFeatures(qry).then(featureSet => {
                    for (let i = 0; i < featureSet.features.length; i++) {
                        const owner_group_primary: string = ValLayerService.getAttributeValue(featureSet.features[i].attributes, 'owner_group_primary');
                        const cover_frequency: string = ValLayerService.getAttributeValue(featureSet.features[i].attributes, 'cov_frequency');
                        const is_pob: any = featureSet.features[i].attributes['is_pob_only'];
                            if (discoveryUI[0].includePob === true){
                                if (is_pob === 1 || is_pob === 0) {

                                if (((owner_group_primary != undefined && owner_group_primary.toUpperCase() === 'VALASSIS' && discoveryUI[0].includeNonWeekly) === true) ||
                                ((owner_group_primary != undefined && owner_group_primary.toUpperCase() === 'ANNE' && discoveryUI[0].includeAnne) === true) ||
                                (((cover_frequency === undefined || cover_frequency === null && discoveryUI[0].includeSolo === true) || (cover_frequency.toUpperCase() === 'SOLO' && discoveryUI[0].includeSolo) === true))) {

                                centroidGraphics.push(featureSet.features[i]);
                                }
                            }
                        }else{
                            if (is_pob === 0) {
                                if (((owner_group_primary != undefined && owner_group_primary.toUpperCase() === 'VALASSIS' && discoveryUI[0].includeNonWeekly) === true) ||
                                ((owner_group_primary != undefined && owner_group_primary.toUpperCase() === 'ANNE' && discoveryUI[0].includeAnne) === true) ||
                                (((cover_frequency === undefined || cover_frequency === null && discoveryUI[0].includeSolo === true) || (cover_frequency.toUpperCase() === 'SOLO' && discoveryUI[0].includeSolo) === true))) {

                                centroidGraphics.push(featureSet.features[i]);
                                }
                            }
                        }
                    //}
                    }
                });
            }
            await this.selectPoly(centroidGraphics);
        }
    }

    // public async queryByAttr(layerView: __esri.FeatureLayerView, key: string, value: any) {
    //     console.log('queryByAttr fired view: ', layerView, 'key: ' + key + ', value: ' + value);
    //     let results: Array<__esri.Graphic>;
    //
    //     return layerView.queryFeatures().then(qryResults => {
    //         console.log('queryFeatures returned: ', qryResults);
    //         console.log('queryResults filtered: ', qryResults.filter(graphic => graphic.attributes && graphic.attributes[key] === value));
    //         results = qryResults.filter(graphic => graphic.attributes && graphic.attributes[key] === value);
    //     });
    // }

    public getDistanceBetween(x1: number, y1: number, x2: number, y2: number) : number {
        // Construct a polyline to get the geodesic distance between geo and site
        const polyLine: __esri.Polyline = new EsriModules.PolyLine({ paths: [[[x1, y1], [x2, y2]]] });
        const dist: number = EsriModules.geometryEngine.geodesicLength(polyLine, 'miles');

        return dist;
    }

    public async selectPoly(centroidGraphics: __esri.Graphic[]) {
        console.log('fired selectPoly');

        const loader = EsriLoaderWrapperService.esriLoader;
        const [FeatureLayer, array, geometryEngine, Graphic, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color, Point]
            = await loader.loadModules([
                'esri/layers/FeatureLayer',
                'dojo/_base/array',
                'esri/geometry/geometryEngine',
                'esri/Graphic',
                'esri/symbols/SimpleFillSymbol',
                'esri/symbols/SimpleLineSymbol',
                'esri/symbols/SimpleMarkerSymbol',
                'esri/Color',
                'esri/geometry/Point',
                'dojo/domReady!'
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

        const selectedGraphics: __esri.Graphic[] = [];

        // Collect the selected geographies for pushing to the ImpGeofootpringGeo data store
        let impGeofootprintGeos: ImpGeofootprintGeo[] = [];
//        let impGeofootprintGeos: Array<ImpGeofootprintGeo> = [];

        for (const centroidGraphic of centroidGraphics) {
            const pt: __esri.Point = <__esri.Point>centroidGraphic.geometry;
            impGeofootprintGeos.push(new ImpGeofootprintGeo({
                geocode: ValLayerService.getAttributeValue(centroidGraphic.attributes, 'geocode'),
                xCoord: pt.longitude,
                yCoord: pt.latitude
            }));
        }
        // Update the ImpGeofootprintGeos data store
        this.impGeofootprintGeoService.clearAll();
        this.impGeofootprintGeoService.add(impGeofootprintGeos);

        // Also clear the geo attribute data store
        this.impGeofootprintGeoAttribService.clearAll();

        let layer: __esri.FeatureLayer;
        const discoveryUI: ImpDiscoveryUI[] = this.impDiscoveryService.get();
        for (const lyr of fLyrList) {
            if (lyr.portalItem != null) {

                if (discoveryUI[0].analysisLevel === 'ATZ' &&
                    lyr.portalItem.id === this.config.layerIds.atz.topVars.id) {
                    layer = lyr;
                }
                if (discoveryUI[0].analysisLevel === 'ZIP' &&
                    lyr.portalItem.id === this.config.layerIds.zip.topVars.id) {
                    layer = lyr;
                }
                if (discoveryUI[0].analysisLevel === 'Digital ATZ' &&
                    lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id) {
                    layer = lyr;
                }
                if (discoveryUI[0].analysisLevel === 'PCR' &&
                    lyr.portalItem.id === this.config.layerIds.pcr.topVars.id) {
                    layer = lyr;
                }
            }
        }


        //  for (const lyr of fLyrList) {
        if (layer.portalItem != null) {
            let layername = null;
            if (layer.portalItem.id === this.config.layerIds.zip.topVars.id)
                layername = 'Selected Geography - ZIP';
            else if (layer.portalItem.id === this.config.layerIds.atz.topVars.id)
                layername = 'Selected Geography - ATZ';
            else if (layer.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id)
                layername = 'Selected Geography - Digital ATZ';
            else if (layer.portalItem.id === this.config.layerIds.pcr.topVars.id)
                layername = 'Selected Geography - PCR';
            const polyGraphics: __esri.Graphic[] = new Array<__esri.Graphic>();
            let loadedFeatureLayer: __esri.FeatureLayer = new FeatureLayer();

            await layer.load().then((f1: __esri.FeatureLayer) => {
                loadedFeatureLayer = f1;
            });

            await this.removeSubLayer('Selected Geography - ZIP', MapService.SitesGroupLayer);
            await this.removeSubLayer('Selected Geography - ATZ', MapService.SitesGroupLayer);
            await this.removeSubLayer('Selected Geography - Digital ATZ', MapService.SitesGroupLayer);
            // MapService.selectedCentroidObjectIds = [];
            let metricUpdateCount = 0;
            let p = 0;
            MapService.hhDetails = 0;
            MapService.hhIpAddress = 0;
            MapService.medianHHIncome = '0';
            MapService.hhChildren = 0;
            MapService.totInvestment = 0;
            MapService.proBudget = 0;
            MapService.t = 0;
            MapService.circBudget = 0;
            this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
            this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());
            this.metricService.add('CAMPAIGN', 'Total Investment', MapService.totInvestment.toString());
            this.metricService.add('CAMPAIGN', 'Progress to Budget', MapService.proBudget.toString());


            await array.forEach(centroidGraphics, (centroidGraphic) => {
                const qry1 = loadedFeatureLayer.createQuery();
                p++;
                qry1.geometry = centroidGraphic.geometry;
                qry1.outSpatialReference = this.mapView.spatialReference;

                loadedFeatureLayer.queryFeatures(qry1).then(polyFeatureSet => {
                    //const t0 = performance.now();
                    const geoAttribsToAdd: ImpGeofootprintGeoAttrib[] = [];
                    for (let i = 0; i < polyFeatureSet.features.length; i++) {
                        const currentAttribute = polyFeatureSet.features[i].attributes;
                        metricUpdateCount++;
                        //console.log('CurrentAttribute', currentAttribute);
                        if (MapService.selectedCentroidObjectIds.length < 0 || !MapService.selectedCentroidObjectIds.includes(ValLayerService.getAttributeValue(currentAttribute, 'objectid'))) {

                            //Create a new geo attribute to store the Median Household Income
                            geoAttribsToAdd.push(this.createGeoAttrib('cl2i00', currentAttribute, impGeofootprintGeos));

                            //Create a new geo attribute to store the % '17 HHs Families with Related Children < 18 Yrs
                            geoAttribsToAdd.push(this.createGeoAttrib('cl0c00', currentAttribute, impGeofootprintGeos));

                            //Create a new geo attribute to store % '17 Pop Hispanic or Latino
                            geoAttribsToAdd.push(this.createGeoAttrib('cl2prh', currentAttribute, impGeofootprintGeos));

                            //Create a new geo attribute to store Casual Dining: 10+ Times Past 30 Days
                            geoAttribsToAdd.push(this.createGeoAttrib('tap049', currentAttribute, impGeofootprintGeos));

                            if (ValLayerService.getAttributeValue(currentAttribute, 'num_ip_addrs') != null) {
                                MapService.hhIpAddress = MapService.hhIpAddress + ValLayerService.getAttributeValue(currentAttribute, 'num_ip_addrs');
                            }
                            //                              MapService.medianHHIncome = parseFloat(EsriLayerService.getAttributeValue(currentAttribute, 'cl2i0o')).toFixed(2) + '%';

                            if (ValLayerService.getAttributeValue(currentAttribute, 'cl2i00') != null) {
                                MapService.medianHHIncome = '$' + ValLayerService.getAttributeValue(currentAttribute, 'cl2i00');
                            }
                            if (discoveryUI[0].selectedSeason == 'WINTER' && ValLayerService.getAttributeValue(currentAttribute, 'hhld_w') != undefined ) {
                                MapService.hhDetails = MapService.hhDetails + ValLayerService.getAttributeValue(currentAttribute, 'hhld_w');
                                const geos = impGeofootprintGeos.filter(f => f.geocode === ValLayerService.getAttributeValue(currentAttribute, 'geocode'));
                                //const newGeo = Array.from(geos.slice(0, 1));
                                geos[0].hhc = ValLayerService.getAttributeValue(currentAttribute, 'hhld_w');
                                //this.impGeofootprintGeoService.update(geos[0], newGeo[0]);
                            } else if (discoveryUI[0].selectedSeason == 'SUMMER' && ValLayerService.getAttributeValue(currentAttribute, 'hhld_s') != undefined ) {
                                MapService.hhDetails = MapService.hhDetails + ValLayerService.getAttributeValue(currentAttribute, 'hhld_s');
                                const geos = impGeofootprintGeos.filter(f => f.geocode === ValLayerService.getAttributeValue(currentAttribute, 'geocode'));
                                //const newGeo = Array.from(geos.slice(0, 1));
                                geos[0].hhc = ValLayerService.getAttributeValue(currentAttribute, 'hhld_s');
                                //this.impGeofootprintGeoService.update(geos[0], newGeo[0]);
                            }
                        }
                        if (discoveryUI[0].cpm != null) {
                            MapService.t = discoveryUI[0].cpm * (MapService.hhDetails / 1000);
                            MapService.totInvestment = Math.round(MapService.t);
                        }

                        if (discoveryUI[0].circBudget != null && discoveryUI[0].circBudget != 0 && (discoveryUI[0].totalBudget == 0 || discoveryUI[0].totalBudget == null)) {
                            MapService.circBudget = (MapService.hhDetails / discoveryUI[0].circBudget) * 100;
                            MapService.proBudget = Math.round(MapService.circBudget);
                            console.log('progress to budget for circ::', MapService.circBudget);
                        }
                        if (discoveryUI[0].totalBudget != null && discoveryUI[0].totalBudget != 0 && (discoveryUI[0].circBudget == 0 || discoveryUI[0].circBudget == null)) {
                            MapService.dollarBudget = (Math.round(MapService.t) / discoveryUI[0].totalBudget) * 100;
                            MapService.proBudget = Math.round(MapService.dollarBudget);
                            console.log('progress to budget for dollar:::', MapService.proBudget);
                        }
                        if (discoveryUI[0].circBudget != null && discoveryUI[0].totalBudget != null && discoveryUI[0].circBudget != 0 && discoveryUI[0].totalBudget != 0) {
                            // if both Circ Budget and dollar budget were provided, calculate based on the dollar budget
                            MapService.dollarBudget = (Math.round(MapService.t) / discoveryUI[0].totalBudget) * 100;
                            MapService.proBudget = Math.round(MapService.dollarBudget);
                            console.log('return Progress to budget for dollar :::', MapService.dollarBudget);
                        }


                        //MapService.medianHHIncome = parseFloat(EsriLayerService.getAttributeValue(currentAttribute, 'cl2i0o')).toFixed(2) + '%';
                        MapService.medianHHIncome = '$' + ValLayerService.getAttributeValue(currentAttribute, 'cl2i00');
                        MapService.hhChildren = ValLayerService.getAttributeValue(currentAttribute, 'cl0c00');
                        polyGraphics.push(new Graphic(polyFeatureSet.features[i].geometry, symbol123, currentAttribute));
                        MapService.selectedCentroidObjectIds.push(ValLayerService.getAttributeValue(currentAttribute, 'objectid'));
                    }
                    this.impGeofootprintGeoAttribService.add(geoAttribsToAdd.filter(a => a != null));

                    //this.mapView.graphics.addMany(polyGraphics);
                    this.updateFeatureLayer(polyGraphics, layername);
                    this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    if (discoveryUI[0].cpm == null) {
                        this.metricService.add('CAMPAIGN', 'Total Investment', 'N/A');
                    } else {
                        this.metricService.add('CAMPAIGN', 'Total Investment', '$' + MapService.totInvestment.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

                    }
                    if ((discoveryUI[0].circBudget == null && discoveryUI[0].totalBudget == null) || (discoveryUI[0].circBudget == 0 && discoveryUI[0].totalBudget == 0) || (discoveryUI[0].cpm == 0 && discoveryUI[0].cpm == null)) {
                        this.metricService.add('CAMPAIGN', 'Progress to Budget', 'N/A');
                    } else {
                        // if ((discoveryUI[0].circBudget != null && discoveryUI[0].totalBudget != null) || (discoveryUI[0].circBudget != 0 && discoveryUI[0].totalBudget != 0)) {
                        this.metricService.add('CAMPAIGN', 'Progress to Budget', MapService.proBudget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%');

                        //}
                    }
                    if (metricUpdateCount == p){
                        this.displayDBSpinner = false;
                    }
                    // console.log('metricUpdateCount', metricUpdateCount, 'p', p);
                    // console.log('MapService.hhDetails', MapService.hhDetails);
                });
            });
            //this.displayDBSpinner = false;
        }
        // }
    }


    /**
     * Create a new ImpGeofootprintGeoAttrib and add it to the data store
     * @param searchAttribute the attribute to search for
     * @param allAttributes the entire list of attributes returned by a map query operation
     * @param selectedGeos the list of geos that will become the parent objects to these new attributes
     */
    private createGeoAttrib(searchAttribute: string, allAttributes: any, selectedGeos: ImpGeofootprintGeo[]) : ImpGeofootprintGeoAttrib {
        const geoAttrib: ImpGeofootprintGeoAttrib = new ImpGeofootprintGeoAttrib();
        if (ValLayerService.getAttributeValue(allAttributes, searchAttribute) != null) {
            geoAttrib.attributeCode = searchAttribute;
            geoAttrib.attributeType = 'number';
            geoAttrib.attributeValue = ValLayerService.getAttributeValue(allAttributes, searchAttribute);
            const geos = selectedGeos.filter(f => f.geocode === ValLayerService.getAttributeValue(allAttributes, 'geocode'));
            if (geos.length === 1) {
                geoAttrib.impGeofootprintGeo = geos[0];
                return geoAttrib;
            }
        }
        return null;
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

    public selectSinglePolygon(evt: __esri.MapViewClickEvent, preSelectedGeo?: __esri.Geometry, preSelectedObjectId?: number) {
        console.log('fired selectSinglePolygon');
        const symbol = new EsriModules.SimpleFillSymbol({
            style: 'solid',
            color: new EsriModules.Color([0, 255, 0, 0.10]),
            outline: new EsriModules.SimpleLineSymbol({
                style: 'solid',
                color: new EsriModules.Color([0, 255, 0, 0.65])
            })
        });
        // todo - this might be fragile
        const currentSelectedAnalysisLevel = this.impDiscoveryService.get()[0].analysisLevel;
        const featureLayers: __esri.FeatureLayer[] = this._getAllFeatureLayers().filter(l => {
            switch (currentSelectedAnalysisLevel) {
                case 'Digital ATZ':
                    return l.portalItem != null && l.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id;
                case 'ATZ':
                    return l.portalItem != null && l.portalItem.id === this.config.layerIds.atz.topVars.id;
                case 'ZIP':
                    return l.portalItem != null && l.portalItem.id === this.config.layerIds.zip.topVars.id;
                case 'PCR':
                    return l.portalItem != null && l.portalItem.id === this.config.layerIds.pcr.topVars.id;
                default:
                    console.error(`MapService.selectSinglePoly - Unknown Analysis Level selected: ${currentSelectedAnalysisLevel}`);
                    return false;
            }
        });
        if (featureLayers.length === 0) return;
        const featureLayer = featureLayers[0];
        const graphicLayer: __esri.FeatureLayer = this._getAllFeatureLayers().find(l => l.title.endsWith(` - ${currentSelectedAnalysisLevel}`));
        const query = featureLayer.createQuery();
        if (preSelectedGeo != null) {
            query.geometry = preSelectedGeo;
        } else {
            query.geometry = evt.mapPoint;
        }
        featureLayer.queryFeatures(query).then((polyFeatureSet: __esri.FeatureSet) => {
            let currentAttributes: any;
            if (preSelectedObjectId == null) {
                currentAttributes = polyFeatureSet.features[0].attributes;
            } else {
                polyFeatureSet.features.forEach(f => {
                    if (ValLayerService.getAttributeValue(f.attributes, 'objectid') === preSelectedObjectId) {
                        currentAttributes = f.attributes;
                    }
                    this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    this.metricService.add('CAMPAIGN', 'Total Investment', '$' + MapService.totInvestment.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                    this.metricService.add('CAMPAIGN', 'Progress to Budget', MapService.proBudget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%');

                });
            }
            if (currentAttributes == null) {
                console.error('Could not match object id from popup geo selection');
                return;
            }
            const queriedObjectId = ValLayerService.getAttributeValue(currentAttributes, 'objectid');
            let currentHHCount = null;
            let currentTotalInvestment = 0;
            let currentProBudget = 0;
            let currentDollarBudget = 0;
            let currentCircBudget = 0;
            let temp = 0;
            if (this.impDiscoveryService.get()[0].selectedSeason == 'WINTER') {
                currentHHCount = ValLayerService.getAttributeValue(currentAttributes, 'hhld_w') || 0;
            }
            if (this.impDiscoveryService.get()[0].selectedSeason == 'SUMMER') {
                currentHHCount = ValLayerService.getAttributeValue(currentAttributes, 'hhld_s') || 0;
            }
            if (this.impDiscoveryService.get()[0].cpm != null) {
                temp = this.impDiscoveryService.get()[0].cpm * (currentHHCount / 1000);
                currentTotalInvestment = Math.round(temp);
            }

            if (this.impDiscoveryService.get()[0].circBudget != null && this.impDiscoveryService.get()[0].circBudget != 0 && (this.impDiscoveryService.get()[0].totalBudget == 0 || this.impDiscoveryService.get()[0].totalBudget == null)) {
                currentCircBudget = (currentHHCount / this.impDiscoveryService.get()[0].circBudget) * 100;
                currentProBudget = Math.round(currentCircBudget);
            }
            if (this.impDiscoveryService.get()[0].totalBudget != null && this.impDiscoveryService.get()[0].totalBudget != 0 && (this.impDiscoveryService.get()[0].circBudget == 0 || this.impDiscoveryService.get()[0].circBudget == null)) {
                currentDollarBudget = (Math.round(temp) / this.impDiscoveryService.get()[0].totalBudget) * 100;
                currentProBudget = Math.round(currentDollarBudget);
            }
            if (this.impDiscoveryService.get()[0].circBudget != null && this.impDiscoveryService.get()[0].totalBudget != null) {
                currentDollarBudget = (Math.round(temp) / this.impDiscoveryService.get()[0].totalBudget) * 100;
                currentProBudget = Math.round(currentDollarBudget);
            }
            const currentIpCount = ValLayerService.getAttributeValue(currentAttributes, 'num_ip_addrs') || 0;
            const currentGeocode = ValLayerService.getAttributeValue(currentAttributes, 'geocode');
            const currentLat = ValLayerService.getAttributeValue(currentAttributes, 'latitude');
            const currentLong = ValLayerService.getAttributeValue(currentAttributes, 'longitude');
            if (MapService.selectedCentroidObjectIds.includes(queriedObjectId)) {
                const indexToRemove = graphicLayer.source.findIndex(g => {
                    const currentObjectId = ValLayerService.getAttributeValue(g.attributes, 'objectid');
                    return currentObjectId === queriedObjectId || currentObjectId === preSelectedObjectId;
                });
                if (indexToRemove !== -1) {
                    graphicLayer.source.removeAt(indexToRemove);
                }
                // remove the id from the selected centroids list
                const index = MapService.selectedCentroidObjectIds.indexOf(preSelectedObjectId || queriedObjectId);
                MapService.selectedCentroidObjectIds.splice(index, 1);
                // remove the geo from the datastore
                if (currentGeocode != null) {
                    this.impGeofootprintGeoAttribService.removeBySearch({ impGeofootprintGeo: this.impGeofootprintGeoService.find({ geocode: currentGeocode }) });
                    this.impGeofootprintGeoService.removeBySearch({ geocode: currentGeocode });
                } else {
                    console.warn(`Geocode was not found in attributes for object ${queriedObjectId}`);
                }
                MapService.hhDetails -= currentHHCount;
                MapService.hhIpAddress -= currentIpCount;
                MapService.totInvestment -= currentTotalInvestment;
                MapService.proBudget -= currentProBudget;

            } else {
                let geoToAdd: __esri.Geometry;
                if (preSelectedObjectId != null) {
                    geoToAdd = preSelectedGeo;
                } else {
                    geoToAdd = polyFeatureSet.features[0].geometry;
                }
                graphicLayer.source.add(new EsriModules.Graphic({
                    geometry: geoToAdd,
                    symbol: symbol,
                    attributes: Object.assign({}, currentAttributes)
                }));
                MapService.selectedCentroidObjectIds.push(queriedObjectId);
                const newGeoModel = new ImpGeofootprintGeo({ geocode: currentGeocode, xCoord: currentLong, yCoord: currentLat, hhc: currentHHCount });
                const newAttributes: ImpGeofootprintGeoAttrib[] = [];
                //Create a new geo attribute to store the Median Household Income
                newAttributes.push(this.createGeoAttrib('cl2i00', currentAttributes, [newGeoModel]));

                //Create a new geo attribute to store the % '17 HHs Families with Related Children < 18 Yrs
                newAttributes.push(this.createGeoAttrib('cl0c00', currentAttributes, [newGeoModel]));

                //Create a new geo attribute to store % '17 Pop Hispanic or Latino
                newAttributes.push(this.createGeoAttrib('cl2prh', currentAttributes, [newGeoModel]));

                //Create a new geo attribute to store Casual Dining: 10+ Times Past 30 Days
                newAttributes.push(this.createGeoAttrib('tap049', currentAttributes, [newGeoModel]));

                this.impGeofootprintGeoService.add([newGeoModel]);
                this.impGeofootprintGeoAttribService.add(newAttributes.filter(a => a != null));
                MapService.hhDetails += currentHHCount;
                MapService.hhIpAddress += currentIpCount;
                MapService.totInvestment += currentTotalInvestment;
                MapService.proBudget += currentProBudget;
            }
            this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            if (this.impDiscoveryService.get()[0].cpm != null) {
                this.metricService.add('CAMPAIGN', 'Total Investment', '$' + MapService.totInvestment.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            } else {
                this.metricService.add('CAMPAIGN', 'Total Investment', 'N/A');
            }
            if ((this.impDiscoveryService.get()[0].circBudget == null && this.impDiscoveryService.get()[0].totalBudget == null) || (this.impDiscoveryService.get()[0].circBudget == 0 && this.impDiscoveryService.get()[0].totalBudget == 0)) {
                this.metricService.add('CAMPAIGN', 'Progress to Budget', 'N/A');
            } else {
                this.metricService.add('CAMPAIGN', 'Progress to Budget', MapService.proBudget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%');

            }

        });
    }

    public getAllFeatureLayers() : Promise<__esri.FeatureLayer[]> {
        // console.log('fired getAllFeatureLayers');
        return Promise.resolve(this._getAllFeatureLayers());
    }

    private _getAllFeatureLayers() : __esri.FeatureLayer[] {
        const result: __esri.FeatureLayer[] = [];
        this.map.allLayers.forEach(lyr => {
            if (lyr.type === 'feature') {
                result.push(lyr as __esri.FeatureLayer);
            }
        });
        return result;
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
                    await this.bufferMergeEach(tradeAreaMap.get('color'), kmsMereEach, tradeAreaMap.get('lyrName'), tradeAreaMap.get('outlneColor'), tradeAreaMap.get('selector'))
                        .then(res => {
                            //graphicList = res;
                            if (max == miles) {
                                this.selectCentroid(res);
                            }
                        });
                }
            }
            if (tradeAreaMap.get('mergeType') === 'MergeAll') {
                await this.bufferMergeEach(tradeAreaMap.get('color'), tradeAreaMap.get('milesMax'), tradeAreaMap.get('lyrName'), tradeAreaMap.get('outlneColor'), tradeAreaMap.get('selector'))
                    .then(res => {
                        this.selectCentroid(res);
                    });
            }
            if (tradeAreaMap.get('mergeType') === 'NoMerge') {
                milesList = tradeAreaMap.get('miles');
                for (const miles of milesList) {
                    const kmsNomerge = miles / 0.62137;
                    for (const point of MapService.pointsArray) {
                        await this.drawCircle(point.latitude, point.longitude, tradeAreaMap.get('color'), kmsNomerge, tradeAreaMap.get('lyrName'), tradeAreaMap.get('outlneColor'), tradeAreaMap.get('selector'));
                    }
                }
            }
        }
    }

    // public removePoint(point: Points) {
    // }

    // just for reference we are not using it
    async multiHomeGeocode(lyrList: __esri.FeatureLayer[],
        geometryList: __esri.Geometry[], extent: __esri.Extent) {
        console.log('multiHomeGeocode fired');
        const loader = EsriLoaderWrapperService.esriLoader;
        const [esriConfig, FeatureSet]
            = await loader.loadModules(['esri/config', 'esri/tasks/support/FeatureSet']);

        // console.log('esriConfig:::', esriConfig);
        esriConfig.request.timeout = 600000;

        const polyFeatureSetList: Promise<__esri.FeatureSet>[] = [];
        for (const lyr of lyrList) {
            const qry = lyr.createQuery();
            qry.geometry = extent;
            if (this.config.layerIds.counties.boundaries.id !== lyr.portalItem.id &&
                this.config.layerIds.dma.boundaries.id !== lyr.portalItem.id) {
                qry.outFields = ['geocode'];
            }

            if (this.config.layerIds.counties.boundaries.id === lyr.portalItem.id) {
                qry.outFields = ['county_nam'];
            }

            if (this.config.layerIds.dma.boundaries.id === lyr.portalItem.id) {
                qry.outFields = ['dma_name'];
            }
            //IPromise<__esri.FeatureSet>
            polyFeatureSetList.push(lyr.queryFeatures(qry) as any);
            /* await lyr.queryFeatures(qry).then(polyFeatureSet => {
                         console.log('polyFeatureSet::::', polyFeatureSet);
                        // polyFeatureSetList.push(polyFeatureSet);
             });*/
        }

        return Promise.all(polyFeatureSetList);


        /*Observable.forkJoin(observables).subscribe(res => {
        });*/

        /*const qry = lyr.createQuery();
        qry.geometry = extent;
        if (this.config.layerIds.dma.counties != lyr.portalItem.id &&
            this.config.layerIds.dma.boundaries != lyr.portalItem.id){
                 qry.outFields = ['geocode'];
        }

        if (this.config.layerIds.dma.counties === lyr.portalItem.id){
            qry.outFields = ['county_nam'];
        }

        if (this.config.layerIds.dma.boundaries === lyr.portalItem.id){
            qry.outFields = ['dma_name'];
        }
        let returnPolyFeatureSet: __esri.FeatureSet;
        await lyr.queryFeatures(qry).then(polyFeatureSet => {
                    console.log('polyFeatureSet::::', polyFeatureSet);
                    returnPolyFeatureSet = polyFeatureSet;
         });*/

        //  return polyFeatureSetList;
    }

    // async getHomeGeocode(lyr: __esri.FeatureLayer, gra: __esri.Graphic) : Promise<Map<String, Object>> {
    //     const loader = EsriLoaderWrapperService.esriLoader;
    //     const [FeatureLayer, Graphic, PopupTemplate]
    //         = await loader.loadModules([
    //             'esri/layers/FeatureLayer', 'esri/Graphic', 'esri/PopupTemplate']);
    //     //if (layer.title === 'ZIP_Top_Vars' || layer.title === 'ATZ_Top_Vars' || layer.title === 'DIG_ATZ_Top_Vars') {
    //     const graphic: __esri.Graphic = gra;
    //     //         console.log('getHomeGeocode fired');
    //
    //     const qry = lyr.createQuery();
    //     qry.geometry = graphic.geometry;
    //     if (this.config.layerIds.counties.boundaries.id !== lyr.portalItem.id &&
    //         this.config.layerIds.dma.boundaries.id !== lyr.portalItem.id) {
    //         qry.outFields = ['geocode'];
    //     }
    //
    //     if (this.config.layerIds.counties.boundaries.id === lyr.portalItem.id) {
    //         qry.outFields = ['county_nam'];
    //     }
    //
    //     if (this.config.layerIds.dma.boundaries.id === lyr.portalItem.id) {
    //         qry.outFields = ['dma_name'];
    //     }
    //
    //     const homeGeocodeMap: Map<String, Object> = new Map<String, Object>();
    //     await lyr.queryFeatures(qry).then(polyFeatureSet => {
    //         let homeGeocode = null;
    //         let countyName = null;
    //         let dmaName = null;
    //         //  let
    //         if (polyFeatureSet.features.length > 0) {
    //             homeGeocode = polyFeatureSet.features[0].attributes.geocode;
    //             dmaName = polyFeatureSet.features[0].attributes.dma_name;
    //             countyName = polyFeatureSet.features[0].attributes.county_nam;
    //         }
    //         if (lyr.portalItem.id === this.config.layerIds.zip.topVars.id) {
    //             homeGeocodeMap.set('home_geo', homeGeocode);
    //         }
    //         if (lyr.portalItem.id === this.config.layerIds.atz.topVars.id) {
    //             homeGeocodeMap.set('home_geo', homeGeocode);
    //         }
    //         if (lyr.portalItem.id === this.config.layerIds.pcr.topVars.id) {
    //             homeGeocodeMap.set('home_geo', homeGeocode);
    //         }
    //
    //         if (lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id) {
    //             homeGeocodeMap.set('home_geo', homeGeocode);
    //         }
    //         /* if (this.config.layerIds.dma.counties === lyr.portalItem.id){
    //              homeGeocodeMap.set('home_geo' , countyName);
    //          }
    //          if (this.config.layerIds.dma.boundaries === lyr.portalItem.id){
    //              homeGeocodeMap.set('home_geo' , dmaName);
    //          }*/
    //
    //     });
    //     return homeGeocodeMap;
    // }

    //Calculate home geos for the response list
    // async calculateHomeGeo(siteList: GeocodingResponse[]) {
    //     console.log('calculateHomeGeo::');
    //     const color = {
    //         a: 1,
    //         r: 35,
    //         g: 93,
    //         b: 186
    //
    //     };
    //
    //     const fLyrList: __esri.FeatureLayer[] = [];
    //     await this.getAllFeatureLayers().then(list => {
    //         if (list.length > 0) {
    //             for (const layer of list) {
    //                 if ((layer.portalItem != null) && (layer.portalItem.id === this.config.layerIds.zip.topVars.id ||
    //                     layer.portalItem.id === this.config.layerIds.atz.topVars.id ||
    //                     layer.portalItem.id === this.config.layerIds.pcr.topVars.id ||
    //                     layer.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id
    //         /*|| layer.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars ||
    //         layer.portalItem.id === this.config.layerIds.dma.counties ||
    //       layer.portalItem.id === this.config.layerIds.dma.boundaries*/)) {
    //                     fLyrList.push(layer);
    //                 }
    //             }
    //         }
    //     });
    //
    //     let siteNumber: number = 0;
    //     const geoCodedSiteList: GeocodingResponse[] = [];
    //     for (const site of siteList) {
    //         let geoAttr: GeocodingAttributes;
    //         let home_geo_issue: string = 'N';
    //         siteNumber++;
    //         //this.displaySpinnerMessage = 'Calculating Home Geocodes';
    //         try {
    //             for (const llyr of fLyrList) {
    //                 let home_geo = null;
    //                 geoAttr = new GeocodingAttributes();
    //                 let graphic: __esri.Graphic;
    //                 await this.createGraphic(site.latitude, site.longitude, color).then(res => {
    //                     graphic = res;
    //                 });
    //                 await this.getHomeGeocode(llyr, graphic).then(res => {
    //                     home_geo = res.get('home_geo');
    //
    //
    //                     if (llyr.portalItem.id === this.config.layerIds.zip.topVars.id) {
    //                         geoAttr.attributeName = 'Home ZIP';
    //                         geoAttr.attributeValue = home_geo;
    //                         site.geocodingAttributesList.push(geoAttr);
    //                         if (this.impDiscoveryService.get()[0].analysisLevel === 'ZIP') {
    //                             site.homeGeocode = home_geo;
    //                         }
    //                     }
    //                     if (llyr.portalItem.id === this.config.layerIds.atz.topVars.id) {
    //                         geoAttr.attributeName = 'Home ATZ';
    //                         geoAttr.attributeValue = home_geo;
    //                         site.geocodingAttributesList.push(geoAttr);
    //                         if (this.impDiscoveryService.get()[0].analysisLevel === 'ATZ') {
    //                             site.homeGeocode = home_geo;
    //                         }
    //                     }
    //                     if (llyr.portalItem.id === this.config.layerIds.pcr.topVars.id) {
    //                         geoAttr.attributeName = 'HOME PCR';
    //                         geoAttr.attributeValue = home_geo;
    //                         site.geocodingAttributesList.push(geoAttr);
    //                         if (this.impDiscoveryService.get()[0].analysisLevel === 'PCR') {
    //                             site.homeGeocode = home_geo;
    //                         }
    //                     }
    //                     if (llyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id) {
    //                         geoAttr.attributeName = 'Home DIGITAL ATZ';
    //                         geoAttr.attributeValue = home_geo;
    //                         site.geocodingAttributesList.push(geoAttr);
    //                     }
    //                     /* if (llyr.portalItem.id === this.config.layerIds.dma.counties) {
    //                         geoAttr.attributeName = 'HOME COUNTY';
    //                         geoAttr.attributeValue = home_geo;
    //                         site.geocodingAttributesList.push(geoAttr);
    //                      }
    //                      if (llyr.portalItem.id === this.config.layerIds.dma.boundaries) {
    //                        geoAttr.attributeName = 'HOME DMA';
    //                        geoAttr.attributeValue = home_geo;
    //                        site.geocodingAttributesList.push(geoAttr);
    //                      }*/
    //                 });
    //             }
    //
    //         }
    //         catch (ex) {
    //             home_geo_issue = 'Y';
    //             console.error(ex);
    //         }
    //
    //         geoAttr = new GeocodingAttributes();
    //         geoAttr.attributeName = 'HOME GEOCODE ISSUE';
    //         geoAttr.attributeValue = home_geo_issue;
    //         site.geocodingAttributesList.push(geoAttr);
    //         geoCodedSiteList.push(site);
    //     }
    //     return geoCodedSiteList;
    // }
}


export interface EsriWrapper<T> {

    val: T;

}
