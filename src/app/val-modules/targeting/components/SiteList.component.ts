import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, ISubscription } from 'rxjs/Subscription';
import { MapService } from '../../../services/map.service';
import { AppService } from '../../../services/app.service';
import { GeocodingResponse } from '../../../models/GeocodingResponse';
import { GeocodingResponseService } from '../services/GeocodingResponse.service';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintLocAttrib } from '../models/ImpGeofootprintLocAttrib';
import { MetricService } from '../../common/services/metric.service';
import { EsriModules } from '../../../esri-modules/core/esri-modules.service';
import { DefaultLayers } from '../../../models/DefaultLayers';

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
   selectedValue: String = 'Site' ;
   public impGeofootprintLocList: ImpGeofootprintLocation[] = []; // this is the entire List of Locations
   public selectedImpGeofootprintLocList: ImpGeofootprintLocation[] = []; // // this is for grid component to manage
   public impGeofootprintCompList: ImpGeofootprintLocation[] = []; // this is the entire List of Locations
   public selectedImpGeofootprintCompList: ImpGeofootprintLocation[] = []; // // this is for grid component to manage

   public impGeofootprintFilteredSitesList: ImpGeofootprintLocation[] = [];
   public impGeofootprintFilteredCompList: ImpGeofootprintLocation[] = [];

   public impGeofootprintLocAttribList: ImpGeofootprintLocAttrib[] = [];

   private locSubscription: ISubscription;
   private locAttrSubscription: ISubscription;

   selectedSites: GeocodingResponse[];
   //columnOptions: SelectItem[];

   public cols: any[] = [{ field: 'glId',                 header: 'Number',           size: '60px'},
                         { field: 'locationName',         header: 'Name',             size: '120px'},
                         { field: 'locAddres',            header: 'Address',          size: '120px'},
                         { field: 'locCity',              header: 'City',             size: '70px'},
                         { field: 'locState',             header: 'State',            size: '40px'},
                         { field: 'locZip',               header: 'ZIP',              size: '75px'},
                         { field: 'marketName',           header: 'Market',           size: '85px'},
                         { field: 'recordStatusCode',     header: 'Geocode Status',   size: '70px'},
                         { field: 'ycoord',               header: 'Latitude',         size: '80px'},
                         { field: 'xcoord',               header: 'Longitude',        size: '80px'},
                         { field: 'geocoderMatchCode',    header: 'Match Code',       size: '70px'},
                         { field: 'geocoderLocationCode', header: 'Match Quality',    size: '70px'},
                         { field: 'origAddress1',         header: 'Original Address', size: '70px'},
                         { field: 'origCity',             header: 'Original City',    size: '70px'},
                         { field: 'origState',            header: 'Original State',   size: '38px'},
                         { field: 'origPostalCode',       header: 'Original Zip',     size: '70px'}
                        ];

   constructor(public  geocodingRespService: GeocodingResponseService,
               private metricService: MetricService,
               private mapService: MapService,
               private appService: AppService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService,
               private impGeofootprintLocAttrService: ImpGeofootprintLocAttribService ) {
      this.geocodingRespService.pointsPlotted.subscribe(data => this.onGroupChange(data));
   }

   onGroupChange(selector){
     // update the grid as soon as the geocodingResponseService gives data
    if (selector === 'Site'){
     this.impGeofootprintFilteredSitesList = this.impGeofootprintLocList.filter(l => l.impClientLocationType === selector);
     this.selectedImpGeofootprintLocList = this.impGeofootprintFilteredSitesList;
     this.metricService.add('LOCATIONS', `# of ${selector}s`, this.impGeofootprintFilteredSitesList.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    } else{
      this.impGeofootprintFilteredCompList = this.impGeofootprintLocList.filter(l => l.impClientLocationType === selector);
      this.selectedImpGeofootprintCompList = this.impGeofootprintFilteredCompList;
      this.metricService.add('LOCATIONS', `# of ${selector}s`, this.impGeofootprintFilteredCompList.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }

   }

   // zoom to a site when the user clicks the zoom button on the sites grid
   public async onZoomToSite(row: any) {
      const site: GeocodingResponse = new GeocodingResponse();
      site.addressline = row.locAddres;
      site.city = row.locCity;
      site.state = row.locState;
      site.zip = row.locZip;
      site.latitude = row.ycoord;
      site.longitude = row.xcoord;
      const graphic = await this.geocodingRespService.createGraphic(site, null);
      this.mapService.zoomOnMap([graphic]);
      this.appService.closeOverLayPanel.next(true);
   }

   public onDeleteSite(loc: ImpGeofootprintLocation)
   {
      console.log('Removing site: ' + loc);
      this.geocodingRespService.remove(loc);
      this.onGroupChange(this.selectedValue);
   }

   public onEditSite(row: any){
      console.log('test row on edit::::', row);
   }

   getAmSites()
   {
//      this.messageService.add({severity: 'success', summary: 'GetAmSites fired!', detail: 'Via MessageService'});

//      this.amSiteService.getAmSites()
//          .subscribe(amSites => this.amSites = amSites);
   }

   ngOnInit()
   {
      this.locSubscription = this.impGeofootprintLocationService.storeObservable.subscribe(locData => this.onChangeLocation(locData));
      this.locAttrSubscription = this.impGeofootprintLocAttrService.storeObservable.subscribe(locAttrData => this.onChangeLocAttr(locAttrData));
   }

   private updateLocationStore() {
      this.impGeofootprintLocationService.clearAll();
      this.impGeofootprintLocationService.add(this.selectedImpGeofootprintLocList);
   }

   onChangeLocation(impGeofootprintLocation: ImpGeofootprintLocation[]) {
     const locList: ImpGeofootprintLocation[] = Array.from(impGeofootprintLocation);

     this.impGeofootprintLocList =  locList;
     //this.selectedImpGeofootprintLocList = locList;
   }

   onChangeLocAttr(impGeofootprintLocAttr: ImpGeofootprintLocAttrib[]){
     const locAttrList: ImpGeofootprintLocAttrib[] = Array.from(impGeofootprintLocAttr);
     this.impGeofootprintLocAttribList = locAttrList;
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
      //this.printSite(event.data);
      //this.geocodingRespService.logSites();
      this.updateLocationStore();
      this.mapService.clearGraphicsForParent(Number(event.data.glId));
   }

   public async onRowSelect(event)
   {
      console.log('Selected Site: ', event.data);
      // this.msgs = [];
      // this.msgs.push({severity: 'info', summary: 'Car Unselected', detail: event.data.vin + ' - ' + event.data.brand});
      console.log('grid length::' + this.geocodingRespService.sitesList.length);
      // this.geocodingRespService.refreshMapSites(this.selectedValue);
      //this.geocodingRespService.siteWasSelected (event.data);
      // this.geocodingRespService.logSites();

     // this.geocodingRespService.refreshMapSites('site');
      this.updateLocationStore();

      // const color = {a: 1, r: 35, g: 93, b: 186};
      // this.mapService.createGraphic(event.data.ycoord, event.data.xcoord, color, event.data.glId).then(graphic => {
      //    console.log('graphic: ', graphic);
//         this.mapService.zoomOnMap([graphic]);
      // });
      await this.createGraphic(event.data);
   }

   public async createGraphic(site: ImpGeofootprintLocation) {
      console.log ('SiteList.component - createGraphic - site: ', site);

      let graphic: __esri.Graphic = new EsriModules.Graphic()
      let popupTemplate: __esri.PopupTemplate = new EsriModules.PopupTemplate();

      // const popupAttributesList: GeocodingAttributes[] = site.geocodingAttributesList;

      // popupTemplate.title = `Sites`;
      // let template = `<table> <tbody>`;
      // for (const popupAttribute of popupAttributesList) {
      //       template = template + `<tr><th>${popupAttribute.attributeName}</th><td>${popupAttribute.attributeValue}</td></tr>`;
      // }
      // template = template + `</tbody> </table>`;
      // popupTemplate.content = template;

      const color = {a: 1, r: 35, g: 93, b: 186};
      console.log ('calling this.mapService.createGraphic(' + site.ycoord + ', ' + site.xcoord + ', ', color, ', null, ' + site.glId +');');
      await this.mapService.createGraphic(site.ycoord, site.xcoord, color, null, site.glId).then(res => {
         graphic = res;
     });

      this.mapService.updateFeatureLayer([graphic], DefaultLayers.SITES, true);
      console.log ('SiteList.component - createGraphic - Finished');
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

   /*filterLocAttr(id: number){
     const gridtemp: any[] = [];
     this.impGeoLocAttrList = this.impGeofootprintLocAttrService.get();
     this.impGeoLocAttrList.forEach(locAttrList => {
         const gridMap: any = {};
         locAttrList.forEach(locAttr => {
           if (locAttr.locAttributeId === id)
               gridMap[locAttr.attributeCode] = locAttr.attributeValue;
         });
         if (gridMap['Number'] >= 0 )
            gridtemp.push(gridMap);
     });
     return gridtemp;

   }*/

  /*filterAttrByLoc(locationId: number) : ImpGeofootprintLocAttrib[]
   {
      console.log('filterAttrByLoc fired:::', locationId);
      return this.impGeofootprintLocAttribList.filter(
         attr => attr.impGeofootprintLocation.glId === locationId);
   } */

   filterAttrByLoc(locationId: number)
   {
     const returnList: ImpGeofootprintLocAttrib[] = this.impGeofootprintLocAttribList.filter(
        attr => attr.impGeofootprintLocation.glId == locationId);

        const gridtemp: Map<String, String>[] = [];
        const gridMap: Map<String, String> = new Map<String, String>();
      for (const locAttr of  returnList){
           gridMap[locAttr.attributeCode] = locAttr.attributeValue;
      }
      gridtemp.push(gridMap);
     return gridtemp;
   }


}
