import { state } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// Import Models
import { AmSite } from '../models/AmSite';

// Import Services
import { AmSiteService } from '../services/AmSite.service';
import {MessageService} from '../../common/services/message.service';

@Component({
  selector: 'val-amsite-list',
  templateUrl: './AmSiteList.component.html'
})
export class AmSiteListComponent implements OnInit, OnDestroy
{
   private dbResetSubscription: Subscription;

   anInt: number = 1;
   selectAllGeos: boolean;

   amSites: AmSite[] = [];

   selectedSites: AmSite[];   
  
   constructor(private amSiteService: AmSiteService,
               private messageService: MessageService) { }

   // getAmSitesSynchronous()
   // {
   //    console.log('called getAmSites');
   //    this.amSites = this.amSiteService.getAmSites();
   // }

   getAmSites()
   {
      this.messageService.add({severity: 'success', summary: 'GetAmSites fired!', detail: 'Via MessageService'});

      this.amSiteService.getAmSites()
          .subscribe(amSites => this.amSites = amSites);
   }    

   ngOnInit()
   {
      this.getAmSites();
      // this.dbResetSubscription = this.geofootprintGeosService.onDbReset
      //                              .subscribe(() => this.getGeofootprintGeos());*/

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
    this.dbResetSubscription.unsubscribe();
  }

  toggleGeocode(amSite: AmSite) {
    console.log('toggling site: ' + amSite);
  }

  printGeocode(amSite: AmSite) {
     console.log(amSite);
  }

  logAllSites() {
    for (const site of this.amSites)
      console.log ('pk: ' + site.pk + ', name: ' + site.name);
  }

}