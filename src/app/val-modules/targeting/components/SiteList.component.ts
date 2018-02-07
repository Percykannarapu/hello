import { DataDemoComponent } from './../../../demo/view/datademo.component';
import { state } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MapService } from '../../../services/map.service';
import { GeocoderComponent } from '../../../components/geocoder/geocoder.component';
import { EsriLoaderWrapperService } from '../../../services/esri-loader-wrapper.service';
import { AppService } from '../../../services/app.service';

// Import Services
//import { AmSiteService } from '../services/AmSite.service';
import {MessageService} from '../../common/services/message.service';
import { SelectItem } from 'primeng/components/common/selectitem';
import { GeocodingResponse } from '../../../models/GeocodingResponse';
import { GeocodingResponseService } from '../services/GeocodingResponse.service';

@Component({
  selector: 'val-amsite-list',
  templateUrl: './SiteList.component.html'
})
export class SiteListComponent implements OnInit, OnDestroy
{
   private dbResetSubscription: Subscription;

   // Flags to control display of modal dialogs
   displayAddDialog: boolean = false;
   displaySearchDialog: boolean = false;

   anInt: number = 1;
   selectAllGeos: boolean;
   gridData: any;
   selectedValue: String = 'Site';

  // amSites: AmSite[] = [];
    //cols: any[];

   selectedSites: GeocodingResponse[];   
   //columnOptions: SelectItem[];
  
   constructor(public geocodingRespService: GeocodingResponseService,
               private messageService: MessageService,
               private mapService: MapService, private appService: AppService) { 

                this.geocodingRespService.pointsPlotted.subscribe(data => this.onGroupChange());
               }

   // getAmSitesSynchronous()
   // {
   //    console.log('called getAmSites');
   //    this.amSites = this.amSiteService.getAmSites();
   // }
  
   onGroupChange(){
    this.gridData = this.selectedValue === 'Site' ? this.geocodingRespService.sitesList : this.geocodingRespService.amComps;
    this.geocodingRespService.createGrid(this.gridData);
 }
   
   // zoom to a site when the user clicks the zoom button on the sites grid
   public async onZoomToSite(row: any) {
      const site: GeocodingResponse = new GeocodingResponse();
      site.addressline = row.Address;
      site.city = row.City;
      site.state = row.State;
      site.zip = row.ZIP;
      site.latitude = row.Latitude;
      site.longitude = row.Longitude;
      const graphic = await this.geocodingRespService.createGraphic(site, null);
      this.mapService.zoomOnMap([graphic]);
      this.appService.closeOverLayPanel.next(true);
   }

   public onDeleteSite(site: GeocodingResponse)
   {
      console.log('Removing site: ' + site);      
      this.geocodingRespService.remove(site);
     // MapService.pointsArray.
   }
   
   getAmSites()
   {
//      this.messageService.add({severity: 'success', summary: 'GetAmSites fired!', detail: 'Via MessageService'});

//      this.amSiteService.getAmSites()
//          .subscribe(amSites => this.amSites = amSites);
   }    
  
   ngOnInit()
   {
      //this.getAmSites();
      // this.dbResetSubscription = this.geofootprintGeosService.onDbReset
      //                              .subscribe(() => this.getGeofootprintGeos());*/
    
    /*this.amSiteService.cols = [
      {field: 'number', header: 'Site #' , size: '30px'},
      {field: 'name', header: 'Name', size: '30px'},
      {field: 'addressline', header: 'Address', size: '80px'},
      {field: 'city', header: 'City', size: '45px'},
      {field: 'state', header: 'State', size: '30px'},
      {field: 'zip', header: 'Zip', size: '50px'},
      {field: 'latitude', header: 'Latitude (Y)', size: '60px' },
      {field: 'longitude', header: 'Longitude (X)', size: '60px'},
      {field: 'matchCode', header: 'MatchCode', size: '30px'}
    ];     
      this.amSiteService.columnOptions = [];
      for (let i = 0; i < this.amSiteService.cols.length; i++) {
        this.amSiteService.columnOptions.push({label: this.amSiteService.cols[i].header, value: this.amSiteService.cols[i]});
      }*/

/*      
      this.http.get('/api/items').subscribe(data => {
      // Read the result field from the JSON response.
      this.results = data['results'];
      });

      this.amSiteService.getAmSites().state.subscribe((data) => { // use methods in our service
      this.amSites = data; // data.quotes[0].quote;
      console.log('subscription.data = ' + data);
      }, 
      (err) => {
         this.amSites = err;
      });*/
   }

   ngOnDestroy() {
    // this.dbResetSubscription.unsubscribe();
   }

   onRowUnselect(event)
   {
      console.log('Unselected Site');
      console.log('event: ' + event.data);
      // this.amSiteService.unselectSites(event.data);
      this.geocodingRespService.siteWasUnselected (event.data);
      // this.msgs = [];
      // this.msgs.push({severity: 'info', summary: 'Car Unselected', detail: event.data.vin + ' - ' + event.data.brand});
      this.printSite(event.data);

      this.geocodingRespService.logSites();
   }

   onRowSelect(event)
   {
      console.log('Selected Site');
      // this.msgs = [];
      // this.msgs.push({severity: 'info', summary: 'Car Unselected', detail: event.data.vin + ' - ' + event.data.brand});
      console.log('grid length::' + this.geocodingRespService.sitesList.length);
      this.geocodingRespService.refreshMapSites();
      this.geocodingRespService.siteWasSelected (event.data);
      this.geocodingRespService.logSites();
   }
   
   printSite(site: GeocodingResponse) {
      console.log(site);
   }

   // Toggle Modal Dialog Methods
   showAddDialog()
   {
      this.displayAddDialog = true;
   }

   showSearchDialog()
   {
      this.displaySearchDialog = true;
   }  
}