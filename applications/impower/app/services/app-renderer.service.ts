import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics } from '@val/common';
import { ClearSelectedGeos, ColorPalette, EsriRendererService, SetSelectedGeos, SetShadingData } from '@val/esri';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import * as fromMapVarSelectors from 'app/impower-datastore/state/transient/map-vars/map-vars.selectors';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ShadingData } from '../../../../modules/esri/src/state/map/esri.renderer.reducer';
import { LocalAppState } from '../state/app.interfaces';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

@Injectable()
export class AppRendererService {
  public static currentDefaultTheme: ColorPalette = ColorPalette.EsriPurple;

  private mapAudienceBS$ = new BehaviorSubject<Audience[]>([]);

  constructor(private appStateService: AppStateService,
              private dataService: TargetAudienceService,
              private esriRenderer: EsriRendererService,
              private store$: Store<LocalAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.appStateService.uniqueSelectedGeocodes$.pipe (
        filter(geos => geos != null),
      ).subscribe(geos => {
        if (geos.length > 0) {
          this.store$.dispatch(new SetSelectedGeos(geos));
        } else {
          this.store$.dispatch(new ClearSelectedGeos());
        }
      });
      // Subscribe to store selectors
      this.store$.select(fromAudienceSelectors.getAudiencesOnMap).subscribe(this.mapAudienceBS$);
      this.store$.select(fromMapVarSelectors.allMapVars).subscribe(mapVars => this.updateMapVarData(mapVars));
    });
  }

  public updateMapVarData(newData: MapVar[]) : void {
    const audiences = this.mapAudienceBS$.value;
    const mapAudience = (audiences != null && audiences.length > 0) ? audiences[0] : null;
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
      if (audiences == null || audiences.length === 0)
         console.log('updateMapVarData - No audiences specified for shading');
      else {
        isNumericData = audiences[0].fieldconte != FieldContentTypeCodes.Char;
        const newAction = new SetShadingData({ data: result, isNumericData: isNumericData, theme: AppRendererService.currentDefaultTheme });
        if (isNumericData)
          newAction.payload.statistics = calculateStatistics(Object.values(result) as number[]);

        if (audiences[0].audienceSourceType === 'Online') {
          if (audiences[0].audienceSourceName === 'Audience-TA') {
            let scoreTypeLabel = audiences[0].audienceTAConfig.scoreType;
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
