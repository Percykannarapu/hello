import { Component, OnInit } from '@angular/core';
import { GeofootprintMaster } from '../../Models/GeofootprintMaster';
import { GeofootprintSite } from '../../Models/GeofootprintSite';
import { GeofootprintTaName } from '../../Models/GeofootprintTaName';
import { GeofootprintTradeArea } from '../../Models/GeofootprintTradeArea';
import { GeofootprintVar } from '../../Models/GeofootprintVar';
import { GeofootprintGeo } from '../../Models/geofootprintGeo.model';
import { MapService } from '../../services/map.service';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';

@Component({
  providers: [GeocoderService, MapService],
  selector: 'val-geofootprint',
  templateUrl: './geofootprint.component.html',
  styleUrls: ['./geofootprint.component.css']
})
export class GeofootprintComponent implements OnInit {
  

  public profileId : number;
  public siteId    : number;
  public mapView: __esri.MapView;
  private geocodingResponse: GeocodingResponse;

  constructor(private mapService: MapService,private geocoderService: GeocoderService) { }

  ngOnInit() {
  }

  loadGeocode(){
    
          this.profileId  = 450419;
          this.siteId     = 12554944;
        //var geofootprintMaster : GeofootprintMaster = new geofootprintMaster();
        let geoMaster           = new GeofootprintMaster();
        let geoGeos             = new GeofootprintGeo();
        let geoSites            = new GeofootprintSite();
        let geoTaNames          = new GeofootprintTaName();
        let geoTradeAreas       = new GeofootprintTradeArea();
        let geoVars             = new GeofootprintVar();
        
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
        geoMaster.profile                 = this.profileId; // need to set new profile id from SDE.AM_PROFILES for every request.
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
        geoTaNames.profile                = this.profileId; // need to set new profile id from SDE.AM_PROFILES for every request.
        geoTaNames.taNameWebDisplay       = "3 Miles";
        geoTaNames.tradeArea              = 1;
        
        /* setting geofootprintTradeArea
         * CBX_GEOFOOTPRINT_TRADE_AREAS
         */
        geoTradeAreas.baseStatus          = "INSERT";
        geoTradeAreas.cgmId               = null;
        geoTradeAreas.dirty               = true;
        geoTradeAreas.gtaId               = null;
        geoTradeAreas.profile             = this.profileId; // need to set new profile id from SDE.AM_PROFILES for every request.
        geoTradeAreas.site                = this.siteId; // need to set new profile id from SDE.AM_PROFILES for every request.
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
        geoGeos.baseStatus                = "INSERT";
        geoGeos.cgmId                     = null;
        geoGeos.dirty                     = true;
        geoGeos.geocode                   = "48170G1";
        geoGeos.geoSortOrder              = 14;
        geoGeos.ggId                      = null;
        geoGeos.hhc                       = 100;
        geoGeos.profile                   = this.profileId;
        geoGeos.site                      = this.siteId;
        geoGeos.tradeArea                 = 1;
        
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
        geoVars.profile                   = this.profileId; // need to set new profile id from SDE.AM_PROFILES for every request.
        geoVars.site                      = this.siteId; // need to set new profile id from SDE.AM_PROFILES for every request.
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
          geoSites.profile                = 450419; // need to set new profile id from SDE.AM_PROFILES for every request.
          geoSites.site                   = 12554944; // need to set new profile id from SDE.AM_PROFILES for every request.
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

          if(geoMaster.geofootprintSites.length>0){
            geoMaster.geofootprintSites = geoMaster.geofootprintSites.concat(geoMaster.geofootprintSites);
          }
          
        })
        
        
        
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
           
      }

}
