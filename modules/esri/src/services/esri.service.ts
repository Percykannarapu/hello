import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { isString } from '@val/common';
import Basemap from 'esri/Basemap';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, take } from 'rxjs/operators';
import { ShadingDefinition } from '../models/shading-configuration';
import { InitialEsriState, loadInitialState } from '../state/esri.actions';
import { AppState, selectors } from '../state/esri.selectors';
import { SetLayerLabelExpressions, SetPopupVisibility, SetSelectedLayer } from '../state/map/esri.map.actions';
import { EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { loadShadingDefinitions, setFeaturesOfInterest } from '../state/shading/esri.shading.actions';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriQueryService } from './esri-query.service';

@Injectable()
export class EsriService {

  visibleFeatures$: BehaviorSubject<__esri.Graphic[]> = new BehaviorSubject<__esri.Graphic[]>([]);

  constructor(private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService) {
    this.initializeService();
  }

  private initializeService() {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      const mapIsStationary$ = this.mapService.watchMapViewProperty('stationary').pipe(
        filter(result => result.newValue),
        debounceTime(500)
      );
      const selectedLayerIsReady$ = this.store$.select(selectors.getEsriSelectedLayer).pipe(distinctUntilChanged());
      combineLatest([mapIsStationary$, selectedLayerIsReady$]).pipe(
        filter(([, layerId]) => layerId != null),
        switchMap(([, layerId]) => this.layerService.layerIsVisibleOnMap(layerId) ? this.queryService.queryExtent(layerId) : of([]))
      ).subscribe(g => this.visibleFeatures$.next(g), e => this.visibleFeatures$.error(e));
    });
  }

  setPopupVisibility(isVisible: boolean) : void {
    this.store$.dispatch(new SetPopupVisibility({ isVisible }));
  }

  setSelectedLayer(layerId: string) : void {
    this.store$.dispatch(new SetSelectedLayer({ layerId }));
  }

  setLayerLabelExpressions(expressions: { [layerId: string] : EsriLabelLayerOptions }) : void {
    this.store$.dispatch(new SetLayerLabelExpressions({ expressions }));
  }

  loadInitialState(initialState: InitialEsriState, shadingDefinitions?: ShadingDefinition[]) : void {
    this.store$.dispatch(loadInitialState(initialState));
    this.store$.dispatch(loadShadingDefinitions({ shadingDefinitions }));
  }

  setBasemap(basemap: string | {}) : void {
    if (isString(basemap)) {
      this.mapService.setBasemap(Basemap.fromId(basemap));
    } else {
      this.mapService.setBasemap(Basemap.fromJSON(basemap));
    }
  }

  setFeaturesOfInterest(features: string[]) : void {
    this.store$.dispatch(setFeaturesOfInterest({ features }));
  }
}
