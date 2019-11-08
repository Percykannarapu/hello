import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics } from '@val/common';
import { audienceShading, clearSelectionData, ColorPalette, EsriLayerService, EsriMapService, EsriRendererService, EsriUtils, geoSelectionChanged, mapViewChanged, selectors, SetRenderingData } from '@val/esri';
import { AppConfig } from 'app/app.config';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import * as fromMapVarSelectors from 'app/impower-datastore/state/transient/map-vars/map-vars.selectors';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import { BehaviorSubject, combineLatest, from, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, pairwise, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { ShadingData } from '../../../../modules/esri/src/state/renderer/esri.renderer.reducer';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { FullAppState } from '../state/app.interfaces';
import { getCurrentColorPalette } from '../state/rendering/rendering.selectors';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

@Injectable()
export class AppRendererService {
  private mapAudienceBS$ = new BehaviorSubject<Audience[]>([]);
  private mapViewWatcher: Subscription;
  private selectedWatcher: Subscription;

  private previousAnalysisLevel: string;

  constructor(private appStateService: AppStateService,
              private impGeoService: ImpGeofootprintGeoService,
              private dataService: TargetAudienceService,
              private esriRenderer: EsriRendererService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private config: AppConfig,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.appStateService.analysisLevel$.pipe(
        filter(a => a != null)
      ).subscribe(al => {
        this.setupGeoWatchers(al, this.impGeoService.storeObservable);
      });
      // Subscribe to store selectors
      this.store$.select(fromAudienceSelectors.getAudiencesOnMap).subscribe(this.mapAudienceBS$);
      this.store$.select(fromMapVarSelectors.allMapVars).pipe(
        withLatestFrom(this.store$.select(getCurrentColorPalette))
      ).subscribe(([mapVars, palette]) => this.updateMapVarData(mapVars, palette));
    });
  }

  public updateMapVarData(newData: MapVar[], currentPalette: ColorPalette) : void {
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
        const newAction = new SetRenderingData({ data: result, isNumericData: isNumericData, theme: currentPalette });
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

  async setupGeoWatchers(analysisLevel: string, geoDataStore: Observable<ImpGeofootprintGeo[]>) : Promise<void> {
    if (this.mapViewWatcher) this.mapViewWatcher.unsubscribe();
    if (this.selectedWatcher) this.selectedWatcher.unsubscribe();
    if (this.previousAnalysisLevel !== analysisLevel) {
      const previousAnalysisLevel = this.previousAnalysisLevel;
      setTimeout(() => this.store$.dispatch(clearSelectionData({ featureTypeName: previousAnalysisLevel })), 0);
      this.previousAnalysisLevel = analysisLevel;
    }
    const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel, true);
    const primaryAnalysisLayer = this.esriLayerService.getPortalLayerById(layerId);

    const layerView = await this.esriMapService.mapView.whenLayerView(primaryAnalysisLayer) as __esri.FeatureLayerView;
    this.mapViewWatcher = EsriUtils.setupWatch(layerView, 'updating').pipe(
      filter(result => !result.newValue),
      debounceTime(500),
      switchMap(result => from(EsriUtils.esriPromiseToEs6(result.target.queryFeatures())).pipe(
        map(featureSet => featureSet.features.map(f => f.attributes.geocode))
      ))
    ).subscribe(visibleGeos => this.store$.dispatch(mapViewChanged({ visibleGeos })));

    const isShaded$ = this.store$.select(selectors.getEsriRendererIsShaded).pipe(
      pairwise(),
      filter(([prev, curr]) => prev !== curr),
      tap(() => this.store$.dispatch(clearSelectionData({ featureTypeName: analysisLevel }))),
      map(([, curr]) => curr),
      startWith(false)
    );

    this.selectedWatcher = combineLatest([geoDataStore, isShaded$]).pipe(
      filter(([geos]) => geos != null),
      debounceTime(500),
    ).subscribe(([geos, isShaded]) => {
      const minScale = (analysisLevel === 'Digital ATZ') ?
        this.config.layers['digital_atz'].boundaries.minScale :
        this.config.layers[analysisLevel.toLowerCase()].boundaries.minScale;
      const selectedGeos = geos.reduce((p, c) => {
        if (c.isActive) p.push(c.geocode);
        return p;
      }, []);
      this.store$.dispatch(geoSelectionChanged({ selectedFeatureIds: selectedGeos, layerId, minScale, featureTypeName: analysisLevel, useCrossHatching: isShaded }));
    });
  }

  audienceShading(aud: Audience) {
    const val$ = withLatestFrom(
      this.store$.select(getMapVars),
      this.appStateService.analysisLevel$,
      ( val, mapVars, analysis) => ({val, mapVars, analysis})
    );
    this.store$.pipe(
      val$,
      distinctUntilChanged((prev, curr) => prev.mapVars.length === curr.mapVars.length)
    ).subscribe((val) => {
      const layerId = this.config.getLayerIdForAnalysisLevel(val.analysis, true);
      const minScale = (val.analysis === 'Digital ATZ') ?
        this.config.layers['digital_atz'].boundaries.minScale :
        this.config.layers[val.analysis.toLowerCase()].boundaries.minScale;
      this.store$.dispatch(audienceShading({ mapVars: val.mapVars, layerId, minScale }));
    }, (err) => {
      console.error('ERROR', err);
    });
  }
}
