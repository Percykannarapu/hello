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
import { TargetingProfile } from '../../Models/TargetingProfile';
import { TargetingSite } from '../../Models/TargetingSite';
import { GeoFootPrint } from '../../services/geofootprint.service';
import {GrowlModule,Message,ButtonModule} from 'primeng/primeng';





@Component({
  providers: [GeocoderService, MapService,GeoFootPrint],
  selector: 'val-geofootprint',
  templateUrl: './geofootprint.component.html',
  styleUrls: ['./geofootprint.component.css'],
})
export class GeofootprintComponent implements OnInit {
  

  public profileId : number;
  public siteId    : number;
  public mapView: __esri.MapView;
  private geocodingResponse: GeocodingResponse;
  public proString : string;
  public geofootprintCgmId : Message[] = [];
  


  constructor(
     private mapService: MapService
     ,private geocoderService: GeocoderService
    ,private geofootprintService : GeoFootPrint
    
  ) { }

  ngOnInit() {
  }

  loadGeocode(){
    
        
        //Construct targeting sites and profiles
        let targetingProfile = new TargetingProfile();
       

        this.mapView = this.mapService.getMapView();
        var tgSiteArray: TargetingSite[] = [];
        this.mapView.graphics.forEach(function(current : any) {
          let targetingSite    = new TargetingSite();

          targetingSite.address         = "testImpower";
          targetingSite.baseStatus      = "INSERT";
          targetingSite.city            = "MI";
          targetingSite.createType      = 1;
          targetingSite.crossStreet     = "impowe";
          targetingSite.dirty           = true;
          targetingSite.franchisee      = "test Impower";
          targetingSite.legacySiteId    = "test";
          targetingSite.name            = "impower";
          targetingSite.owner           = "IMpower";
          targetingSite.pk              = null;
          targetingSite.profile         = null;
          targetingSite.siteType        = 1;
          targetingSite.state           = "MI";
          targetingSite.taSource        = 1;
          targetingSite.xcoord          = current.geometry.latitude;
          targetingSite.xmlLocation     = null;
          targetingSite.xmlTradeArea    = null;
          targetingSite.ycoord          = current.geometry.longitude;
          targetingSite.zip             ="1234-5678";

          tgSiteArray.push(targetingSite);
          console.log("Targeting sites size:::"+tgSiteArray.length)

        });

        

        targetingProfile.baseStatus              = "INSERT";
        targetingProfile.clientId                = "impower";
        targetingProfile.createDate              = new Date();
        targetingProfile.createUser              = 12356;
        targetingProfile.description             = "impower";
        targetingProfile.dirty                   = true;
        targetingProfile.group                   = 1234;
        targetingProfile.methAccess              = 14
        targetingProfile.methAnalysis            = "A";
        targetingProfile.methSeason              = "2";
        targetingProfile.modifyDate              = new Date();
        targetingProfile.modifyUser              = 13567;
        targetingProfile.name                    = "test Data";
        targetingProfile.pk                      = null;
        targetingProfile.preferredDate           = null;
        targetingProfile.promoPeriodEndDate      = null;
        targetingProfile.promoPeriodStartDate    = null;
        targetingProfile.taSource                = 1;
        targetingProfile.xmlSicquery             = null;
        targetingProfile.xmlTradearea            = null;   
        targetingProfile.xmlVariables            = "impower";

        targetingProfile.sites                   = tgSiteArray
        
       
        
                

        /*
        * calling fuse service to persist the Targeting data
        */
        

        console.log("calling GeoFootPrintService to save targetingprofile");
        var observable = this.geofootprintService.saveTargetingProfile(targetingProfile);
        observable.subscribe((res) => {
          this.profileId = res.payload;
          console.log("profileid::::::"+this.profileId);

          targetingProfile =  this.loadTargetingSites(this.profileId);
         });
          
      }

      

      buildGeofootprint(targetingProfile : TargetingProfile){

        //var geofootprintMaster : GeofootprintMaster = new geofootprintMaster();
        let geoMaster           = new GeofootprintMaster();
        let geoGeos             = new GeofootprintGeo();
        let geoTaNames          = new GeofootprintTaName();
        let geoTradeAreas       = new GeofootprintTradeArea();
        let geoVars             = new GeofootprintVar();
        
        // array implementation
        
        
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
      
         var geoSiteArray: GeofootprintSite[] = [];
         for(let tgsite of targetingProfile.sites){
           let geoSites            = new GeofootprintSite();
                    geoSites.baseStatus             = "INSERT";
                    geoSites.cgmId                  = null;
                    geoSites.dirty                  = true;
                    geoSites.geoProfileId           = null;
                    geoSites.geoProfileTypeAbbr     = null;
                    geoSites.gsId                   = null;
                    geoSites.homeGeocode            = "48170G1";
                    geoSites.homeGeoName            = "Impower";
                    geoSites.profile                = tgsite.profile;
                    geoSites.site                   = tgsite.pk;
                    geoSites.siteAddress            = "IMPOWER TEST SITE";
                    geoSites.siteCity               = "FARMINGTON HILLS";
                    geoSites.siteFranchisee         = "IMPOWER";
                    geoSites.siteIdDisplay          = "TEST IMPOWER";
                    geoSites.siteName               = "IMPOWER";
                    geoSites.siteSortOrder          = 2;
                    geoSites.siteState              = "MI";
                    geoSites.siteZip                = "23220-4621";
                    geoSites.xcoord                 = tgsite.xcoord;
                    geoSites.ycoord                 = tgsite.ycoord; 

                    console.log("geosite id ::"+geoSites.site);

                    geoSiteArray.push(geoSites);
                    console.log("geoFootprint sites size:::"+geoSiteArray.length)
                    
         /*   if(geoMaster.geofootprintSites.length>1){
                 console.log("inside:::"+geoMaster.geofootprintSites.length)
                 geoMaster.geofootprintSites = geoMaster.geofootprintSites.concat(geoMaster.geofootprintSites);
            } */
                 

        }
        
        geoMaster.geofootprintSites = geoSiteArray;
        
        
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
/*
        console.log("calling GeododerService to save GrofootprintMaster");
        var observable = this.geocoderService.saveGeofootprintMaster(geoMaster);
        observable.subscribe((res) => {
          const glowmessage : Message= res.payload;
          console.log("In geofootprint response: " + JSON.stringify(glowmessage, null, 4));
          this.geofootprintCgmId.push({severity:'success', summary:'GeoFootprint save', detail:JSON.stringify(glowmessage, null, 4)});
          console.log("geofootprintCgmId::"+this.geofootprintCgmId);
          return;  
        });*/

      }

      loadTargetingSites(profileId : number): any{
        console.log("fired loadTargetingSites:::");
        var observable = this.geofootprintService.loadTargetingProfile(profileId);
        observable.subscribe((res) => {
          let targetingprofile  = new TargetingProfile();
          targetingprofile = res.payload;
         console.log("tostring ::::"+ JSON.stringify(targetingprofile, null, 4));
         console.log("text ::::    "+targetingprofile.pk);
         this.buildGeofootprint(targetingprofile);
        });

      }
}
