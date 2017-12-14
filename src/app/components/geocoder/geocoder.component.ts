import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { InputTextModule, ButtonModule, SharedModule, FileUploadModule, GrowlModule, Message } from 'primeng/primeng';
import { GeofootprintMaster } from '../../Models/GeofootprintMaster';
import { GeofootprintSite } from '../../Models/GeofootprintSite';
import { GeofootprintTaName } from '../../Models/GeofootprintTaName';
import { GeofootprintTradeArea } from '../../Models/GeofootprintTradeArea';
import { GeofootprintVar } from '../../Models/GeofootprintVar';
import { GeofootprintGeo } from '../../Models/geofootprintGeo.model';




@Component({
  providers: [GeocoderService, MapService],
  selector: 'val-geocoder',
  templateUrl: './geocoder.component.html',
  styleUrls: ['./geocoder.component.css']
})
export class GeocoderComponent implements OnInit {

  public street: string;
  public city: string;
  public state: string;
  public zip: number;
  public xcoord: string;
  public ycoord: string;
  public CSVMessage: string;
  public geocodingErrors: Message[] = [];
  public mapView: __esri.MapView;
  public displayGcSpinner: boolean = false;

  private geocodingResponse: GeocodingResponse;
  private esriMap: __esri.Map;

  public profileId: number;
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button

  // get the map from the service and add the new graphic
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private geocoderService: GeocoderService, private mapService: MapService) { }

  ngOnInit() {
  }

  async geocodeAddress() {
    console.log('Geocoding request received in GeocoderComponent for: ' + this.street + ' ' + this.city + ' ' + this.state + ' ' + this.zip);
    const loader = EsriLoaderWrapperService.esriLoader;
    const [PopupTemplate, Graphic, Point] = await loader.loadModules(['esri/PopupTemplate', 'esri/Graphic', 'esri/geometry/Point']);
    const accountLocation: AccountLocation = {
      street: this.street,
      city: this.city,
      state: this.state,
      postalCode: this.zip
    };
    const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
    const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
    popupTemplate.content = 'Street: ' + this.street + '<br>' +
                            'City: ' + this.city + '<br>' +
                            'State: ' + this.state + '<br>' +
                            'Zip: ' + this.zip + '<br>';

    console.log('Calling GeocoderService');
    const observable = this.geocoderService.geocode(accountLocation);
    await observable.subscribe(async (res) => {
      this.disableshowBusiness = false;
      this.geocodingResponse = res.payload;
      console.log('In GeocoderComponent got back GeocodingResponse: ' + JSON.stringify(this.geocodingResponse, null, 4));
      if (this.geocodingResponse.locationQualityCode === 'E') {
        const growlMessage: Message = {
          summary: 'Failed to geocode your address',
          severity: 'error',
          detail: JSON.stringify(accountLocation, null, 4)
        };
        this.geocodingErrors[0] = growlMessage;
        return;
      }
      // giving color to our point on the map
      const color = {
        a: 1,
        r: 35,
        g: 93,
        b: 186
      };
      this.xcoord = String(this.geocodingResponse.latitude);
      this.ycoord = String(this.geocodingResponse.longitude);
      // this.mapService.plotMarker(this.geocodingResponse.latitude, this.geocodingResponse.longitude, color, popupTemplate);
      await this.mapService.createGraphic(this.geocodingResponse.latitude, this.geocodingResponse.longitude, color, popupTemplate)
        .then(async graphic => {
        graphics.push(graphic);
      });
      this.mapService.updateFeatureLayer(graphics, 'Sites');
      const pointProps: __esri.PointProperties = {
        latitude: this.geocodingResponse.latitude,
        longitude: this.geocodingResponse.longitude
      };
      const p = new Point(pointProps);
      this.mapView = this.mapService.getMapView();
      this.mapView.center = p;
      this.mapView.zoom = 7;
    });

  }

  loadVPW() {
    this.street = '19975 Victor Pkwy';
    this.city = 'Livonia';
    this.state = 'MI';
    this.zip = 48152;
  }



  showCSVMessage() {
    console.log('fired message');
    this.CSVMessage = 'Yeah, I wish this worked too';
  }

  async geocodeCSV(event) {
    console.log('fired geocodeCSV()');
    this.displayGcSpinner = true;
    const input = event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = async (data) => {
      console.log('read file data');
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      const headers = csvRecords[0].split(',');

      // make sure to start loop at 1 to skip headers
      for (let i = 1; i < csvRecords.length; i++) {
        const data = csvRecords[i].split(',');
        if (data.length === headers.length) {
          const csvRecord = [];
          for (let j = 0; j < headers.length; j++) {
            csvRecord.push(data[j]);
          }
          this.street = csvRecord[0];
          this.city = csvRecord[1];
          this.state = csvRecord[2];
          this.zip = csvRecord[3];
          await this.geocodeAddress();
        }
      }
    };
    this.displayGcSpinner = false;
  }
}
