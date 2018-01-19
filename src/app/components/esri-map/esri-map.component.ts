import { SidebarModule } from 'primeng/primeng';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { MapService } from '../../services/map.service';

// Import Core Modules
import { CONFIG } from '../../core';
import { MessageService } from '../../val-modules/common/services/message.service';

@Component({
  // providers: [MapService],
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

  // sideBarToggle: boolean = false;
  // for JSAPI 4.x you can use the "any for TS types
  public mapView: any;

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(public mapService: MapService) {}

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

  public async mapClick(){ 
    console.log('fired mapclick - (this.mapService.selectPolyMode) = ' + this.mapService.selectPolyMode);
    if (this.mapService.selectPolyMode) {
        const mapView  = this.mapService.getMapView();
      // var graphic ,latitude , longitude;
      // var graphics : __esri.Graphic[] = [];

        const color = {
            a: 1,
            r: 35,
            g: 93,
            b: 186
          };
        let layers: __esri.Layer[] = [];
        let i: number = 0;  
        await mapView.on('click' , (evt) => {
        if (i === 0){
            i++;
            mapView.map.layers.forEach(function(layer: __esri.Layer){
              layers.push(layer);
            });
            let fLyrList: __esri.FeatureLayer[] = [];
            this.mapService.getAllFeatureLayers().then(list => {
              fLyrList = list;
            });  

            for (const lyr of layers){
              if (lyr.title === 'Valassis ZIP' || lyr.title === 'Valassis ATZ'){
                this.mapService.selectSinglePolygon(evt);
                break;
              }
            }
          }  
          layers = [];
        });
    } // if this.mapService.selectPolyMode
  }
}
