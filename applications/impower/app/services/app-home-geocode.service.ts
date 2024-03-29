import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { isEmpty, mapBy, simpleFlatten } from '@val/common';
import { ErrorNotification, MessageBoxService, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { Geocode, PersistLocations } from 'app/state/homeGeocode/homeGeo.actions';
import { PrimeIcons } from 'primeng/api';
import { Observable } from 'rxjs';
import { reduce, tap } from 'rxjs/operators';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { ValGeocodingRequest } from '../common/models/val-geocoding-request.model';
import { LocalAppState } from '../state/app.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { AppEditSiteService } from './app-editsite.service';
import { AppGeoService } from './app-geo.service';
import { AppLocationService, HomeGeoQueryResult } from './app-location.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';

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
               private impLocAttributeService: ImpGeofootprintLocAttribService,
               private appEditSiteService: AppEditSiteService,
               private impGeoService: ImpGeofootprintGeoService,
               private impProjectService: ImpProjectService,
               private appGeoService: AppGeoService,
               private appStateService: AppStateService,
               private messageService: MessageBoxService,
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

  reCalcHomeGeos(payload: { locations: ImpGeofootprintLocation[], siteType: SuccessfulLocationTypeCodes, reCalculateHomeGeos: boolean, isLocationEdit: boolean }) {
    this.logger.debug.log('=======recalculate HomeGeos============');
    const message = [
      'Are you sure you want to calculate home geocodes for all your sites?',
      'All customization will be lost and trade areas will be reapplied.'
    ];
    this.messageService.showTwoButtonModal(message, 'Calc Home Geocodes', PrimeIcons.QUESTION_CIRCLE, 'Yes', 'No')
      .subscribe(result => {
        if (result) this.verifiedReCalcHomeGeos(payload);
      });
  }

   private verifiedReCalcHomeGeos(payload: {locations: ImpGeofootprintLocation[], siteType: SuccessfulLocationTypeCodes, reCalculateHomeGeos: boolean, isLocationEdit: boolean}) {
     const sites: ValGeocodingRequest[] = [];
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
       sites.push(new ValGeocodingRequest(loc, false, true));
     });

     this.impLocationService.remove(payload.locations);
     this.impLocAttributeService.remove(locAttrs);
     const siteType = payload.siteType;
     const reCalculateHomeGeos = payload.reCalculateHomeGeos;
     const isLocationEdit = payload.isLocationEdit;
     this.store$.dispatch(new Geocode({sites, siteType, reCalculateHomeGeos, isLocationEdit}));
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

   queryHomeGeocode(payload: { LocMap: Map<string, any[]>, isLocationEdit: boolean}){
     this.logger.debug.log('queryHomeGeocode for PIP');
     return this.appLocationService.queryAllHomeGeos(payload.LocMap);
   }

  processHomeGeoAttributes(payload: {attributes: HomeGeoQueryResult[], totalLocs: ImpGeofootprintLocation[], reCalculateHomeGeos: boolean, isLocationEdit: boolean}){
    this.logger.debug.log('process geo attributes:::');
    const attributesBySiteNumber: Map<string, HomeGeoQueryResult> = mapBy(payload.attributes, 'siteNumber');
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
   }

  public handleError(errorHeader: string, errorMessage: string, errorObject: any) {
    this.store$.dispatch(new StopBusyIndicator({key: this.spinnerKey}));
    this.store$.dispatch(ErrorNotification({message: errorMessage, notificationTitle: errorHeader}));
    this.logger.error.log(errorMessage, errorObject);
  }

  public forceHomeGeos(isForceHomeGeo: boolean) {
    const currentProject = this.impProjectService.get()[0];
    if (isForceHomeGeo) {
      const clientSites = Array.from(currentProject.getImpGeofootprintLocations(true, ImpClientLocationTypeCodes.Site) ?? []);
      if (!isEmpty(clientSites) && !isEmpty(currentProject.methAnalysis)) {
        this.appGeoService.selectAndPersistHomeGeos(clientSites, currentProject.methAnalysis, this.appStateService.season$.getValue());
      }
    } else {
      const tradeAreas = currentProject.getImpGeofootprintTradeAreas().filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.HomeGeo);
      this.appTradeAreaService.deleteTradeAreas(tradeAreas);
    }
  }
}
