import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { MapService } from '../../services/map.service';
import { mapFunctions } from '../../app.component';
import {EsriMapService} from '../../esri-modules/core/esri-map.service';
import {EsriModules} from '../../esri-modules/core/esri-modules.service';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {
  @Input() zoom: number;
  @Input() centerLng: number;
  @Input() centerLat: number;
  @Input() rotation: number;

  @Output() viewCreated = new EventEmitter();

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(public mapService: MapService, private esriMapService: EsriMapService, private modules: EsriModules) {
    console.log('Constructing esri-map-component');
  }

  private static replaceCopyrightElement() {
    // Angular doesn't particularly like to modify existing DOM elements, so we have to drop down to raw JS for this
    const el = document.getElementsByClassName('esri-attribution__powered-by');
    if (el && el.length > 0 && el[0]) {
      const existingAttribution: string = el[0].innerHTML;
      el[0].innerHTML = (new Date()).toDateString() + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + existingAttribution + '<br/>   Portions © 2006-2018 TomTom and Valassis DirectMail, Inc.';
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
    EsriModules.watchUtils.once(this.esriMapService.mapView, 'ready', EsriMapComponent.replaceCopyrightElement);
  }

  public selectPolyClick(){
    console.log('fired selectPolyClick');
    let alreadyRun = false;
    this.esriMapService.mapView.on('click' , (evt) => {
      if (!alreadyRun){
        alreadyRun = true;
        const zipOrAtzs = this.esriMapService.map.layers
                               .filter((l) => l.title === 'Valassis ZIP' || l.title === 'Valassis ATZ');
        if (zipOrAtzs.length > 0) {
          this.mapService.selectSinglePolygon(evt);
        }
      }
    });
  }

  // public async selectPolyClickOld(){
  //   console.log('fired selectPolyClick');
  //       const mapView  = this.mapService.getMapView();
  //     // var graphic ,latitude , longitude;
  //     // var graphics : __esri.Graphic[] = [];
  //
  //       const color = {
  //           a: 1,
  //           r: 35,
  //           g: 93,
  //           b: 186
  //         };
  //       let layers: __esri.Layer[] = [];
  //       let i: number = 0;
  //       await mapView.on('click' , (evt) => {
  //       if (i === 0){
  //           i++;
  //           mapView.map.layers.forEach(function(layer: __esri.Layer){
  //             layers.push(layer);
  //           });
  //           let fLyrList: __esri.FeatureLayer[] = [];
  //           this.mapService.getAllFeatureLayers().then(list => {
  //             fLyrList = list;
  //           });
  //
  //           for (const lyr of layers){
  //             if (lyr.title === 'Valassis ZIP' || lyr.title === 'Valassis ATZ'){
  //               this.mapService.selectSinglePolygon(evt);
  //               break;
  //             }
  //           }
  //         }
  //         layers = [];
  //       });
  // }

  public mapClick(){
    // console.log('fired mapclick - (this.mapService.mapFunction) = ' + this.mapService.mapFunction);
    if (this.mapService.mapFunction === mapFunctions.SelectPoly) {
        this.selectPolyClick();
        //this.mapService.selectPolyClick();
    }
  }
}
