import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { InputTextModule, ButtonModule, SharedModule, FileUploadModule, GrowlModule, Message } from 'primeng/primeng';
import { GeofootprintMaster } from '../../Models/GeofootprintMaster';
import { GeofootprintSite } from '../../Models/GeofootprintSite';
import { GeofootprintTaName } from '../../Models/GeofootprintTaName';
import { GeofootprintTradeArea } from '../../Models/GeofootprintTradeArea';
import { GeofootprintVar } from '../../Models/GeofootprintVar';
import { GeofootprintGeo } from '../../Models/geofootprintGeo.model';
import { LinkedList } from 'ngx-bootstrap';



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

  private geocodingResponse: GeocodingResponse;
  private esriMap: __esri.Map;

  //get the map from the service and add the new graphic
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private geocoderService: GeocoderService, private mapService: MapService) { }

  ngOnInit() {
  }

  geocodeAddress() {
    console.log("Geocoding request received in GeocoderComponent for: " + this.street + " " + this.city + " " + this.state + " " + this.zip);
    var accountLocation: AccountLocation = {
      street: this.street,
      city: this.city,
      state: this.state,
      postalCode: this.zip
    }
    console.log("Calling GeocoderService")
    var observable = this.geocoderService.geocode(accountLocation);
    observable.subscribe((res) => {
      this.geocodingResponse = res.payload;
      console.log("In GeocoderComponent got back GeocodingResponse: " + JSON.stringify(this.geocodingResponse, null, 4));
      if(this.geocodingResponse.locationQualityCode == "E") {
        const growlMessage: Message = {
          summary: "Failed to geocode your address",
          severity: "error",
          detail: JSON.stringify(accountLocation, null, 4)
        }
        this.geocodingErrors[0] = growlMessage;
        return;
      }
      this.xcoord = String(this.geocodingResponse.latitude);
      this.ycoord = String(this.geocodingResponse.longitude);
      this.mapService.plotMarker(this.geocodingResponse.latitude, this.geocodingResponse.longitude);
    });
  }

  loadVPW() {
    this.street = "19975 Victor Pkwy";
    this.city = "Livonia";
    this.state = "MI";
    this.zip = 48152;
  }
  
  loadGeocode(){
    //var geofootprintMaster : GeofootprintMaster = new geofootprintMaster();
    let geoMaster           = new GeofootprintMaster();
    let geoGeos             = new GeofootprintGeo();
    let geoSites            = new GeofootprintSite();
    let geoTaNames          = new GeofootprintTaName();
    let geoTradeAreas       = new GeofootprintTradeArea();
    let geoVars             = new GeofootprintVar();
    
    let geoGeosList         = new LinkedList<GeofootprintGeo>();
    let geoSitesList        = new LinkedList<GeofootprintSite>();
    let geoTaNamesList      = new LinkedList<GeofootprintTaName>();
    let geoTradeAreasList   = new LinkedList<GeofootprintTradeArea>();
    let geoVarsList         = new LinkedList<GeofootprintVar>();

    // array implementation
    let geoGeosArray        : Array<GeofootprintGeo>
    let geoSitesArray       : Array<GeofootprintSite>
    let geoTaNamesArray     : Array<GeofootprintTaName>
    let geoTradeAreasArray  : Array<GeofootprintTradeArea>
    let geoVarsArray        : Array<GeofootprintVar>
    
    /*
     * setting geofootprintMaster
     */
    geoMaster.activeSiteCount         = 1;
    geoMaster.allowDuplicates         = 1;
    geoMaster.baseStatus              = "INSERT";
    geoMaster.cgmId                   = null;
    geoMaster.createdDate             = new Date();
    geoMaster.dirty                   = true;
    geoMaster.isMarketBased           = false;
    geoMaster.methAnalysis            = "ATZ";
    geoMaster.methSeason              = "W";
    geoMaster.profile                 = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoMaster.profileName             = "Impower test site";
    geoMaster.status                  = "SUCCESS";
    geoMaster.summaryInd              = 0;
    geoMaster.totalSiteCount          = 1;
    
    /* setting geofootprintTaNames
     * CBX_GEOFOOTPRINT_TANAMES
     */
    geoTaNames.baseStatus             = "INSERT";
    geoTaNames.cgmId                  = null;
    geoTaNames.dirty                  = true;
    geoTaNames.gtanId                 = null;
    geoTaNames.profile                = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoTaNames.taNameWebDisplay       = "3 Miles";
    geoTaNames.tradeArea              = 1;
    
    /* setting geofootprintTradeArea
     * CBX_GEOFOOTPRINT_TRADE_AREAS
     */
    geoTradeAreas.baseStatus          = "INSERT";
    geoTradeAreas.cgmId               = null;
    geoTradeAreas.dirty               = true;
    geoTradeAreas.gtaId               = null;
    geoTradeAreas.profile             = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoTradeAreas.site                = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoTradeAreas.taMinHhc            = 0;
    geoTradeAreas.taName              = "3 Miles";
    geoTradeAreas.taOverrideInd       = 0;
    geoTradeAreas.taRadius            = 3;
    geoTradeAreas.taType              = "RADIUS";
    geoTradeAreas.taUseMinHhcInd      = 0;
    geoTradeAreas.tradeArea           = 0;
    geoTradeAreas.xmlTradearea        = "None";
    
    /* Setting geofootprintGeos
     * CBX_GEOFOOTPRINT_GEOS
     */
    geoGeos.distance                  = 3.62;
    geoGeos.fk_cgm_id                 = null;
    geoGeos.fk_profile                = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoGeos.fk_site                   = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoGeos.fk_trade_area             = 1;
    geoGeos.geo_sort_order            = 14;
    geoGeos.geocode                   = "48170G1";
    geoGeos.gg_id                     = null;
    geoGeos.hhc                       = 100;
    geoGeos.isSelected                = true;
    
    /* Setting geofootprintVar
     * CBX_GEOFOOTPRINT_VAR
     */
    
    geoVars.baseStatus                = "INSERT";
    geoVars.cgmId                     = null;
    geoVars.customVarExprDisplay      = null;
    geoVars.customVarExprQuery        = null;
    geoVars.decimals                  = null;
    geoVars.dirty                     = true;
    geoVars.fieldconte                = "DISTANCE";
    geoVars.fieldname                 = "Distance to Site (miles) ImPower"
    geoVars.geocode                   = "48170G1";
    geoVars.gvId                      = null;
    geoVars.indexValue                = 130.590372;
    geoVars.isCustom                  = false;
    geoVars.isNumber                  = true;
    geoVars.isString                  = false;
    geoVars.natlAvg                   = null;
    geoVars.profile                   = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoVars.site                      = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
    geoVars.tradeArea                 = 1;
    geoVars.valueNumber               = 3.63;
    geoVars.valueString               = "3.63";
    geoVars.varPk                     = 500002;
    geoVars.varPosition               = 0; 
    
     /* setting geofootprintSites
     * CBX_GEOFOOTPRINT_SITES
     */
    this.mapView = this.mapService.getMapView();
    this.mapView.graphics.forEach( function(current : any ){
      console.log("lat:::"+current.geometry.latitude);
      console.log("long:::"+current.geometry.longitude);
      geoSites.baseStatus             = "INSERT";
      geoSites.cgmId                  = null;
      geoSites.dirty                  = true;
      geoSites.geoProfileId           = null;
      geoSites.geoProfileTypeAbbr     = null;
      geoSites.gsId                   = null;
      geoSites.homeGeocode            = "48170G1";
      geoSites.homeGeoName            = "Impower";
      geoSites.profile                = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
      geoSites.siteId                 = 12345; // need to set new profile id from SDE.AM_PROFILES for every request.
      geoSites.siteAddress            = "IMPOWER TEST SITE";
      geoSites.siteCity               = "FARMINGTON HILLS";
      geoSites.siteFranchisee         = "IMPOWER";
      geoSites.siteIdDisplay          = "TEST IMPOWER";
      geoSites.siteName               = "IMPOWER";
      geoSites.siteSortOrder          = 2;
      geoSites.siteState              = "MI";
      geoSites.siteZip                = "23220-4621";
      geoSites.xcoord                 = current.geometry.latitude;
      geoSites.ycoord                 = current.geometry.longitude;    
      //geoSitesList.add(geoSites);
      //geoSitesArray = geoSites;
      geoMaster.geofootprintSites = [geoSites];
      
    })
    
    geoGeosList.add(geoGeos);
    geoTaNamesList.add(geoTaNames);
    geoTradeAreasList.add(geoTradeAreas);
    geoVarsList.add(geoVars);
    
    /* 
     * Sitting geoLists  to GeofootprintMaster
     */
        geoMaster.geofootprintGeos          = [geoGeos];
        //geoMaster.      = geoSitesList;
        geoMaster.geofootprintTaNames       = [geoTaNames];
        geoMaster.geofootprintTradeAreas    = [geoTradeAreas];
        geoMaster.geofootprintVars          = [geoVars];
    
    
    /*
     * calling Fuse service to persist Data
     */
    console.log("calling GeododerService to save GrofootprintMaster");
    var observable = this.geocoderService.saveGeofootprintMaster(geoMaster);
    observable.subscribe((res) => {
      this.geocodingResponse = res.payload;
      console.log("In GeocoderComponent got back GeocodingResponse: " + JSON.stringify(this.geocodingResponse, null, 4));
    })
    
    
    
    
    
     /*console.log("Calling GeocoderService")
    var observable = this.geocoderService.geocode(accountLocation);
    observable.subscribe((res) => {
      this.geocodingResponse = res.payload;
      console.log("In GeocoderComponent got back GeocodingResponse: " + JSON.stringify(this.geocodingResponse, null, 4));
      if(this.geocodingResponse.locationQualityCode == "E") {
        const growlMessage: Message = {
          summary: "Failed to geocode your address",
          severity: "error",
          detail: JSON.stringify(accountLocation, null, 4)
        }
        this.geocodingErrors[0] = growlMessage;
        return;
      }
      this.xcoord = String(this.geocodingResponse.latitude);
      this.ycoord = String(this.geocodingResponse.longitude);
      this.mapService.plotMarker(this.geocodingResponse.latitude, this.geocodingResponse.longitude);
    });*/
    
    
  }

  showCSVMessage() {
    console.log("fired message");
    this.CSVMessage = "Yeah, I wish this worked too";
  }

  geocodeCSV(event) {
    console.log("fired geocodeCSV()");
    var input = event.target;
    var reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = (data) => {
      console.log("read file data");
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      const headers = csvRecords[0].split(',');

      //make sure to start loop at 1 to skip headers
      for (let i = 1; i < csvRecords.length; i++) {
        const data = csvRecords[i].split(',');
        if (data.length == headers.length) {
          const csvRecord = [];
          for (let j = 0; j < headers.length; j++) {
            csvRecord.push(data[j]);
          }
          this.street = csvRecord[0];
          this.city = csvRecord[1];
          this.state = csvRecord[2];
          this.zip = csvRecord[3];
          this.geocodeAddress();
        }
      }
    }
  }
}
