import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { MapService } from '../../services/map.service';

// Import Core Modules
// import { CONFIG, MessageService } from '../core';

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

  constructor(private mapService: MapService) {}

  public async ngOnInit() {
    try {
      await this.mapService.createMapView(
          this.mapViewEl.nativeElement
      );
    }
    // tslint:disable-next-line:one-line
    catch (ex) {
      console.error(ex);
    }
  }

}
