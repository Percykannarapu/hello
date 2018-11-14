import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AppExportService } from '../../services/app-export.service';
import { DataShimActionTypes, ExportApioNationalData, ExportGeofootprint, ExportLocations } from './data-shim.actions';
import { toPayload } from '../../val-modules/common/common.rxjs';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { CreateGaugeMetric } from '../usage/usage.actions';
import { of } from 'rxjs';
import { ErrorNotification, MessagingActionTypes } from '../../messaging';

@Injectable({ providedIn: 'root' })
export class DataShimExportEffects {

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(DataShimActionTypes.ExportGeofootprint),
    toPayload(),
    map(p => this.appExportService.exportGeofootprint(p.selectedOnly, p.currentProject)),
    mergeMap(metric => [
      metric,
      new CreateGaugeMetric({ gaugeAction: 'location-geofootprint-export' })
    ]),
    catchError(err => of(this.processError(err))),
  );

  @Effect()
  exportDigital$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    toPayload(),
    filter(p => p.isDigitalExport),
    map(p => this.appExportService.exportValassisDigital(p.currentProject)),
    catchError(err => of(this.processError(err))),
  );

  @Effect()
  exportLocations$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    toPayload(),
    filter(p => !p.isDigitalExport),
    map(p => this.appExportService.exportLocations(p.locationType, p.currentProject)),
    catchError(err => of(this.processError(err))),
  );

  @Effect({ dispatch: false })
  exportNationalExtract$ = this.actions$.pipe(
    ofType<ExportApioNationalData>(DataShimActionTypes.ExportApioNationalData),
    tap(action => this.appExportService.exportNationalExtract(action.payload.currentProject)),
    catchError(err => of(this.processError(err))),
  );

  constructor(private actions$: Actions,
              private appExportService: AppExportService) {}

  private processError(err: any) : ErrorNotification {
    const notificationTitle = 'Export Error';
    if (err.hasOwnProperty('type') && err['type'] === MessagingActionTypes.ErrorNotification) {
      return err;
    } else if (typeof err === 'string') {
      return new ErrorNotification({ message: err, notificationTitle });
    } else {
      return new ErrorNotification({ message: 'There was an error exporting the data', notificationTitle, additionalErrorInfo: err});
    }
  }
}
