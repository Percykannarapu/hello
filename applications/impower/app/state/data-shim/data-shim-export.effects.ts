import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AppExportService } from '../../services/app-export.service';
import { DataShimActionTypes, ExportApioNationalData, ExportGeofootprint,ExportHGCIssuesLog, ExportLocations } from './data-shim.actions';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ErrorNotification, MessagingActionTypes } from '@val/messaging';
import { toPayload } from '@val/common';

@Injectable({ providedIn: 'root' })
export class DataShimExportEffects {

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(DataShimActionTypes.ExportGeofootprint),
    toPayload(),
    switchMap(p => this.appExportService.exportGeofootprint(p.selectedOnly, p.currentProject).pipe(
      catchError(err => of(this.processError(err))),
    )),
  );

  @Effect()
  exportDigital$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    toPayload(),
    filter(p => p.isDigitalExport),
    switchMap(p => this.appExportService.exportValassisDigital(p.currentProject).pipe(
      catchError(err => of(this.processError(err))),
    )),
  );

  @Effect()
  exportLocations$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    toPayload(),
    filter(p => !p.isDigitalExport),
    switchMap(p => this.appExportService.exportLocations(p.locationType, p.currentProject).pipe(
      catchError(err => of(this.processError(err))),
    )),
  );

  @Effect()
  exportHGCIssuesLog$ = this.actions$.pipe(
    ofType<ExportHGCIssuesLog>(DataShimActionTypes.ExportHGCIssuesLog),
    toPayload(),
    switchMap(p => this.appExportService.exportHomeGeoReport(p.locationType).pipe(
      catchError(err => of(this.processError(err))),
    )),
  );

  @Effect({ dispatch: false })
  exportNationalExtract$ = this.actions$.pipe(
    ofType<ExportApioNationalData>(DataShimActionTypes.ExportApioNationalData),
    switchMap(action => this.appExportService.exportNationalExtract(action.payload.currentProject).pipe(
      catchError(err => of(this.processError(err))),
    )),
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
