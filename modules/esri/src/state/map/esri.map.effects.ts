import { Injectable, Inject } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriMapInteractionService } from '../../services/esri-map-interaction.service';
import { EsriMapService } from '../../services/esri-map.service';
import { EsriPrintingService } from '../../services/esri-printing-service';
import { AppState, internalSelectors, selectors } from '../esri.selectors';
import { EsriMapActionTypes, FeaturesSelected, InitializeMap, InitializeMapFailure, InitializeMapSuccess, MapClicked, SetPopupVisibility, CopyCoordinatesToClipboard, SetPrintRenderer, PrintMap, PrintJobComplete, DeletePrintRenderer} from './esri.map.actions';
import { EsriAppSettingsToken, EsriAppSettings } from '../../configuration';
import { EsriGeoprocessorService } from '../../services/esri-geoprocessor.service';
import { EsriRendererService } from '../../services/esri-renderer.service';

@Injectable()
export class EsriMapEffects {

  @Effect()
  InitializeMap$ = this.actions$.pipe(
    ofType<InitializeMap>(EsriMapActionTypes.InitializeMap),
    switchMap(action => this.mapService.initializeMap(action.payload.domContainer, action.payload.baseMap)),
    map(() => new InitializeMapSuccess()),
    catchError(err => of(new InitializeMapFailure({ errorResponse: err })))
  );

  @Effect()
  handleMapClick$ = this.actions$.pipe(
    ofType<MapClicked>(EsriMapActionTypes.MapClicked),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapButtonState))),
    filter(([action, state]) => state === SelectedButtonTypeCodes.SelectSinglePoly),
    mergeMap(([action]) => this.mapInteractionService.processClick(action.payload.event)),
    map(features => new FeaturesSelected({ features }))
  );

  @Effect()
  handleMapClickHandler$ = this.actions$.pipe(
    ofType<MapClicked>(EsriMapActionTypes.MapClicked),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapButtonState))),
    filter(([action, state]) => state === SelectedButtonTypeCodes.XY),
    map( action => new CopyCoordinatesToClipboard({ event: action[0].payload.event}))
  );

  @Effect({ dispatch: false })
  handleCopyCoordinatesToClipboard$ = this.actions$.pipe(
    ofType<CopyCoordinatesToClipboard>(EsriMapActionTypes.CopyCoordinatesToClipboard),
    tap(action => this.layerService.enableLatLongTool(action))
  );

  @Effect({ dispatch: false })
  handlePopupVisibilityChange$ = this.actions$.pipe(
    ofType<SetPopupVisibility>(EsriMapActionTypes.SetPopupVisibility),
    tap(action => this.layerService.setAllPopupStates(action.payload.isVisible))
  );

  @Effect({ dispatch: false })
  handleLabels$ = this.actions$.pipe(
    ofType(EsriMapActionTypes.SetLabelConfiguration, EsriMapActionTypes.SetLayerLabelExpressions),
    withLatestFrom(this.store$.pipe(select(selectors.getEsriLabelConfiguration)), this.store$.pipe(select(internalSelectors.getEsriLayerLabelExpressions))),
    tap(([action, labelConfig, layerConfig]) => this.layerService.setLabels(labelConfig, layerConfig))
  );

  @Effect()
  handlePrintMap$ = this.actions$.pipe(
    ofType<PrintMap>(EsriMapActionTypes.PrintMap),
    tap(() => console.log('Inside Print effect')),
    map((action) => ({ printParams: this.printingService.createPrintPayload(action.payload.templateOptions), serviceUrl: action.payload.serviceUrl})),
    switchMap((params) => 
    this.geoprocessorService.processPrintJob<__esri.PrintResponse>(params.serviceUrl, params.printParams)
    .pipe(
      map(response => [
        new DeletePrintRenderer({layerName: 'Selected Geos'}),
        new PrintJobComplete({result: response.url}),
      ]),
      ),
  ),
  );

  @Effect({dispatch: false})
  setShadingRenderer$ = this.actions$.pipe(
    ofType<SetPrintRenderer>(EsriMapActionTypes.SetPrintRenderer),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapState))),
    tap(() => console.log('Set Map Renderer')),
    switchMap(([action, mapState]) => this.esriRendererService.setRendererForPrint(action.payload.geos, mapState, action.payload.portalId, action.payload.minScale, true).pipe(
    )),
  );

  @Effect({dispatch: false})
  removeShadingRenderer$ = this.actions$.pipe(
    ofType<DeletePrintRenderer>(EsriMapActionTypes.DeletePrintRenderer),
    tap(() => {
      console.log('Delete Print Renderer');
      this.layerService.removeLayer('Selected Geos');
    })
  );


  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private esriRendererService: EsriRendererService,
              private mapInteractionService: EsriMapInteractionService,
              private geoprocessorService: EsriGeoprocessorService,
              private printingService: EsriPrintingService,
              @Inject(EsriAppSettingsToken) private settings: EsriAppSettings
              ) {}
}
