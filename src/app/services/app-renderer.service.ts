import { Injectable } from '@angular/core';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { calculateStatistics, Statistics } from '../app.utils';
import { TargetAudienceService } from './target-audience.service';
import { distinctUntilChanged, map, filter, withLatestFrom } from 'rxjs/operators';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AppStateService } from './app-state.service';
import { EsriRendererService } from '../esri/services/esri-renderer.service';
import { select, Store } from '@ngrx/store';
import { AppState } from '../state/app.interfaces';
import { AddNumericShadingData, AddTextShadingData, AddSelectedGeos, HighlightSelectedGeos } from '../esri/state/map/esri.renderer.actions';

export enum SmartMappingTheme {
  HighToLow = 'high-to-low',
  AboveAndBelow = 'above-and-below',
  //CenteredOn = 'centered-on',
  Extremes = 'extremes'
}

export interface OutlineSetup {
  defaultWidth: number;
  selectedWidth: number;
  selectedColor: number[] | __esri.Color;
}

export interface SmartRendererSetup {
  rampLabel: string;
  outline: OutlineSetup;
  smartTheme: {
    baseMap: __esri.Basemap;
    theme: SmartMappingTheme;
  };
}

export interface CustomRendererSetup {
  rampLabel: string;
  outline: OutlineSetup;
  customColors?: number[][];
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

  private currentData: Map<string, ImpGeofootprintVar> = new Map<string, ImpGeofootprintVar>();
  private currentStatistics: Statistics;
  private currentSelectedGeos: Set<string> = new Set<string>();

  private rendererDataReady: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public rendererDataReady$: Observable<number>;

  constructor(private appStateService: AppStateService, 
              private dataService: TargetAudienceService, 
              private esriRenderer: EsriRendererService,
              private store$: Store<AppState>) {
    this.geoSubscription = this.appStateService.uniqueSelectedGeocodes$.pipe (
      filter(geos => (geos != null) ? true : false),
      withLatestFrom(this.appStateService.applicationIsReady$.pipe(filter(ready => ready === true)))
    )
    .subscribe(([geos, ready]) => {
      this.esriRenderer.updateSelectedGeos(geos);
      this.store$.dispatch(new AddSelectedGeos(geos));
      this.store$.dispatch(new HighlightSelectedGeos(true));
      this.currentSelectedGeos.clear();
      geos.forEach(geo => this.currentSelectedGeos.add(geo));
    });

    this.esriRenderer.rendererDataReady$.subscribe(n => this.rendererDataReady.next(n));

    this.rendererDataReady$ = this.rendererDataReady.pipe(
      distinctUntilChanged()
    );

    this.dataSubscription = this.dataService.shadingData$.pipe(
      map(dataMap => Array.from(dataMap.entries()).map(([key, value]) => ({ geocode: key, data: value })))
    ).subscribe(dataList => this.updateData(dataList));
  }

  public updateData(newData: { geocode: string, data: ImpGeofootprintVar }[]) : void {
    const numericShadingData: Array<{geocode: string, data: number}> = new Array<{geocode: string, data: number}>();
    const textShadingData: Array<{geocode: string, data: string}> = new Array<{geocode: string, data: string}>();
    newData.forEach(d => {
      if (isNaN(d.data.valueNumber) || d.data.valueNumber == null) {
        for (const data of newData) {
          textShadingData.push({ geocode: data.geocode, data: data.data.valueString });
        }
        this.esriRenderer.addTextShadingData(textShadingData);
      } else {
        for (const data of newData) {
          numericShadingData.push({ geocode: data.geocode, data: data.data.valueNumber });
        }
      }
    });
    if (numericShadingData.length > 0) {
      this.esriRenderer.addNumericShadingData(numericShadingData);
      const action = new AddNumericShadingData(numericShadingData); 
      this.store$.dispatch(action);
    }
    if (newData != null && newData.length > 0 && newData[0].data.isNumber === true) {
      this.esriRenderer.setStatistics(calculateStatistics(newData.map(d => d.data.valueNumber)));
    } else {
      this.esriRenderer.setStatistics(null);
    }
    if (this.esriRenderer.getNumericShadingData().size === 0 && this.esriRenderer.getTextShadingData().size === 0) {
      return;
    }
    if (this.esriRenderer.getNumericShadingData().size > 0) {
      this.rendererDataReady.next(this.esriRenderer.getNumericShadingData().size);
    } else {
      this.rendererDataReady.next(this.esriRenderer.getTextShadingData().size);
    }
  }

  public createUnifiedRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup) : __esri.Renderer {
    const renderer: __esri.UniqueValueRenderer = <__esri.UniqueValueRenderer> this.esriRenderer.createUnifiedRenderer(defaultSymbol, setup);
    /*let dataTitle = '';
    if (this.currentSelectedGeos.size > 0) {
      const exemplar = Array.from(this.currentData.values())[0];
      const exemplarAudience = this.dataService.getAudiences(exemplar.customVarExprQuery)[0];
      dataTitle = exemplarAudience != null ? exemplarAudience.audienceName : '';
    }
    renderer.legendOptions.title = dataTitle;*/
    renderer.legendOptions.title = 'test title';
    return renderer;
  }

}
