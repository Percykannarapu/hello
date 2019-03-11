import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { AppLocationService } from './app-location.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { StopBusyIndicator, ErrorNotification, StartBusyIndicator } from '@val/messaging';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
//import { HomeGeocode } from 'applications/impower/app/state/homeGeocode/homeGeo.actions';
import { reduce } from 'rxjs/internal/operators/reduce';
import { simpleFlatten } from '@val/common';
import { ImpGeofootprintLocAttribService } from '..//val-modules/targeting/services/ImpGeofootprintLocAttrib.service';

@Injectable({
   providedIn: 'root'
 })
 export class AppHomeGeocodingService {
   private spinnerKey = 'ADD_LOCATION_TAB_SPINNER';
   private homeGeokey = 'HomeGeoCalcKey';
   constructor(private store$: Store<LocalAppState>,
               private appLocationService: AppLocationService,
               private impLocationService: ImpGeofootprintLocationService,
               private impLocAttributeService: ImpGeofootprintLocAttribService ){}

   geocode(payload: {sites: ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes}) : Observable<ImpGeofootprintLocation[]>{
      const pluralize = payload.sites.length > 1 ? 's' : '';
      this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: `Geocoding ${payload.sites.length} ${payload.siteType}${pluralize}` }));
      const locationCache: ImpGeofootprintLocation[] = [];
      return this.appLocationService.geocode(payload.sites, payload.siteType).pipe(
        //reduce((accumlatorLocs, locations) => { accumlatorLocs.push(...locations); return accumlatorLocs}, [] )
        reduce((accumlatorLocs , locations) => [...accumlatorLocs, ...locations], [])
      );
   }

   validateLocations(payload: {locations: ImpGeofootprintLocation[]}){
      console.log('validateLocations:::');
      const mapLoc = this.appLocationService.validateLocactionsforpip(payload.locations);
      return mapLoc;
   }

   queryHomeGeocode(payload: Map<string, ImpGeofootprintLocation[]>){
     console.log('queryHomeGeocode for PIP');
     return this.appLocationService.queryAllHomeGeos(payload);
   }

   determineHomeDTZ(payload: {attributes: any , locationsMap: Map<string, ImpGeofootprintLocation[]>}){
     console.log('determineHomeDTZ:::');
     return this.appLocationService.determineDtzHomegeos(payload.attributes, this.impLocationService.get());
   }

   processHomeGeoAttributes(payload: {attributes: any[]}){
    console.log('process geo attributes:::');
     this.appLocationService.processHomeGeoAttributes(payload.attributes, this.impLocationService.get());
     this.appLocationService.flagHomeGeos(this.impLocationService.get(), null);
   }

   persistGeos(payload: {locations: ImpGeofootprintLocation[]}){
      this.appLocationService.persistLocationsAndAttributes(payload.locations);
      //this.impLocationService.update()
   }

   updateLocations(payload: {locations: ImpGeofootprintLocation[]}){
   // 
    //console.log('update locations', payload.locations);
    //this.impLocationService.replace(payload.locations);
    const failedLoc = this.impLocationService.get().filter(loc => loc.recordStatusCode === 'CENTROID');
    this.impLocationService.removeAll();
    this.impLocAttributeService.removeAll();
    const locations = payload.locations;
    locations.push(...failedLoc);
    //this.appLocationService.persistLocationsAndAttributes(locations);
    //this.appLocationService.persistLocationsAndAttributes(payload.locations);
    this.impLocationService.add(locations);
    this.impLocAttributeService.add(simpleFlatten(locations.map(l => l.impGeofootprintLocAttribs)));
   }

   zoomToLocations(payload: {locations: ImpGeofootprintLocation[]}){
      console.log('===zoomToLocations===');
      const successfulLocations = payload.locations.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
      if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
   }   

   private handleError(errorHeader: string, errorMessage: string, errorObject: any) {
      this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader }));
      console.error(errorMessage, errorObject);
    }
 }