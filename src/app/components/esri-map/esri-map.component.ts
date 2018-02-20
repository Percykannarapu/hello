import { MapService } from '../../services/map.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { mapFunctions } from '../../app.component';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { EsriModules } from '../../esri-modules/core/esri-modules.service';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {

  // map container dim
  public width: number;
  public height: number = 400;

  @Input() zoom: number;
  @Input() centerLng: number;
  @Input() centerLat: number;
  @Input() rotation: number;

  @Output() viewCreated = new EventEmitter();

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;
  @ViewChild('esriMapContainer') private mapContainerEl: ElementRef;

  constructor(public mapService: MapService, private esriMapService: EsriMapService, private modules: EsriModules) {
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

  // save and reset view viewpoint
  private setMapViewPoint() {

    const { whenFalse } = EsriModules.watchUtils;
    const KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
    const vpString = localStorage.getItem(KEY);

    let vp = {};
    if (vpString) {
      vp = JSON.parse(vpString);
    }
    this.esriMapService.mapView.viewpoint = EsriModules.Viewpoint.fromJSON(vp);

    whenFalse(this.esriMapService.mapView, 'updating', () => {
      const currPoint = this.esriMapService.mapView.viewpoint.toJSON();
      localStorage.setItem(KEY, JSON.stringify(currPoint));
    });
  }

  // save and reset map zoom
  private setMapCenter() {

    const { whenFalse } = EsriModules.watchUtils;
    const KEY1 = 'IMPOWER-MAP-CENTER-LONGITUDE';
    const KEY2 = 'IMPOWER-MAP-CENTER-LATITUDE';
    const vpString1 = localStorage.getItem(KEY1);
    const vpString2 = localStorage.getItem(KEY2);

    let vp1 = {};
    if (vpString1) {
      vp1 = JSON.parse(vpString1);
    } else {
      this.esriMapService.mapView.center.longitude = -98.5795;
    }

    let vp2 = {};
    if (vpString2) {
      vp2 = JSON.parse(vpString2);
    } else {
      this.esriMapService.mapView.center.latitude = 39.8282;
    }

    whenFalse(this.esriMapService.mapView, 'updating', () => {
      localStorage.setItem(KEY1, JSON.stringify(this.esriMapService.mapView.center.longitude));
      localStorage.setItem(KEY2, JSON.stringify(this.esriMapService.mapView.center.latitude));
    });
  }

    // save and reset map zoom
    private setMapZoom() {

      const { whenFalse } = EsriModules.watchUtils;
      const KEY = 'IMPOWER-MAP-ZOOM';
      const vpString = localStorage.getItem(KEY);

      let vp = {};
      if (vpString) {
        vp = JSON.parse(vpString);
      } else {
        this.esriMapService.mapView.zoom = 4;
      }

      whenFalse(this.esriMapService.mapView, 'updating', () => {
        localStorage.setItem(KEY, JSON.stringify(this.esriMapService.mapView.zoom));
      });
    }

  // save and reset map height
  private setMapHeight(el: ElementRef) {

    if (el){
      console.log ('mapContainerEl (clientHeight) = ' + el.nativeElement.clientHeight);

      const { whenFalse } = EsriModules.watchUtils;
      const KEY = 'IMPOWER-MAP-HEIGHT';
      const mapString = localStorage.getItem(KEY);

      let mapHeight: number;

      if (mapString) {
        mapHeight = <number> JSON.parse(mapString);
        console.log ('local storage (' + KEY + ') = ' + mapHeight);
        this.height = mapHeight;
        console.log ('AFTER: mapContainerEl (clientHeight) = ' + el.nativeElement.clientHeight);
      }
      whenFalse(this.esriMapService.mapView, 'updating', () => {
        localStorage.setItem(KEY, JSON.stringify(el.nativeElement.clientHeight));
      });
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
      zoom: 4
    };
    this.esriMapService.loadMap(mapParams, viewParams, this.mapViewEl);
    this.mapService.createMapView();
    this.esriMapService.onReady$.subscribe(ready => {
      if (ready) {
        this.esriMapService.onClick$.subscribe(e => this.clickHandler(e));
      }
    });

    EsriModules.watchUtils.once(this.esriMapService.mapView, 'ready', () => {
      EsriMapComponent.replaceCopyrightElement();
      this.setMapHeight(this.mapContainerEl);
      this.setMapCenter();
      this.setMapZoom();
      this.setMapViewPoint();
    });
  }

  private clickHandler(evt: __esri.MapViewClickEvent){
    if (this.mapService.mapFunction === mapFunctions.SelectPoly) {
      this.mapService.selectSinglePolygon(evt);
    }
  }
}
