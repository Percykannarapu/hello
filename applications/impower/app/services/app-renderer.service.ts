import { Injectable } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { ShadingData } from '../../../../modules/esri/src/state/map/esri.renderer.reducer';
import { TargetAudienceService } from './target-audience.service';
import { filter, withLatestFrom } from 'rxjs/operators';
import { AppStateService } from './app-state.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { calculateStatistics, mapToEntity } from '@val/common';
import { ClearSelectedGeos, ClearShadingData, ColorPalette, EsriRendererService, SetSelectedGeos, SetShadingData } from '@val/esri';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import * as fromMapVarSelectors from 'app/impower-datastore/state/transient/map-vars/map-vars.selectors';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

@Injectable()
export class AppRendererService {
  public static currentDefaultTheme: ColorPalette = ColorPalette.EsriPurple;

  private geoSubscription: Subscription;
  private dataSubscription: Subscription;

  private mapAudienceBS$ = new BehaviorSubject<Audience[]>([]);

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

    // Subscribe to store selectors
    this.store$.select(fromAudienceSelectors.getAudiencesOnMap).subscribe(this.mapAudienceBS$);
    this.store$.select(fromMapVarSelectors.allMapVars).subscribe(mapVars => this.updateMapVarData(mapVars));
  }
/*
  public updateData(newData: { [geocode: string] : ImpGeofootprintVar }) : void {
    const result: ShadingData = {};
    let isNumericData = false;
    Object.keys(newData).forEach(geocode => {
      result[geocode] = newData[geocode].value;
      if (!Number.isNaN(Number(newData[geocode].value)) && newData[geocode].value != null)
         isNumericData = true;
    });

    if (Object.keys(newData).length > 0) {
      const newAction = new SetShadingData({ data: result, isNumericData: isNumericData, theme: AppRendererService.currentDefaultTheme });
      if (isNumericData) newAction.payload.statistics = calculateStatistics(Object.values(result) as number[]);
      //US9347 - Variable Title in the Legend
      const audiences = Array.from(this.dataService.audienceMap.values()).filter(a => a.showOnMap === true);
      let legendText = null;
      let legendOption =  null;

      if (audiences[0].audienceSourceType === 'Online'){

        if (audiences[0].audienceSourceName === 'Audience-TA'){
          let scoreTypeLabel: string = null;
          scoreTypeLabel = audiences[0].audienceTAConfig.scoreType;
          if (scoreTypeLabel === 'national'){
            scoreTypeLabel = scoreTypeLabel.charAt(0).toUpperCase() + scoreTypeLabel.slice(1);
          }
          legendText = audiences[0].audienceName + ' ' + audiences[0].audienceSourceName + ' ' + scoreTypeLabel;
        }
        else if ((audiences[0].audienceSourceName === 'VLH') || (audiences[0].audienceSourceName === 'Pixel')){
          legendOption = audiences[0].dataSetOptions.find(l => l.value === audiences[0]. selectedDataSet);
          legendText = audiences[0].audienceName + ' ' +  legendOption.label;
        }
        else{
          legendOption = audiences[0].dataSetOptions.find(l => l.value === audiences[0]. selectedDataSet);
          legendText = audiences[0].audienceName + ' ' + audiences[0].audienceSourceName + ' ' + legendOption.label;
        }
      }
      else{
        legendText = audiences[0].audienceName;
      }
      if (legendText != null){
        newAction.payload.legend = legendText;
      }
        this.store$.dispatch(newAction);
    } else {
      this.store$.dispatch(new ClearShadingData());
    }
  }
*/
  public updateMapVarData(newData: MapVar[]) : void {
    const audiences = this.mapAudienceBS$.value;
    const mapAudience = (audiences != null || audiences.length > 0) ? audiences[0] : null;
    const audNumeric = (mapAudience != null) ? mapAudience.fieldconte != FieldContentTypeCodes.Char : true;
    if (mapAudience == null) {
      console.log('updateMapVarData - No audiences specified for shading');
      return;
    }

    const result: ShadingData = {};
    let isNumericData = false;

    for (let i = 0; i < newData.length; i++) {
      let finalValue: number = 0;
      let stringValue: string = '';
      let numericCount = 0;
      for (const [varPk, varValue] of Object.entries(newData[i])) {
        if (varPk !== 'geocode') {
          if (audNumeric) {
            if (!Number.isNaN(Number(varValue)) && varValue != null) {
              finalValue += parseFloat(varValue.toString());
              numericCount++;
            }
          }
          else
            stringValue = varValue.toString();
        }
      }
      result[newData[i].geocode] = (audNumeric) ? finalValue : stringValue;
    }
    if (Object.keys(newData).length > 0) {
      let legendText = null;
      let legendOption =  null;
      console.log('### updateMapVarData - made it in first if');
      if (audiences == null || audiences.length === 0)
         console.log('### updateMapVarData - No audiences specified for shading');
      else {
        isNumericData = audiences[0].fieldconte != FieldContentTypeCodes.Char;
        console.log('### updateMapVarData - shading by', audiences[0].audienceName, ', fieldconte:', audiences[0].fieldconte, ', isNumeric:', isNumericData)
        const newAction = new SetShadingData({ data: result, isNumericData: isNumericData, theme: AppRendererService.currentDefaultTheme });
        if (isNumericData)
          newAction.payload.statistics = calculateStatistics(Object.values(result) as number[]);

        if (audiences[0].audienceSourceType === 'Online') {
          if (audiences[0].audienceSourceName === 'Audience-TA') {
            let scoreTypeLabel: string = null;
            scoreTypeLabel = audiences[0].audienceTAConfig.scoreType;
            if (scoreTypeLabel === 'national') {
              scoreTypeLabel = scoreTypeLabel.charAt(0).toUpperCase() + scoreTypeLabel.slice(1);
            }
            legendText = audiences[0].audienceName + ' ' + audiences[0].audienceSourceName + ' ' + scoreTypeLabel;
          }
          else if ((audiences[0].audienceSourceName === 'VLH') || (audiences[0].audienceSourceName === 'Pixel')){
            legendOption = audiences[0].dataSetOptions.find(l => l.value === audiences[0]. selectedDataSet);
            legendText = audiences[0].audienceName + ' ' +  legendOption.label;
          }
          else {
            legendOption = audiences[0].dataSetOptions.find(l => l.value === audiences[0]. selectedDataSet);
            legendText = audiences[0].audienceName + ' ' + audiences[0].audienceSourceName + ' ' + legendOption.label;
          }
        }
        else {
          legendText = audiences[0].audienceName;
        }
        if (legendText != null) {
          newAction.payload.legend = legendText;
        }
        this.store$.dispatch(newAction);
      }
    }
    else {
      // Below is causing the esri renderer error
      //this.store$.dispatch(new ClearShadingData());
    }
  }
}
