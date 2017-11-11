import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { MapService } from '../services/map.service';

// also import the "angular2-esri-loader" to be able to load JSAPI modules
import { EsriLoaderService } from 'angular2-esri-loader';

// Import Core Modules
import { CONFIG, MessageService } from '../core';

@Component({
  providers: [MapService],
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

  // for JSAPI 4.x you can use the "any for TS types
  public mapView: any;

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(
    private esriLoader: EsriLoaderService,
    private mapService: MapService
  ) { this.zoom = 12;
/*    this.centerLng = -12.287;  // The island
      this.centerLat = -37.114;*/

      this.centerLng = -118.244;
      this.centerLat =  34.052;
    }

  public ngOnInit() {
    // only load the ArcGIS API for JavaScript when this component is loaded
    return this.esriLoader.load({
      // use a specific version of the JSAPI
      url: CONFIG.baseUrls.esriApi, // 'https://js.arcgis.com/4.3/'
    }).then(() => {
      // load the needed Map and MapView modules from the JSAPI
      this.esriLoader.loadModules(['esri/Map',
                                   'esri/views/MapView'
                                  ])
                     .then(([Map,
                             MapView
                            ]) => {
        const mapProperties: any = {
          basemap: 'streets'           // values: hybrid, streets
        };

        const map: any = new Map(mapProperties);

        const mapViewProperties: any = {
          // create the map view at the DOM element in this component
          container: this.mapViewEl.nativeElement,
          // supply additional options
          center: [this.centerLng, this.centerLat],
          zoom: this.zoom,
          map: map // property shorthand for object literal
        };

        this.mapView = new MapView(mapViewProperties);
        this.mapService.esriLoaderService = this.esriLoader;
      });
    });
    
  }

}