import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { ErrorNotification, InfoNotification, StopBusyIndicator, SuccessNotification } from '@val/messaging';
import { AppLocationService } from 'app/services/app-location.service';
import { of } from 'rxjs';
import { catchError, concatMap, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { AppHomeGeocodingService } from '../../services/app-home-geocode.service';
import { ApplyTradeAreaOnEdit, Geocode, HomeGeoActionTypes, HomeGeocode, PersistLocations, ProcessHomeGeoAttributes, ReCalcHomeGeos, SaveOnValidationSuccess, ValidateEditedHomeGeoAttributes, ZoomtoLocations, ForceHomeGeos } from './homeGeo.actions';


@Injectable({ providedIn: 'root' })
export class HomeGeoEffects {
   @Effect()
   geocoding$ = this.actions$.pipe(
      ofType<Geocode>(HomeGeoActionTypes.Geocode),
      mergeMap(action => this.appHomeGeocodingService.geocode(action.payload).pipe(
        concatMap(locations => [
           new ZoomtoLocations({locations}),
           new StopBusyIndicator({ key: 'ADD_LOCATION_TAB_SPINNER' }),
           new HomeGeocode({locations, isLocationEdit: action.payload.isLocationEdit, reCalculateHomeGeos: action.payload.reCalculateHomeGeos}),
        ]),
        catchError(err =>
          of(new ErrorNotification({message: 'System encountered an error processing your request.  Please try again', notificationTitle: 'Geocoding', additionalErrorInfo: err}),
             new StopBusyIndicator({key: 'ADD_LOCATION_TAB_SPINNER'})
            )
        )
     ))
   );

   @Effect({ dispatch: false })
   recalchomegeos$ = this.actions$.pipe(
      ofType<ReCalcHomeGeos>(HomeGeoActionTypes.ReCalcHomeGeos),
      map(action => this.appHomeGeocodingService.reCalcHomeGeos(action.payload))
   );

   @Effect({ dispatch: false })
   applyTradeAreaonEdit$ = this.actions$.pipe(
      ofType<ApplyTradeAreaOnEdit>(HomeGeoActionTypes.ApplyTradeAreaOnEdit),
      map(action => this.appHomeGeocodingService.applyTradeAreaOnEdit(action.payload))
   );

   @Effect()
   homeGeocode$ = this.actions$.pipe(
      ofType<HomeGeocode>(HomeGeoActionTypes.HomeGeocode),
      map(action => this.appHomeGeocodingService.validateLocations(action.payload)),
      switchMap(locMap => this.appHomeGeocodingService.queryHomeGeocode(locMap).pipe(
         concatMap(attributes => [
            new ProcessHomeGeoAttributes({attributes, totalLocs: locMap.totalLocs, isLocationEdit: locMap.isLocationEdit, reCalculateHomeGeos: locMap.reCalculateHomeGeos}),
            new SuccessNotification({ notificationTitle: 'Home Geo', message: 'Home Geo calculation is complete.' }),
            new StopBusyIndicator({ key: 'HomeGeoCalcKey' }),
            new ApplyTradeAreaOnEdit({ isLocationEdit: locMap.isLocationEdit, reCalculateHomeGeos: locMap.reCalculateHomeGeos})
          ]),
         catchError(err => of(
          new ErrorNotification({message: 'Error HomeGeocoding', notificationTitle: 'Home Geo', additionalErrorInfo: err}),
          new StopBusyIndicator({ key: 'HomeGeoCalcKey' }),
        ))
      ))
   );

   @Effect({dispatch: false})
   processHomeGeoAttributes$ = this.actions$.pipe(
     ofType<ProcessHomeGeoAttributes>(HomeGeoActionTypes.ProcessHomeGeoAttributes),
     map(action => this.appHomeGeocodingService.processHomeGeoAttributes(action.payload))
   );

   @Effect({dispatch: false})
   persistLocations$ = this.actions$.pipe(
      ofType<PersistLocations>(HomeGeoActionTypes.PersistLocations),
      tap(action => this.appHomeGeocodingService.persistLocations(action.payload))
   );



   @Effect({ dispatch: false })
   zoomtoLocations$ = this.actions$.pipe(
      ofType<ZoomtoLocations>(HomeGeoActionTypes.ZoomtoLocations),
      map(action => this.appHomeGeocodingService.zoomToLocations(action.payload))
   );

   @Effect()
   validateEditedHomeGeoAttributes$ = this.actions$.pipe(
      ofType<ValidateEditedHomeGeoAttributes>(HomeGeoActionTypes.ValidateEditedHomeGeoAttributes),
      switchMap(action => this.appLocationService.validateHomeGeoAttributesOnEdit(action.payload.attributeList, action.payload.editedTags).pipe(
         map(val => {
            if (val.filter(item => item.length > 0).length === val.length){
               return new SaveOnValidationSuccess({ oldData: action.payload.oldData, editedTags: action.payload.editedTags, attributeList: action.payload.attributeList });
            } else {
               return new InfoNotification({ notificationTitle: 'Invalid HomeGeos', message: 'There are invalid values for one/more HomeGeoFields. Please provide valid values instead', sticky: false, life: 5000 });
            }
         })
      ))
   );

   @Effect({ dispatch: false })
   saveOnValidationSuccess$ = this.actions$.pipe(
      ofType<SaveOnValidationSuccess>(HomeGeoActionTypes.SaveOnValidationSuccess),
      tap(action => this.appLocationService.editLocationOnValidationSuccess(action.payload.oldData, action.payload.editedTags, action.payload.attributeList))
   );

   @Effect({dispatch: false})
   forceHomeGeos$ = this.actions$.pipe(
      ofType<ForceHomeGeos>(HomeGeoActionTypes.ForceHomeGeos),
      map(action => this.appHomeGeocodingService.forceHomeGeos(action.payload.isForceHomeGeo))
   );

   constructor(private actions$: Actions,
               private appHomeGeocodingService: AppHomeGeocodingService,
               private appLocationService: AppLocationService) {}

}
