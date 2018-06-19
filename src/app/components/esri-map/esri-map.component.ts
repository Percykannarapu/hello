import { MapService } from '../../services/map.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { mapFunctions } from '../../app.component';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { EsriModules } from '../../esri-modules/core/esri-modules.service';
import { AppMapService } from '../../services/app-map.service';
import { MapDispatchService } from '../../services/map-dispatch.service';
import { EsriLayerService } from '../../esri-modules/layers/esri-layer.service';

const VIEWPOINT_KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
const CENTER_LONG_KEY = 'IMPOWER-MAP-CENTER-LONGITUDE';
const CENTER_LAT_KEY = 'IMPOWER-MAP-CENTER-LATITUDE';
const ZOOM_KEY = 'IMPOWER-MAP-ZOOM';
const HEIGHT_KEY = 'IMPOWER-MAP-HEIGHT';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {
  // map container dimensions
  public width: number;
  public height: number = 400;
  public highlight = null;

  @Input() zoom: number;
  @Input() centerLng: number;
  @Input() centerLat: number;
  @Input() rotation: number;

  @Output() viewCreated = new EventEmitter();

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;
  @ViewChild('esriMapContainer') private mapContainerEl: ElementRef;
  private mapView: __esri.MapView;

  constructor(public mapService: MapService, private mapDispatch: MapDispatchService,
               private modules: EsriModules, private newMapService: AppMapService,
              private esriMapService: EsriMapService, private esriLayerService: EsriLayerService) {
    console.log('Constructing esri-map-component');
  }

  private static replaceCopyrightElement() {
    // Angular doesn't particularly like to modify existing DOM elements, so we have to drop down to raw JS for this
    const el = document.getElementsByClassName('esri-attribution__powered-by');
    if (el && el.length > 0 && el[0]) {
      const existingAttribution: string = el[0].innerHTML;
      el[0].innerHTML = (new Date()).toDateString() + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + existingAttribution ;
    }
  }

  public ngOnInit() {
    this.modules.onReady(() => { this.init(); });
  }

  private init() : void {
    console.log('Initializing Esri Map Component');
    const mapParams = {
      basemap: EsriModules.BaseMap.fromId('streets'),
      layers: []
    };
    const viewParams = {
      center: { longitude: -98.5795, latitude: 39.8282 },
      zoom: 4,
      spatialReference: {
        wkid: 102100
      }
    };
    this.esriMapService.loadMap(mapParams, viewParams, this.mapViewEl);
    this.mapDispatch.onMapReady.then(() => {
      this.mapView = this.mapDispatch.getMapView();
      this.mapService.createMapView();
      this.mapService.setMapLayers(['PCR', 'DIG_ATZ', 'ATZ', 'ZIP', 'WRAP', 'COUNTY', 'DMA']);
      this.mapService.hideMapLayers();
      this.mapDispatch.onMapViewClick().subscribe(event => this.clickHandler(event));
      EsriMapComponent.replaceCopyrightElement();
      this.mapDispatch.afterMapViewUpdate().subscribe(
        () => this.saveMapViewData(this.mapContainerEl), null, () => this.setMapHeight());
      this.esriLayerService.setupLayerWatches(this.mapDispatch.getMapView().map.layers.toArray());
      this.setMapCenter();
      this.setMapZoom();
      this.setMapViewPoint();
      this.disableNavigation(this.mapView);
    });
  }

  private saveMapViewData(el: ElementRef) {
    localStorage.setItem(VIEWPOINT_KEY, JSON.stringify(this.mapView.viewpoint.toJSON()));
    localStorage.setItem(CENTER_LONG_KEY, JSON.stringify(this.mapView.center.longitude));
    localStorage.setItem(CENTER_LAT_KEY, JSON.stringify(this.mapView.center.latitude));
    localStorage.setItem(ZOOM_KEY, JSON.stringify(this.mapView.zoom));
    localStorage.setItem(HEIGHT_KEY, JSON.stringify(el.nativeElement.clientHeight));
  }

  // save and reset view viewpoint
  private setMapViewPoint() {
    const vpString = localStorage.getItem(VIEWPOINT_KEY);
    if (vpString) {
      const vp = JSON.parse(vpString);
      this.mapView.viewpoint = EsriModules.Viewpoint.fromJSON(vp);
    }
  }

  // save and reset map zoom
  private setMapCenter() {
    const vpString1 = localStorage.getItem(CENTER_LONG_KEY);
    const vpString2 = localStorage.getItem(CENTER_LAT_KEY);
    if (vpString1) {
      this.mapView.center.longitude = JSON.parse(vpString1);
    } else {
      this.mapView.center.longitude = -98.5795;
    }
    if (vpString2) {
      this.mapView.center.latitude = JSON.parse(vpString2);
    } else {
      this.mapView.center.latitude = 39.8282;
    }
  }

    // save and reset map zoom
    private setMapZoom() {
      const vpString = localStorage.getItem(ZOOM_KEY);
      if (vpString) {
        this.mapView.zoom = JSON.parse(vpString);
      } else {
        this.mapView.zoom = 4;
      }
    }

  // save and reset map height
  private setMapHeight() {
    const mapString = localStorage.getItem(HEIGHT_KEY);
    if (mapString) {
      this.height = JSON.parse(mapString) as number;
    }
  }

  private clickHandler(event: __esri.MapViewClickEvent){
    if (this.mapService.mapFunction === mapFunctions.SelectPoly) {
      this.newMapService.handleClickEvent(event);
    }
  }

  public getCursor() {
    switch (this.mapService.mapFunction) {
      case mapFunctions.SelectPoly:
        return 'copy';
      case mapFunctions.DrawPoint:
        return 'cell';
      case mapFunctions.MeasureLine:
        return 'crosshair';
      case mapFunctions.DrawLine:
        return 'crosshair';
      case mapFunctions.DrawPoly:
        return 'crosshair';
      case mapFunctions.RemoveGraphics:
        return 'default';
      case mapFunctions.Popups:
        return 'default';
      case mapFunctions.Labels:
        return 'default';
    }
  }

  /* requires webGL enabled revisit after 4.6 upgrade
  private enableHighlightOnPointerMove(layer: __esri.FeatureLayer, view: __esri.MapView) {
    view.whenLayerView(layer).then((layerView: __esri.FeatureLayerView) => {
      view.on("pointer-move", (event) => {
        view.hitTest(event)
          .then((r) => {

            // remove the previous highlight
            if (this.highlight) {
                this.highlight.remove();
                this.highlight = null;
            }

            // if a feature is returned, highlight it
            // and display its attributes in the popup
            // if no features are returned, then close the popup
            let id: number = null;

            if (r.results.length > 0) {
              const feature = r.results[0].graphic;
              feature.popupTemplate = layer.popupTemplate;
              id = feature.attributes.OBJECTID;
              this.highlight = layerView.highlight([id]);
              const selectionId = view.popup.selectedFeature ?
                view.popup.selectedFeature.attributes.OBJECTID :
                null;

              if (this.highlight && (id !== selectionId)) {
                view.popup.open({
                  features: [feature],
                  updateLocationEnabled: true
                });
              }
            } else {
              if (view.popup.visible) {
                view.popup.close();
                view.popup.clear();
              }
            }
          });
      });
    });
  }
  */

  // stops propagation of default behavior when an event fires
  private stopEvtPropagation(evt: __esri.MapViewClickEvent) {
    evt.stopPropagation();
  }

  // disables all navigation in the view
  private disableNavigation(view: __esri.MapView) {
    //view.popup.dockEnabled = true;

    // Removes the zoom action on the popup
    // view.popup.actions = [];

    // disable mouse wheel scroll zooming on the view
    // view.on("mouse-wheel", this.stopEvtPropagation);

    // disable zooming via double-click on the view
    // view.on("double-click", this.stopEvtPropagation);

    // disable zooming out via double-click + Control on the view
    // view.on("double-click", ["Control"], this.stopEvtPropagation);

    // disables pinch-zoom and panning on the view
    // view.on("drag", this.stopEvtPropagation);

    // disable the view's zoom box to prevent the Shift + drag
    // and Shift + Control + drag zoom gestures.
    // view.on("drag", ["Shift"], this.stopEvtPropagation);
    // view.on("drag", ["Shift", "Control"], this.stopEvtPropagation);

    /*
    // prevents zooming and rotation with the indicated keys
    view.on("key-down", (evt) => {
      var prohibitedKeys = ["+", "-", "_", "=", "a", "d"];
      var keyPressed = evt.key.toLowerCase();
      if (prohibitedKeys.indexOf(keyPressed) !== -1) {
        evt.stopPropagation();
      }
    });
    */

    return view;
  }


}
