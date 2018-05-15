import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Injectable } from '@angular/core';
import { MetricService } from '../val-modules/common/services/metric.service';
import { ValLayerService } from './app-layer.service';
import { mapFunctions } from '../app.component';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppConfig } from '../app.config';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { AuthService } from './auth.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { LayerDefinition } from '../../environments/environment';
import { ValMapService } from './app-map.service';
import { UsageService } from './usage.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';

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

    public static layers: Set<__esri.Layer> = new Set<__esri.Layer>();

    private map: __esri.Map;
    private mapView: __esri.MapView;

    // set a reference to global enum (defined in app.component)
    public mapFunction: mapFunctions = mapFunctions.Popups;
    public sketchViewModel: __esri.SketchViewModel;

    private pausableWatches: Array<__esri.PausableWatchHandle> = new Array<__esri.PausableWatchHandle>();

    constructor(private metricService: MetricService,
        private layerService: ValLayerService,
        private esriMapService: EsriMapService,
        private impGeofootprintGeoService: ImpGeofootprintGeoService,
        private config: AppConfig,
        private impGeofootprintLocationService: ImpGeofootprintLocationService,
        private impDiscoveryService: ImpDiscoveryService,
        private authService: AuthService,
        private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService,
        private appMapService: ValMapService,
        private usageService: UsageService,
        private esriLayerService: EsriLayerService, 
        private esriQueryService: EsriQueryService) {
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
        this.pauseLayerWatch(this.pausableWatches);
        MapService.EsriGroupLayer = new EsriModules.GroupLayer({
            title: 'ESRI',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.EsriGroupLayer, 'visible', e => this.collectLayerUsage(MapService.EsriGroupLayer)));

        MapService.ZipGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis ZIP',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.ZipGroupLayer, 'visible', e => this.collectLayerUsage(MapService.ZipGroupLayer)));

        MapService.DmaGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis DMA',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.DmaGroupLayer, 'visible', e => this.collectLayerUsage(MapService.DmaGroupLayer)));

        MapService.AtzGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis ATZ',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.AtzGroupLayer, 'visible', e => this.collectLayerUsage(MapService.AtzGroupLayer)));

        MapService.DigitalAtzGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis Digital ATZ',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.DigitalAtzGroupLayer, 'visible', e => this.collectLayerUsage(MapService.DigitalAtzGroupLayer)));

        MapService.PcrGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis PCR',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.PcrGroupLayer, 'visible', e => this.collectLayerUsage(MapService.PcrGroupLayer)));

        MapService.WrapGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis WRAP',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.WrapGroupLayer, 'visible', e => this.collectLayerUsage(MapService.WrapGroupLayer)));

        MapService.HHGroupLayer = new EsriModules.GroupLayer({
            title: 'Valassis Households',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.HHGroupLayer, 'visible', e => this.collectLayerUsage(MapService.HHGroupLayer)));

        MapService.CountyGroupLayer = new EsriModules.GroupLayer({
            title: 'Counties',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.CountyGroupLayer, 'visible', e => this.collectLayerUsage(MapService.CountyGroupLayer)));

        MapService.SitesGroupLayer = new EsriModules.GroupLayer({
            title: 'Sites',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.SitesGroupLayer, 'visible', e => this.collectLayerUsage(MapService.SitesGroupLayer)));

        MapService.CompetitorsGroupLayer = new EsriModules.GroupLayer({
            title: 'Competitors',
            listMode: 'show-children',
            visible: false
        });
        this.pausableWatches.push(EsriModules.watchUtils.pausable(MapService.CompetitorsGroupLayer, 'visible', e => this.collectLayerUsage(MapService.CompetitorsGroupLayer)));
        this.resumeLayerWatch(this.pausableWatches);
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

    // Execute each time the "select-this" action is clicked
    public selectThis() {
      const geocode: string = ValLayerService.getAttributeValue(this.mapView.popup.selectedFeature.attributes, 'geocode');
      this.appMapService.selectSingleGeocode(geocode);
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
          view: this.mapView,
          container: document.createElement('div')
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


        /*
        // Create an instance of the print widget
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

        });

        this.setupSketchViewModel();
    }

    private setupSketchViewModel() {
      // create a new sketch view model
      this.sketchViewModel = new EsriModules.widgets.SketchViewModel({
        view: this.mapView,
        pointSymbol: {
          type: 'simple-marker',
          style: 'square',
          color: '#8A2BE2',
          size: '16px',
          outline: {
            color: [255, 255, 255],
            width: 3 // points
          }
        },
        polylineSymbol: {
          type: 'simple-line',
          style: 'short-dash',
          width: 1.25,
          color: [230, 0, 0, 1]
        },
        polygonSymbol: {
          type: 'simple-fill',
          color: 'rgba(0,0,0, 0)',
          style: 'solid',
          outline: {
            color: 'white',
            width: 1
          }
        }
      } as any);

      // the sketchViewModel introduces an empty GraphicsLayer to the map,
      // even if you specify a local temp layer, so this code is to suppress
      // this "undefined" layer
      this.map.allLayers.forEach(l => {
        if (l.title == null) l.listMode = 'hide';
      });

      // -----------------------------------------------------------------------------------
      // SketchViewModel
      // -----------------------------------------------------------------------------------
      // ************************************************************
      // Get the completed graphic from the event and add it to view.
      // This event fires when user presses
      //  * "C" key to finish sketching point, polygon or polyline.
      //  * Double-clicks to finish sketching polyline or polygon.
      //  * Clicks to finish sketching a point geometry.
      // ***********************************************************
      this.sketchViewModel.on('draw-complete', e => this.addSketchGraphic(e));
      // -----------------------------------------------------------------------------------
    }

    private addSketchGraphic({ geometry }: { geometry: __esri.Geometry}) : void {
      // if multipoint geometry is created, then change the symbol
      // for the graphic
      let symbol: __esri.Symbol;
      switch (geometry.type) {
        case 'point':
          symbol = this.sketchViewModel.pointSymbol;
          break;
        case 'polyline':
          symbol = this.sketchViewModel.polylineSymbol;
          break;
        default:
          symbol = this.sketchViewModel.polygonSymbol;
          break;
      }

      const sketchGraphic = new EsriModules.Graphic({
        geometry: geometry,
        symbol: symbol
      });
      
      this.mapView.graphics.add(sketchGraphic);
      // ----------------------------------------------------------------------------------------
      // Measure Length of PolyLine
      if (this.mapFunction === mapFunctions.MeasureLine) {
        const polyline = geometry as __esri.Polyline;
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
        this.toggleFeatureLayerPopups();
      }

      if (this.mapFunction === mapFunctions.DrawPoly){
          const polygons = geometry as __esri.Polygon;
          console.log('polygons:::::', polygons);
          const discoveryUi: ImpDiscoveryUI[] = this.impDiscoveryService.get(); 
          const boundaryLayerId = this.config.getLayerIdForAnalysisLevel(discoveryUi[0].analysisLevel);
          const layer = this.esriLayerService.getPortalLayerById(boundaryLayerId);
          const sub = this.esriQueryService.queryLayerView(boundaryLayerId, true,  polygons.extent).subscribe(graphics => {

               console.log('list of ggraphics::', graphics);
               graphics.forEach(graphic => {
                const latitude = graphic.geometry['centroid'].latitude   != null ? graphic.geometry['centroid'].latitude  : graphic.geometry['centroid'].y;
                const longitude = graphic.geometry['centroid'].longitude != null ? graphic.geometry['centroid'].longitude : graphic.geometry['centroid'].x;
                const point: __esri.Point = new EsriModules.Point({latitude: latitude, longitude: longitude});
                this.appMapService.handleClickEvent(point);
               });
          });


      }

      //this.updateSketchGraphic = null;
    }


    public findpolyOnExtent(poly: __esri.Polygon){
       // if (poly.extent.contains)

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

        //this.sketchViewModel.layer.add(graphic);
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

    // activate the sketch to create a "Measure" polyline
    public measureLineButton(event: MouseEvent) {
        this.mapFunction = mapFunctions.MeasureLine;
        this.setActiveButton(event);
        // set the sketch to create a polyline geometry
        this.sketchViewModel.create('polyline', undefined);
        this.toggleFeatureLayerPopups();
    }

    // Toggle Polygon multiple selection Mode
    public selectMultiPolyButton(event: MouseEvent){
        this.mapFunction = mapFunctions.DrawPoly;
        this.setActiveButton(event);
        // set the sketch to create a polygon geometry
        this.sketchViewModel.create('rectangle', undefined);
        this.toggleFeatureLayerPopups();
    }

    // remove all graphics
    public removeGraphics(event: MouseEvent) {
        this.mapFunction = mapFunctions.RemoveGraphics;
        this.setActiveButton(event);
        this.mapView.graphics.removeAll();
        this.sketchViewModel.reset();
    }

    // Hide MapLayers
    public hideMapLayers() : void {
        console.log('fired hideMapLayers() in MapService');

        // Toggle all layers
        this.map.layers.forEach(layer => {
            // we only want to hide map layers that are showing in the layer list widget, so the users can turn them back on
            if (layer.visible === true && layer.listMode !== 'hide') {
                this.pauseLayerWatch(this.pausableWatches);
                layer.visible = false;
                this.resumeLayerWatch(this.pausableWatches);
            }
        });
    }

    /**
     * Stop the ESRI watchUtils from watching the visible property on a layer
     * @argument pausableWatches An array of __esri.PausableWatchHandle
     */
    private pauseLayerWatch(pausableWatches: Array<__esri.PausableWatchHandle>) {
        for (const watch of pausableWatches) {
            watch.pause();
        }
    }

    /**
     * Resume watching the visible property on layers with the ESRI watch utils
     * @argument pausableWatches An array of __esri.PausableWatchHandle
     */
    private resumeLayerWatch(pausableWatches: Array<__esri.PausableWatchHandle>) {
        for (const watch of pausableWatches) {
            watch.resume();
        }
    }

    // Toggle FeatureLayer popups
    public toggleFeatureLayerPopups() {

        this.map.allLayers.forEach(layer => {
            if (EsriUtils.layerIsFeature(layer)) {
            if (layer.portalItem != null) {
                layer.popupEnabled = (this.mapFunction === mapFunctions.Popups) ;
                }
            }
        });
    }

    private setupMapGroup(group: __esri.GroupLayer, layerDefinitions: LayerDefinition[]) {
        this.pauseLayerWatch(this.pausableWatches);
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
        // const groupContainsLayer = (layerDef) => (layer: __esri.FeatureLayer) => layer.portalItem && layer.portalItem.id === layerDef.id;
        // const currentLayer = (layerDef) => (layer: __esri.FeatureLayer) => curren = (layerDef => {EsriModules.Layer.fromPortalItem(<any>{portalItem: { id: layerDef.id}});

        // if (layerDefinitions.filter(i => i != null && i.id != null)){
        //     for (let i: number = 0; i < layerDefinitions.length; i++) {
        //         const popupTitle = layerDef.name + layerDef.popupTitleSuffix;
        // }

        layerDefinitions.filter(i => i != null && i.id != null ).forEach(layerDef => {
          const isUrlRequest = layerDef.id.toLowerCase().startsWith('http');
          const loader: (spec: any) => IPromise<__esri.Layer> = isUrlRequest ? EsriModules.Layer.fromArcGISServerUrl : EsriModules.Layer.fromPortalItem;
          const itemLoadSpec = isUrlRequest ? { url: layerDef.id } : { portalItem: {id: layerDef.id } };
          loader(itemLoadSpec).then((currentLayer: __esri.FeatureLayer) => {
                const popupTitle = layerDef.name + layerDef.popupTitleSuffix;
                const localPopUpFields = new Set(layerDef.popUpFields);
                currentLayer.visible = layerDef.defaultVisibility;
                currentLayer.title = layerDef.name;
                currentLayer.minScale = layerDef.minScale;
                const compare = (f1, f2) => {
                    const firstIndex =  layerDef.popUpFields.indexOf(f1.fieldName);
                    const secondIndex = layerDef.popUpFields.indexOf(f2.fieldName);
                    return firstIndex - secondIndex;
                };
                if (layerDef.popUpFields.length > 0){
                currentLayer.popupTemplate = new EsriModules.PopupTemplate(<any>{ title: popupTitle, content: '{*}', actions: [selectThisAction, measureThisAction] });
                currentLayer.on('layerview-create', e => {
                    const localLayer = (e.layerView.layer as __esri.FeatureLayer);
                    localLayer.popupTemplate.fieldInfos = localLayer.fields.filter(f => {
                      return localPopUpFields.has(f.name);
                    }).map(f => {
                      return {fieldName: f.name, label: f.alias};
                    });
                    localLayer.popupTemplate.fieldInfos.sort(compare);
                    localLayer.popupTemplate.content = [{
                      type: 'fields'
                    }];
                     });
                } else {
                    currentLayer.popupEnabled = false;
                }
                // Add Layer to Group Layer if it does not already exist
                // if (!group.layers.some(groupContainsLayer(layerDef))) {
                    group.add(currentLayer);
                // }

                // register a listener for this layer to collect usage metrics
                EsriModules.watchUtils.pausable(currentLayer, 'visible', e => this.collectLayerUsage(currentLayer));
            });
        });
        //if (!this.map.layers.some(l => l === group)) {
            this.map.layers.add(group);
            MapService.layers.add(group);
        //}
        group.visible = true;
        this.resumeLayerWatch(this.pausableWatches);
    }

    /**
     * Collect usage metrics when a layer is disabled or enabled
     * @param layer The layer to collect uage metrics on
     */
    private collectLayerUsage(layer: __esri.Layer) {
        const layerActivated: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'layer-visibility', action: 'activated' });
        const layerDeactivated: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'layer-visibility', action: 'deactivated' });
        if (layer.visible) {
          this.usageService.createCounterMetric(layerActivated, layer.title, 1);
        } else {
          this.usageService.createCounterMetric(layerDeactivated, layer.title, 1);
        }
      }

    public setMapLayers(analysisLevels: string[]) : void {
        console.log('fired setMapLayers() in MapService');
        // Setup Default Group Layers
        this.initGroupLayers();
        this.pauseLayerWatch(this.pausableWatches);
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
                        //config
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
        this.resumeLayerWatch(this.pausableWatches);
    }
}
