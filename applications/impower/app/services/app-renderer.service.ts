import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { applyAudienceShading, clearSelectionData, ColorPalette, EsriLayerService, EsriMapService, EsriUtils, geoSelectionChanged, mapViewChanged, shadingSelectors } from '@val/esri';
import { AppConfig } from 'app/app.config';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { combineLatest, from, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { getMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.selectors';
import { FullAppState } from '../state/app.interfaces';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

@Injectable()
export class AppRendererService {
  private mapViewWatcher: Subscription;
  private selectedWatcher: Subscription;
  private mapShadingWatcher: Subscription;

  private previousAnalysisLevel: string;

  constructor(private appStateService: AppStateService,
              private impGeoService: ImpGeofootprintGeoService,
              private dataService: TargetAudienceService,
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
    });
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

    const isShaded$ = this.store$.select(shadingSelectors.isShaded).pipe(
      distinctUntilChanged(),
      tap(() => this.store$.dispatch(clearSelectionData({ featureTypeName: analysisLevel })))
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

  audienceShading(aud: Audience, theme: ColorPalette) {
    const isTextVariable = (aud.fieldconte === 'CHAR');
    if (this.mapShadingWatcher) this.mapShadingWatcher.unsubscribe();
    this.mapShadingWatcher = this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
      withLatestFrom(this.appStateService.analysisLevel$),
    ).subscribe(([mapVars, analysis]) => {
      const layerId = this.config.getLayerIdForAnalysisLevel(analysis, true);
      const minScale = (analysis === 'Digital ATZ') ?
        this.config.layers['digital_atz'].boundaries.minScale :
        this.config.layers[analysis.toLowerCase()].boundaries.minScale;
      this.store$.dispatch(applyAudienceShading({ mapVars: mapVars, layerId, minScale, theme, audienceName: aud.audienceName, isTextVariable }));
    }, (err) => {
      console.error('ERROR', err);
    });
  }
}
