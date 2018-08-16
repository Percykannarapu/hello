import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { EsriModules } from '../../esri-modules/core/esri-modules.service';
import { AppMapService } from '../../services/app-map.service';
import { MapDispatchService } from '../../services/map-dispatch.service';
import { EsriLayerService } from '../../esri-modules/layers/esri-layer.service';
import { filter, take } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';

const VIEWPOINT_KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
const CENTER_LONG_KEY = 'IMPOWER-MAP-CENTER-LONGITUDE';
const CENTER_LAT_KEY = 'IMPOWER-MAP-CENTER-LATITUDE';
const ZOOM_KEY = 'IMPOWER-MAP-ZOOM';
const HEIGHT_KEY = 'IMPOWER-MAP-HEIGHT';

@Component({
  selector: 'val-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {
  public height: number = 400;

  @Input() zoom: number;
  @Input() centerLng: number;
  @Input() centerLat: number;
  @Input() cursor: string;

  @Output() viewCreated = new EventEmitter();

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;
  @ViewChild('esriMapContainer') private mapContainerEl: ElementRef;
  private mapView: __esri.MapView;

  constructor(private appMapService: AppMapService,
               private mapDispatch: MapDispatchService,
               private modules: EsriModules,
               private esriLayerService: EsriLayerService,
               private esriMapService: EsriMapService) { }

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
    const mapParams: __esri.MapProperties = {
      basemap: EsriModules.BaseMap.fromId('streets'),
      layers: []
    };
    const viewParams: __esri.MapViewProperties = {
      center: { longitude: -98.5795, latitude: 39.8282 },
      zoom: 4,
      highlightOptions : {
        color: [0, 255, 0],
        fillOpacity: 0.65,
        haloOpacity: 0
      },
      spatialReference: {
        wkid: 102100
      }
    };
    this.esriMapService.loadMap(mapParams, viewParams, this.mapViewEl);
    this.esriMapService.onReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.mapView = this.mapDispatch.getMapView();
      this.appMapService.setupMap();
      this.mapDispatch.onMapViewClick().subscribe(event => this.clickHandler(event));
      EsriMapComponent.replaceCopyrightElement();
      this.mapDispatch.afterMapViewUpdate().subscribe(() => this.saveMapViewData(this.mapContainerEl));
      this.setMapHeight();
      this.setMapCenter();
      this.setMapZoom();
      this.setMapViewPoint();
    });
  }

  private saveMapViewData(el: ElementRef) {
    const mapHeight = el.nativeElement.clientHeight > 50 ? el.nativeElement.clientHeight : 400;
    localStorage.setItem(VIEWPOINT_KEY, JSON.stringify(this.mapView.viewpoint.toJSON()));
    localStorage.setItem(CENTER_LONG_KEY, JSON.stringify(this.mapView.center.longitude));
    localStorage.setItem(CENTER_LAT_KEY, JSON.stringify(this.mapView.center.latitude));
    localStorage.setItem(ZOOM_KEY, JSON.stringify(this.mapView.zoom));
    localStorage.setItem(HEIGHT_KEY, JSON.stringify(mapHeight));
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
    const heightString = localStorage.getItem(HEIGHT_KEY);
    const heightNum = Number(heightString);
    if (Number.isNaN(heightNum) || heightNum < 50) {
      this.height = 400;
    } else {
      this.height = heightNum;
    }
  }

  private clickHandler(event: __esri.MapViewClickEvent){
    this.appMapService.handleClickEvent(event);
  }
}
