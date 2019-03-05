import { Injectable } from '@angular/core';
import { Geocode, HomeGeoActionTypes, HomeGeocode, PersistGeos, ZoomtoLocations, DetermineDTZHomeGeos} from './homeGeo.actions';
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
   // tap(() => this.appDataShimService.onLoadSuccess())
   @Effect()
   geocoding$ = this.actions$.pipe(
      ofType<Geocode>(HomeGeoActionTypes.Geocode),
      //this.store$.dispatch(new StartBusyIndicator({ key, message: 'Calculating Home Geos'}));
     switchMap(action => this.appHomeGeocodingService.geocode(action.payload).pipe(
        concatMap(locations => [
           new PersistGeos({locations}),
           new ZoomtoLocations({locations}),
           new StopBusyIndicator({ key: 'ADD_LOCATION_TAB_SPINNER' }),
           new StartBusyIndicator({ key: 'HomeGeoCalcKey', message: 'Calculating Home Geos'}),
           new HomeGeocode({locations}),
        ])
     ))
   );

   @Effect()
   homeGeocode$ = this.actions$.pipe(
      ofType<HomeGeocode>(HomeGeoActionTypes.HomeGeocode),
      map(action => this.appHomeGeocodingService.validateLocations(action.payload)),
      switchMap(locMap => this.appHomeGeocodingService.queryHomeGeocode(locMap).pipe(
        map(attributes => new DetermineDTZHomeGeos({attributes, locationsMap: locMap})),
        catchError(err => of(new ErrorNotification({message: 'Error HomeGeocoding', notificationTitle: 'Home Geo'})))
      )) 
   );

   @Effect()
   determineDTZHomeGeos$ = this.actions$.pipe(
      ofType<DetermineDTZHomeGeos>(HomeGeoActionTypes.DetermineDTZHomeGeos),
      switchMap(action => this.appHomeGeocodingService.determineHomeDTZ(action.payload).pipe(
        map(attributes => this.appHomeGeocodingService.processHomeGeoAttributes(attributes, action.payload.locationsMap)),
        concatMap(attributes => [
          new SuccessNotification({ notificationTitle: 'Home Geo', message: 'Home Geo calculation is complete.' }),
          new StopBusyIndicator({ key: 'HomeGeoCalcKey' })
        ])
      ))
   );

   @Effect({ dispatch: false })
   persistGeos$ = this.actions$.pipe(
      ofType<PersistGeos>(HomeGeoActionTypes.PersistGeos),
      map(action => this.appHomeGeocodingService.persistGeos(action.payload))
   );

   @Effect({ dispatch: false })
   zoomtoLocations$ = this.actions$.pipe(
      ofType<ZoomtoLocations>(HomeGeoActionTypes.ZoomtoLocations),
      map(action => this.appHomeGeocodingService.zoomToLocations(action.payload))
   );

   constructor(private actions$: Actions, 
               private appHomeGeocodingService: AppHomeGeocodingService) {}
   
}