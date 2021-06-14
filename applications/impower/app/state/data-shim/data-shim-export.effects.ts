import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { isNil, isNotNil, isString } from '@val/common';
import { ErrorNotification, MessagingActionTypes } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { AppDataShimService } from '../../services/app-data-shim.service';
import { AppExportService } from '../../services/app-export.service';
import {
  DataShimActionTypes,
  ExportApioNationalData,
  ExportCustomTAIssuesLog,
  ExportGeofootprint,
  ExportHGCIssuesLog,
  ExportLocations,
  ExportMCIssuesLog
} from './data-shim.actions';

@Injectable({ providedIn: 'root' })
export class DataShimExportEffects {

  @Effect()
  exportGeofootprint$ = this.actions$.pipe(
    ofType<ExportGeofootprint>(DataShimActionTypes.ExportGeofootprint),
    withLatestFrom(this.dataShimService.currentProject$),
    switchMap(([action, project]) => this.appExportService.exportGeofootprint(action.payload.selectedOnly, project).pipe(
      catchError(err => of(this.processError(err, 'Geofootprint Export Error'))),
    )),
  );

  @Effect()
  exportDigital$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    filter(action => action.payload.isDigitalExport),
    withLatestFrom(this.dataShimService.currentProject$),
    switchMap(([, project]) => this.appExportService.exportValassisDigital(project).pipe(
      catchError(err => of(this.processError(err, 'Valassis Digital Export Error'))),
    )),
  );

  @Effect()
  exportLocations$ = this.actions$.pipe(
    ofType<ExportLocations>(DataShimActionTypes.ExportLocations),
    filter(action => !action.payload.isDigitalExport),
    withLatestFrom(this.dataShimService.currentProject$),
    switchMap(([action, project]) => this.appExportService.exportLocations(action.payload.locationType, project).pipe(
      catchError(err => of(this.processError(err, 'Location Export Error'))),
    )),
  );

  @Effect()
  exportHGCIssuesLog$ = this.actions$.pipe(
    ofType<ExportHGCIssuesLog>(DataShimActionTypes.ExportHGCIssuesLog),
    withLatestFrom(this.dataShimService.currentProject$),
    switchMap(([action, project]) => this.appExportService.exportHomeGeoReport(action.payload.locationType, project).pipe(
      catchError(err => of(this.processError(err, 'Home Geocode Export Error'))),
    )),
  );

  @Effect({ dispatch: false })
  exportNationalExtract$ = this.actions$.pipe(
    ofType<ExportApioNationalData>(DataShimActionTypes.ExportApioNationalData),
    withLatestFrom(this.dataShimService.currentProject$),
    switchMap(([, project]) => this.appExportService.exportNationalExtract(project).pipe(
      catchError(err => of(this.processError(err, 'National Extract Export Error'))),
    )),
  );

  @Effect({ dispatch: false })
  exportCustomTAIssuesLog$ = this.actions$.pipe(
    ofType<ExportCustomTAIssuesLog>(DataShimActionTypes.ExportCustomTAIssuesLog),
    map(action => this.appExportService.exportCustomTAIssuesLog(action.payload.uploadFailures))
  );

  @Effect({ dispatch: false })
  exportMCIssuesLog$ = this.actions$.pipe(
    ofType<ExportMCIssuesLog>(DataShimActionTypes.ExportMCIssuesLog),
    map(action => this.appExportService.exportMCIssuesLog(action.payload.uploadFailures))
  );


  constructor(private actions$: Actions,
              private dataShimService: AppDataShimService,
              private appExportService: AppExportService) {}

  private processError(additionalErrorInfo: any, notificationTitle: string = 'Export Error') : ErrorNotification {
    let message = 'There was an error exporting the file';
    if (isNil(additionalErrorInfo)) {
      return new ErrorNotification({ notificationTitle, message });
    } else {
      if (additionalErrorInfo.hasOwnProperty('type') && additionalErrorInfo['type'] === MessagingActionTypes.ErrorNotification) {
        return additionalErrorInfo;
      } else if (isString(additionalErrorInfo)) {
        return new ErrorNotification({ message: additionalErrorInfo, notificationTitle });
      } else {
        if (additionalErrorInfo.hasOwnProperty('message')) {
          message = additionalErrorInfo.message;
        }
        if (additionalErrorInfo.hasOwnProperty('title')) {
          notificationTitle = additionalErrorInfo.title;
        }
        return new ErrorNotification({ message, notificationTitle, additionalErrorInfo });
      }
    }
  }
}
