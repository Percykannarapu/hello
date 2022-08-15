import { Injectable } from '@angular/core';
import Basemap from '@arcgis/core/Basemap';
import { Store } from '@ngrx/store';
import { isString, mapArray } from '@val/common';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { BoundaryConfiguration } from '../models/boundary-configuration';
import { PoiConfiguration } from '../models/poi-configuration';
import { ShadingDefinition } from '../models/shading-configuration';
import { InitialEsriState, loadInitialState } from '../state/esri.actions';
import { AppState } from '../state/esri.reducers';
import { internalSelectors, selectors } from '../state/esri.selectors';
import { SetLayerLabelExpressions, SetPopupVisibility, SetSelectedLayer } from '../state/map/esri.map.actions';
import { EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { setFeaturesOfInterest } from '../state/shading/esri.shading.actions';
import { EsriBoundaryService } from './esri-boundary.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriPoiService } from './esri-poi.service';
import { EsriQueryService } from './esri-query.service';
import { EsriShadingService } from './esri-shading.service';

@Injectable()
export class EsriService {

  visibleFeatures$: BehaviorSubject<__esri.Graphic[]> = new BehaviorSubject<__esri.Graphic[]>([]);

  featuresSelected$: Subject<__esri.Graphic[]> = new Subject<__esri.Graphic[]>();
  featuresUnselected$: Subject<__esri.Graphic[]> = new Subject<__esri.Graphic[]>();
  featuresToggled$: Subject<__esri.Graphic[]> = new Subject<__esri.Graphic[]>();

  constructor(private store$: Store<AppState>,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService,
              private shadingService: EsriShadingService,
              private boundaryService: EsriBoundaryService,
              private poiService: EsriPoiService) {
    this.initializeService();
  }

  private initializeService() {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      const selectedLayerIsReady$ = this.store$.select(selectors.getEsriSelectedLayer).pipe(distinctUntilChanged());

      this.mapService.viewsCanBeQueried$.pipe(
        filter(ready => ready),
        withLatestFrom(selectedLayerIsReady$),
        switchMap(([, layerId]) => this.layerService.layerIsVisibleOnMap(layerId) ? this.queryService.queryExtent(layerId, false) : of([]))
      ).subscribe(this.visibleFeatures$);
      const poiGroups$ = this.poiService.allPoiConfigurations$.pipe(
        filter(p => p != null && p.length > 0),
        mapArray(p => p.groupName),
      );
      const boundaryGroups$ = this.boundaryService.allVisibleBoundaryConfigs$.pipe(
        filter(b => b != null && b.length > 0),
        mapArray(b => b.groupName),
      );
      combineLatest([poiGroups$, boundaryGroups$]).subscribe(([pois, boundaries]) => {
        let sortOrder = 1;
        const completedGroups = new Set<string>();
        const newBoundaries = [...boundaries].reverse();
        newBoundaries.forEach(b => {
          if (!completedGroups.has(b)) {
            const group = this.layerService.getGroup(b);
            this.mapService.map.layers.reorder(group, sortOrder++);
            completedGroups.add(b);
          }
        });
        const newPois = [...pois].reverse();
        newPois.forEach(p => {
          if (!completedGroups.has(p)) {
            const group = this.layerService.getGroup(p);
            this.mapService.map.layers.reorder(group, sortOrder++);
            completedGroups.add(p);
          }
        });
      });

      this.store$.select(internalSelectors.getEsriSelectedFeatures).pipe(
        tap({ error: err => console.error('Error selecting features', err) }),
        catchError(() => of([])),
        withLatestFrom(this.store$.select(internalSelectors.getEsriSelectedFeaturesToggle), this.store$.select(internalSelectors.getEsriSelectedFeaturesSelect))
      ).subscribe(([features, toggle, select]) => {
        if (toggle) {
          this.featuresToggled$.next(features);
        } else {
          if (select) {
            this.featuresSelected$.next(features);
          } else {
            this.featuresUnselected$.next(features);
          }
        }
      });
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

  loadInitialState(initialState: InitialEsriState, shadingDefinitions?: ShadingDefinition[], poiDefinitions?: PoiConfiguration[], boundaryDefinitions?: BoundaryConfiguration[]) : void {
    this.mapService.clear();
    this.store$.dispatch(loadInitialState(initialState));
    this.shadingService.loadShaders(shadingDefinitions);
    this.poiService.loadPoiConfig(poiDefinitions);
    this.boundaryService.loadBoundaryConfig(boundaryDefinitions);
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
