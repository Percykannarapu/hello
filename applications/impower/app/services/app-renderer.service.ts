import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { ShadingData } from '../../../../modules/esri/src/state/map/esri.renderer.reducer';
import { TargetAudienceService } from './target-audience.service';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AppStateService } from './app-state.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { calculateStatistics, mapToEntity } from '@val/common';
import { SetSelectedGeos, ClearSelectedGeos, EsriRendererService, ClearShadingData, SetShadingData } from '@val/esri';

export enum SmartMappingTheme {
  HighToLow = 'high-to-low',
  AboveAndBelow = 'above-and-below',
  //CenteredOn = 'centered-on',
  Extremes = 'extremes'
}

const tacticianDarkPalette = [
  [114, 175, 216, 0.65],
  [165, 219, 85, 0.65],
  [241, 159, 39, 0.65],
  [218, 49, 69, 0.65]
];

@Injectable()
export class AppRendererService {
  public static currentDefaultTheme: SmartMappingTheme = SmartMappingTheme.HighToLow;

  private geoSubscription: Subscription;
  private dataSubscription: Subscription;

  constructor(private appStateService: AppStateService,
              private dataService: TargetAudienceService, 
              private esriRenderer: EsriRendererService,
              private store$: Store<LocalAppState>) {
    this.geoSubscription = this.appStateService.uniqueSelectedGeocodes$.pipe (
      filter(geos => geos != null),
      withLatestFrom(this.appStateService.applicationIsReady$),
    ).subscribe(([geos, ready]) => {
      if (geos.length > 0) {
        this.store$.dispatch(new SetSelectedGeos(geos));
      } else if (ready) {
        this.store$.dispatch(new ClearSelectedGeos());
      }
    });

    this.dataSubscription = this.dataService.shadingData$.pipe(
      map(dataMap => mapToEntity(dataMap))
    ).subscribe(dataList => this.updateData(dataList));
  }

  public updateData(newData: { [geocode: string] : ImpGeofootprintVar }) : void {
    const result: ShadingData = {};
    let isNumericData = false;
    Object.keys(newData).forEach(geocode => {
      if (Number.isNaN(Number(newData[geocode].valueNumber)) || newData[geocode].valueNumber == null) {
        result[geocode] = newData[geocode].valueString;
      } else {
        result[geocode] = newData[geocode].valueNumber;
        isNumericData = true;
      }
    });

    if (Object.keys(newData).length > 0) {
      const newAction = new SetShadingData({ data: result, isNumericData: isNumericData });
      if (isNumericData) newAction.payload.statistics = calculateStatistics(Object.values(result) as number[]);
      this.store$.dispatch(newAction);
    } else {
      this.store$.dispatch(new ClearShadingData());
    }
  }
}