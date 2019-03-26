import { Injectable } from '@angular/core';
import { toPayload } from '../../../../../modules/common/src/rxjs';
import { Geocode, HomeGeoActionTypes, HomeGeocode, PersistLocations, ZoomtoLocations,
         DetermineDTZHomeGeos, ProcessHomeGeoAttributes, UpdateLocations, ApplyTradeAreaOnEdit} from './homeGeo.actions';
import { Actions, ofType, Effect} from '@ngrx/effects';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { AppHomeGeocodingService } from '../../services/app-home-geocode.service';
import { tap, map, concatMap } from 'rxjs/operators';
import { StopBusyIndicator, StartBusyIndicator } from '@val/messaging';
import { catchError } from 'rxjs/internal/operators/catchError';
import { ErrorNotification, SuccessNotification } from '@val/messaging';
import { of } from 'rxjs/internal/observable/of';




@Injectable({ providedIn: 'root' })
export class HomeGeoEffects {
   @Effect()
   geocoding$ = this.actions$.pipe(
      ofType<Geocode>(HomeGeoActionTypes.Geocode),
      //this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Home Geos'}));
     switchMap(action => this.appHomeGeocodingService.geocode(action.payload).pipe(
        concatMap(locations => [
           new PersistLocations({locations, reCalculateHomeGeos: action.payload.reCalculateHomeGeos, isLocationEdit: action.payload.isLocationEdit}),
           new HomeGeocode({locations, isLocationEdit: action.payload.isLocationEdit, reCalculateHomeGeos: action.payload.reCalculateHomeGeos}),
        ]),
        catchError(err => 
          //this.store$.dispatch(new StartBusyIndicator({ key: 'ADD_LOCATION_TAB_SPINNER', message: `Geocoding Error Geocoding please retry` }))
          of(new ErrorNotification({message: 'Error Geocoding please retry', notificationTitle: 'Geocoding'}),
             new StopBusyIndicator({key: 'ADD_LOCATION_TAB_SPINNER'}) 
            )
        )
     ))
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
        map(attributes => new DetermineDTZHomeGeos({attributes, locationsMap: locMap.LocMap, isLocationEdit: locMap.isLocationEdit, reCalculateHomeGeos: locMap.reCalculateHomeGeos})),
        catchError(err => of(
          new ErrorNotification({message: 'Error HomeGeocoding', notificationTitle: 'Home Geo'}),
          new StopBusyIndicator({ key: 'HomeGeoCalcKey' }),
        ))
      )) 
   );

   @Effect()
   determineDTZHomeGeos$ = this.actions$.pipe(
      ofType<DetermineDTZHomeGeos>(HomeGeoActionTypes.DetermineDTZHomeGeos),
      switchMap(action => this.appHomeGeocodingService.determineHomeDTZ(action.payload).pipe(
        concatMap(attributes => [
          new ProcessHomeGeoAttributes({attributes}),
          new SuccessNotification({ notificationTitle: 'Home Geo', message: 'Home Geo calculation is complete.' }),
          new StopBusyIndicator({ key: 'HomeGeoCalcKey' }),
          new ApplyTradeAreaOnEdit({ isLocationEdit: action.payload.isLocationEdit, reCalculateHomeGeos: action.payload.reCalculateHomeGeos})
        ])
      ))
   );

   @Effect({dispatch: false})
   processHomeGeoAttributes$ = this.actions$.pipe(
     ofType<ProcessHomeGeoAttributes>(HomeGeoActionTypes.ProcessHomeGeoAttributes),
     map(action => this.appHomeGeocodingService.processHomeGeoAttributes(action.payload))
   );

   @Effect()
   persistLocations$ = this.actions$.pipe(
      ofType<PersistLocations>(HomeGeoActionTypes.PersistLocations),
      tap(action => this.appHomeGeocodingService.persistLocations(action.payload)),
      concatMap(action => [
        new ZoomtoLocations(action.payload),
        new StopBusyIndicator({ key: 'ADD_LOCATION_TAB_SPINNER' }),
      ])
   );

   

   @Effect({ dispatch: false })
   zoomtoLocations$ = this.actions$.pipe(
      ofType<ZoomtoLocations>(HomeGeoActionTypes.ZoomtoLocations),
      map(action => this.appHomeGeocodingService.zoomToLocations(action.payload))
   );

   constructor(private actions$: Actions, 
               private appHomeGeocodingService: AppHomeGeocodingService) {}
   
}
