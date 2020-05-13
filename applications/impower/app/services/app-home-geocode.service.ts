import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { mapBy, simpleFlatten } from '@val/common';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { Geocode, PersistLocations } from 'app/state/homeGeocode/homeGeo.actions';
import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { reduce, tap } from 'rxjs/operators';
import { ValGeocodingRequest } from '../models/val-geocoding-request.model';
import { LocalAppState } from '../state/app.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ValAudienceTradeareaService } from './app-audience-tradearea.service';
import { AppEditSiteService } from './app-editsite.service';
import { AppLocationService } from './app-location.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { ImpGeofootprintGeo } from 'app/val-modules/targeting/models/ImpGeofootprintGeo';

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
               private impProjectService: ImpProjectService,
               private confirmationService: ConfirmationService,
               private logger: LoggingService ){

                this.appEditSiteService.customData$.subscribe(message => {
                  if (message != null && message['data'] != null) {
                    this.customTradeAreaBuffer = message['data'];
                  }
                });

               }

   geocode(payload: {sites: ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes, isLocationEdit: boolean}) : Observable<ImpGeofootprintLocation[]>{
      const pluralize = payload.sites.length > 1 ? 's' : '';
      this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: `Geocoding ${payload.sites.length} ${payload.siteType}${pluralize}` }));
      return this.appLocationService.geocode(payload.sites, payload.siteType, payload.isLocationEdit).pipe(
        reduce((acc , locations) => [...acc, ...locations], [] as ImpGeofootprintLocation[]),
        tap(locs => this.logger.debug.log('Final Geocoding response count', locs.length)),
      );
   }

   reCalcHomeGeos(payload: {locations: ImpGeofootprintLocation[], siteType: SuccessfulLocationTypeCodes, reCalculateHomeGeos: boolean, isLocationEdit: boolean}){
     this.logger.debug.log('=======recalculate HomeGeos============');
     this.confirmationService.confirm({
      message: `Are you sure you want to calculate home geocodes for all your sites?<br>All customization will be lost and trade areas will be reapplied`,
      header: 'Calc Home Geocodes',
      accept: () => {
        const valGeosites: ValGeocodingRequest[] = [];
        const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home Digital ATZ']);
        const locAttrs: ImpGeofootprintLocAttrib[] = [];


        payload.locations.forEach(loc => {
            locAttrs.push(...loc.impGeofootprintLocAttribs);
            loc.impGeofootprintLocAttribs.forEach(attr => {
              if (homeGeoColumnsSet.has(attr.attributeCode)){
                attr.attributeValue = '';
              }
            });
            if (loc.recordStatusCode === 'SUCCESS' || loc.recordStatusCode === 'CENTROID'){
              loc.xcoord = null;
              loc.ycoord = null;
            }
            valGeosites.push(new ValGeocodingRequest(loc, false, true));
        });

       const sites = Array.isArray(valGeosites) ? valGeosites : [valGeosites];

       this.impLocationService.remove(payload.locations);
       this.impLocAttributeService.remove(locAttrs);
       const siteType = payload.siteType;
       const reCalculateHomeGeos = payload.reCalculateHomeGeos;
       const isLocationEdit = payload.isLocationEdit;
       this.store$.dispatch(new Geocode({sites, siteType, reCalculateHomeGeos, isLocationEdit}));
      },
      reject: () => {
       this.logger.debug.log('calcHomeGeocode aborted');
      }
    });


   }

   validateLocations(payload: {locations: ImpGeofootprintLocation[], isLocationEdit: boolean, reCalculateHomeGeos: boolean}){
      this.logger.debug.log('validateLocations:::');
      //this.store$.dispatch(new StopBusyIndicator({key: 'ADD_LOCATION_TAB_SPINNER'}));
      this.store$.dispatch(new StartBusyIndicator({ key: 'HomeGeoCalcKey', message: 'Identifying All Home Geos'}));
      const mapLoc = this.appLocationService.validateLocactionsforpip(payload.locations);
      return { LocMap: mapLoc,
               isLocationEdit: payload.isLocationEdit,
               reCalculateHomeGeos: payload.reCalculateHomeGeos,
               totalLocs: payload.locations};
   }

   queryHomeGeocode(payload: { LocMap: Map<string, ImpGeofootprintLocation[]>, isLocationEdit: boolean}){
     this.logger.debug.log('queryHomeGeocode for PIP');
     return this.appLocationService.queryAllHomeGeos(payload.LocMap);
   }

  processHomeGeoAttributes(payload: {attributes: any[], totalLocs: ImpGeofootprintLocation[], reCalculateHomeGeos: boolean, isLocationEdit: boolean}){
    this.logger.debug.log('process geo attributes:::');
    const attributesBySiteNumber: Map<any, any> = mapBy(payload.attributes, 'siteNumber');
    const locs = payload.totalLocs.filter(loc => attributesBySiteNumber.has(loc.locationNumber));

    // this.impProjectService.startTx();
    this.store$.dispatch(new PersistLocations({locations: payload.totalLocs, reCalculateHomeGeos: payload.reCalculateHomeGeos, isLocationEdit: payload.isLocationEdit}));
    this.appLocationService.processHomeGeoAttributes(payload.attributes, locs);
    // this.impProjectService.stopTx();
    this.appLocationService.flagHomeGeos(locs, null);
  }

   persistLocations(payload: {locations: ImpGeofootprintLocation[], reCalculateHomeGeos: boolean, isLocationEdit: boolean}){
     if (payload.reCalculateHomeGeos){
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
        const newTradeAreas: ImpGeofootprintTradeArea[] = [];

        const tradeAreas = this.appTradeAreaService.currentDefaults.get(ImpClientLocationTypeCodes.Site);
        const siteType = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(locations[0].clientLocationTypeCode));
        this.logger.debug.log('current defaults:::', tradeAreas, siteType);
        if (tas != null){
          this.appTradeAreaService.deleteTradeAreas(tas);
          this.appTradeAreaService.clearAll();
        }

        if (locations[0].radius1 == null && locations[0].radius2 == null && locations[0].radius3 == null){
         this.impLocationService.add(locations);
         this.impLocAttributeService.add(simpleFlatten(locations.map(l => l.impGeofootprintLocAttribs)));
         if (tradeAreas.length > 0)
            this.appTradeAreaService.applyRadiusTradeArea(tradeAreas, siteType);
        }
        else{
          this.appLocationService.persistLocationsAndAttributes(payload.locations);
        }


        if (customTAList.length > 0){
          this.appTradeAreaService.applyCustomTradeArea(customTAList);
        }
      }else{
        this.appLocationService.persistLocationsAndAttributes(payload.locations);
      }
   }

   applyTradeAreaOnEdit(payload: {isLocationEdit: boolean, reCalculateHomeGeos: boolean}) {
      if (payload.isLocationEdit || payload.reCalculateHomeGeos){
        this.tradeAreaApplyOnEdit();
      }
   }

   zoomToLocations(payload: {locations: ImpGeofootprintLocation[]}){
      this.logger.debug.log('===zoomToLocations===');
      const successfulLocations = payload.locations.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
      if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
   }

   private tradeAreaApplyOnEdit() {
    if (this.customTradeAreaBuffer != null && this.customTradeAreaBuffer !== '') {
       this.appEditSiteService.customTradeArea({'data': this.customTradeAreaBuffer});
    }

    if (this.appTradeAreaService.tradeareaType == 'audience') {
      this.audienceTradeAreaService.createAudienceTradearea(this.audienceTradeAreaService.getAudienceTAConfig())
      .subscribe(null,
      error => {
        this.logger.error.log('Error while creating audience tradearea', error);
        this.store$.dispatch(new ErrorNotification({ message: 'There was an error creating the Audience Trade Area' }));
        this.store$.dispatch(new StopBusyIndicator({ key: 'AUDIENCETA' }));
      });
    }
   }

   public handleError(errorHeader: string, errorMessage: string, errorObject: any) {
      this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader }));
      this.logger.error.log(errorMessage, errorObject);
    }

    public forceHomeGeos(isForceHomeGeo: boolean){
        const geos: string[] = [];
        const geosSet: Set<string> = new Set();
     // if (!isForceHomeGeo){
        this.impTradeAreaService.get().forEach(ta => {
          if (ta.taType === 'HOMEGEO' && ta.isActive !== isForceHomeGeo){
              ta.isActive = isForceHomeGeo;
              ta.impGeofootprintGeos.forEach(geo => {
                geosSet.add(geo.geocode);
                geo.isActive = isForceHomeGeo;
              });

          }
        });

        if (geosSet.size > 0){
          this.impGeoService.get().forEach(geo => {
            if (geosSet.has(geo.geocode))
                  geo.isActive = isForceHomeGeo;
          });
  
          this.impTradeAreaService.makeDirty();
          //this.impGeoService.makeDirty();
          this.impGeoService.update(null, null);
        }
    }
 }
