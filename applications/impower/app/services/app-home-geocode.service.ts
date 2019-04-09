import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { SuccessfulLocationTypeCodes, ImpClientLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { AppLocationService } from './app-location.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { ValAudienceTradeareaService } from './app-audience-tradearea.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { StopBusyIndicator, ErrorNotification, StartBusyIndicator } from '@val/messaging';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { reduce } from 'rxjs/internal/operators/reduce';
import { simpleFlatten, mapBy } from '@val/common';
import { ImpGeofootprintLocAttribService } from '..//val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppEditSiteService } from './app-editsite.service';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';

interface TradeAreaDefinition {
  store: string;
  geocode: string;
  message: string;
}

@Injectable({
   providedIn: 'root'
 })
 export class AppHomeGeocodingService {
   private spinnerKey = 'ADD_LOCATION_TAB_SPINNER';
   private homeGeokey = 'HomeGeoCalcKey';
   private customTradeAreaBuffer: string;
   constructor(private store$: Store<LocalAppState>,
               private appLocationService: AppLocationService,
               private impLocationService: ImpGeofootprintLocationService,
               private impTradeAreaService: ImpGeofootprintTradeAreaService,
               private appTradeAreaService: AppTradeAreaService,
               private audienceTradeAreaService: ValAudienceTradeareaService,
               private impLocAttributeService: ImpGeofootprintLocAttribService,
               private appEditSiteService: AppEditSiteService,
               private impGeoService: ImpGeofootprintGeoService,
               private stateService: AppStateService ){
                 
                this.appEditSiteService.customData$.subscribe(message => {
                  if (message != undefined && message['data'] != undefined && message != null) {
                    this.customTradeAreaBuffer = message['data'];
                  }
                });

               }

   geocode(payload: {sites: ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes}) : Observable<ImpGeofootprintLocation[]>{
      const pluralize = payload.sites.length > 1 ? 's' : '';
      this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: `Geocoding ${payload.sites.length} ${payload.siteType}${pluralize}` }));
      const locationCache: ImpGeofootprintLocation[] = [];
      return this.appLocationService.geocode(payload.sites, payload.siteType).pipe(
        //reduce((accumlatorLocs, locations) => { accumlatorLocs.push(...locations); return accumlatorLocs}, [] )
        reduce((accumlatorLocs , locations) => [...accumlatorLocs, ...locations], [])
      );
   }

   validateLocations(payload: {locations: ImpGeofootprintLocation[], isLocationEdit: boolean, reCalculateHomeGeos: boolean}){
      console.log('validateLocations:::');
      this.store$.dispatch(new StartBusyIndicator({ key: 'HomeGeoCalcKey', message: 'Calculating Home Geos'}));
      const mapLoc = this.appLocationService.validateLocactionsforpip(payload.locations);
      return { LocMap: mapLoc, isLocationEdit: payload.isLocationEdit, reCalculateHomeGeos: payload.reCalculateHomeGeos };
   }

   queryHomeGeocode(payload: { LocMap: Map<string, ImpGeofootprintLocation[]>, isLocationEdit: boolean}){
     console.log('queryHomeGeocode for PIP');
    return this.appLocationService.queryAllHomeGeos(payload.LocMap);
   }

   determineHomeDTZ(payload: {attributes: any , locationsMap: Map<string, ImpGeofootprintLocation[]>}){
     console.log('determineHomeDTZ:::');
     return this.appLocationService.determineDtzHomegeos(payload.attributes, this.impLocationService.get());
   }

   processHomeGeoAttributes(payload: {attributes: any[]}){
    console.log('process geo attributes:::');
    const attributesBySiteNumber: Map<any, any> = mapBy(payload.attributes, 'siteNumber');
    const locs = this.impLocationService.get().filter(loc => attributesBySiteNumber.has(loc.locationNumber));
   // const loc = payload.attributes.
     this.appLocationService.processHomeGeoAttributes(payload.attributes, locs);
     this.appLocationService.flagHomeGeos(locs, null);
   }

   persistLocations(payload: {locations: ImpGeofootprintLocation[], reCalculateHomeGeos: boolean, isLocationEdit: boolean}){
     // const reCalculateHomegeos = true;
      if (payload.reCalculateHomeGeos){
        //const failedLoc = this.impLocationService.get().filter(loc => loc.recordStatusCode === 'CENTROID');
        const customTAList: TradeAreaDefinition[] = []; 
        if (this.impTradeAreaService.get().length > 0 && this.impTradeAreaService.get().filter(ta => ta.taType === 'CUSTOM').length > 0){
          this.impGeoService.get().filter(g => g.impGeofootprintTradeArea.taType === 'CUSTOM').forEach(geo => {
            const customTa: TradeAreaDefinition = {
                store: geo.impGeofootprintLocation.locationNumber, 
                geocode: geo.geocode,
                message: ''
            };
            customTAList.push(customTa);
          
          });
        }
        const tas = this.impTradeAreaService.get();
        const locations = payload.locations;
        //locations.push(...failedLoc);
        const newTradeAreas: ImpGeofootprintTradeArea[] = [];
        
        const tradeAreas = this.appTradeAreaService.currentDefaults.get(ImpClientLocationTypeCodes.Site);
        const siteType = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(locations[0].clientLocationTypeCode));
        console.log('current defaults:::', tradeAreas, siteType);

        this.appTradeAreaService.deleteTradeAreas(tas);
        this.appTradeAreaService.clearAll();
        this.impLocationService.removeAll();
        this.impLocAttributeService.removeAll();
        
        
        if (locations[0].radius1 == null && locations[0].radius2 == null && locations[0].radius3 == null){
         this.impLocationService.add(locations);
         this.impLocAttributeService.add(simpleFlatten(locations.map(l => l.impGeofootprintLocAttribs)));
         this.appTradeAreaService.applyRadiusTradeArea(tradeAreas, siteType);
        }
        else{
          this.appLocationService.persistLocationsAndAttributes(payload.locations);
        }
         
        
        if (customTAList.length > 0){
          this.appTradeAreaService.applyCustomTradeArea(customTAList);
        }
        // this.impLocationService.add(locations);
        // this.impLocAttributeService.add(simpleFlatten(locations.map(l => l.impGeofootprintLocAttribs)));
      }else{
        this.appLocationService.persistLocationsAndAttributes(payload.locations);
      }
   }

   applyTradeAreaOnEdit(payload: {isLocationEdit: boolean, reCalculateHomeGeos: boolean}) {
      if (payload.isLocationEdit || payload.reCalculateHomeGeos){
        this.tradeAreaApplyOnEdit();
      }
      
      //this.impLocationService.update()
   }

   zoomToLocations(payload: {locations: ImpGeofootprintLocation[]}){
      console.log('===zoomToLocations===');
      const successfulLocations = payload.locations.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
      if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
   }   

   private tradeAreaApplyOnEdit() {
    if (this.customTradeAreaBuffer != undefined && this.customTradeAreaBuffer != null && this.customTradeAreaBuffer != '') {
       this.appEditSiteService.customTradeArea({'data': this.customTradeAreaBuffer});
    }
    
    if (this.appTradeAreaService.tradeareaType == 'audience') {
      this.audienceTradeAreaService.createAudienceTradearea(this.audienceTradeAreaService.getAudienceTAConfig())
      .subscribe(null,
      error => {
        console.error('Error while creating audience tradearea', error);
        this.store$.dispatch(new ErrorNotification({ message: 'There was an error creating the Audience Trade Area' }));
        this.store$.dispatch(new StopBusyIndicator({ key: 'AUDIENCETA' }));
      });
    }
   }

   public handleError(errorHeader: string, errorMessage: string, errorObject: any) {
      this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader }));
      console.error(errorMessage, errorObject);
    }
 }
