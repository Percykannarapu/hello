import { DataDemoComponent } from './../../../demo/view/datademo.component';
import { state } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MapService } from '../../../services/map.service';
import { GeocoderComponent } from '../../../components/geocoder/geocoder.component';
import { EsriLoaderWrapperService } from '../../../services/esri-loader-wrapper.service';
import { AppService } from '../../../services/app.service';

// Import Models
import { AmSite } from '../models/AmSite';

// Import Services
import { AmSiteService } from '../services/AmSite.service';
import {MessageService} from '../../common/services/message.service';
import { SelectItem } from 'primeng/components/common/selectitem';

@Component({
  selector: 'val-amsite-list',
  templateUrl: './AmSiteList.component.html'
})
export class AmSiteListComponent implements OnInit, OnDestroy
{
   private dbResetSubscription: Subscription;

   // Flags to control display of modal dialogs
   displayAddDialog: boolean = false;
   displaySearchDialog: boolean = false;

   anInt: number = 1;
   selectAllGeos: boolean;

  // amSites: AmSite[] = [];
    cols: any[];

   selectedSites: AmSite[];   
   columnOptions: SelectItem[];
  
   constructor(public amSiteService: AmSiteService,
               private messageService: MessageService,
               private mapService: MapService, private appService: AppService) { }

   // getAmSitesSynchronous()
   // {
   //    console.log('called getAmSites');
   //    this.amSites = this.amSiteService.getAmSites();
   // }
  
   
   // zoom to a site when the user clicks the zoom button on the sites grid
   public async onZoomToSite(row: any) {
      const amSite: AmSite = new AmSite();
      amSite.address = row.address;
      amSite.city = row.city;
      amSite.state = row.state;
      amSite.zip = row.zip;
      amSite.xcoord = row.xcoord;
      amSite.ycoord = row.ycoord;
      const graphic = await this.amSiteService.createGraphic(amSite, null);
      this.mapService.zoomOnMap([graphic]);
      this.appService.closeOverLayPanel.next(true);
   }

   public onDeleteSite(site: AmSite)
   {
      console.log('Removing site: ' + site);      
      this.amSiteService.remove(site);
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
    
    this.cols = [
      {field: 'pk', header: 'Site #' , size: '30px'},
      {field: 'name', header: 'Name', size: '30px'},
      {field: 'address', header: 'Address', size: '80px'},
      {field: 'city', header: 'City', size: '45px'},
      {field: 'state', header: 'State', size: '30px'},
      {field: 'zip', header: 'Zip', size: '50px'},
      {field: 'ycoord', header: 'Latitude (Y)', size: '60px' },
      {field: 'xcoord', header: 'Latitude (X)', size: '60px'}
    ];     
      this.columnOptions = [];
      for (let i = 0; i < this.cols.length; i++) {
        this.columnOptions.push({label: this.cols[i].header, value: this.cols[i]});
    }

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
      this.amSiteService.siteWasUnselected (event.data);
      // this.msgs = [];
      // this.msgs.push({severity: 'info', summary: 'Car Unselected', detail: event.data.vin + ' - ' + event.data.brand});
      this.printSite(event.data);

      this.amSiteService.logSites();
   }

   onRowSelect(event)
   {
      console.log('Selected Site');
      // this.msgs = [];
      // this.msgs.push({severity: 'info', summary: 'Car Unselected', detail: event.data.vin + ' - ' + event.data.brand});
      this.amSiteService.refreshMapSites();
      this.amSiteService.siteWasSelected (event.data);
      this.amSiteService.logSites();
   }
   
   printSite(amSite: AmSite) {
      console.log(amSite);
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