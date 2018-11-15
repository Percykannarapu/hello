import { Injectable } from '@angular/core';
import { EsriMapService } from './esri-map.service';
import { EsriLayerService } from './esri-layer.service';
import { AppConfig } from '../../app.config';
import { EsriApi } from '../core/esri-api.service';
import { EsriQueryService } from './esri-query.service';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, withLatestFrom, tap } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';
import { Store, select } from '@ngrx/store';
import { AppState, getEsriRendererState, getEsriMapState } from '../state/esri.selectors';

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
export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
}

@Injectable({
  providedIn: 'root'
})
export class EsriRendererService {

  public static currentDefaultTheme: SmartMappingTheme = SmartMappingTheme.HighToLow;
  private rendererDataReady: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public rendererDataReady$: Observable<number>;
  private currentSelectedGeos: Set<string> = new Set<string>();
  private highlightHandlers: Array<{ remove: () => void }> = [];
  private currentStatistics: Statistics;
  private currentNumericData: Map<string, number> = new Map<string, number>();
  private currentTextData: Map<string, string> = new Map<string, string>();
  private numericData$ = new Subject<Map<string, number>>();
  private textData$ = new Subject<Map<string, string>>();
  private fieldsAdded: Set<string> = new Set<string>();
  private layerUpdating$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private watchSetup = false;
  
  constructor(private mapService: EsriMapService, 
              private layerService: EsriLayerService,
              private appConfig: AppConfig,
              private queryService: EsriQueryService,
              private store$: Store<AppState>) {
    this.numericData$.subscribe(data => {
      this.addFeatureNumericData(data);
    });

    this.textData$.subscribe(data => {
      this.addFeatureTextData(data);
    });

    this.rendererDataReady$ = this.rendererDataReady.pipe(
      distinctUntilChanged()
    );

    this.store$.pipe(
      select(getEsriRendererState),
      withLatestFrom(this.store$.pipe(select(getEsriMapState))),
      filter(([rendererState, mapState]) => rendererState != null && mapState != null),
      filter(([rendererState, mapState]) => rendererState.highlightSelectedGeos === true),
    ).subscribe(([rendererState, mapState]) => this.highlightGeos(mapState.analysisLevel, rendererState.selectedGeocodes));

  }

  private static createSymbol(fillColor: number[] | __esri.Color, outline: __esri.SimpleLineSymbol) : __esri.SimpleFillSymbol;
  private static createSymbol(fillColor: number[] | __esri.Color, outlineColor: number[] | __esri.Color, outlineWidth: number) : __esri.SimpleFillSymbol;
  private static createSymbol(fillColor: number[] | __esri.Color, outlineOrColor: number[] | __esri.Color | __esri.SimpleLineSymbol, outlineWidth?: number) : __esri.SimpleFillSymbol {
    let currentOutline: Partial<__esri.SimpleLineSymbol>;
    if (this.objectIsSimpleLine(outlineOrColor)) {
      currentOutline = outlineOrColor.clone();
    } else {
      currentOutline = {
        color: Array.isArray(outlineOrColor) ? new EsriApi.Color(outlineOrColor) : outlineOrColor,
        style: 'solid',
        type: 'simple-line',
        width: outlineWidth
      };
    }
    return new EsriApi.SimpleFillSymbol({
      color: Array.isArray(fillColor) ? new EsriApi.Color(fillColor) : fillColor,
      style: 'solid',
      outline: currentOutline,
    });
  }

  private static getThemeColors(rendererSetup: SmartRendererSetup | CustomRendererSetup, dataLength?: number) : __esri.Color[] {
    const result = [];
    if (this.rendererIsSmart(rendererSetup)) {
      const smartTheme = rendererSetup.smartTheme.theme || this.currentDefaultTheme;
      const theme = EsriApi.symbologyColor.getSchemes({
        basemap: rendererSetup.smartTheme.baseMap,
        geometryType: 'polygon',
        theme: smartTheme
      });
      if (dataLength == null) {
        result.push(...theme.primaryScheme.colors.map(c => {
          c.a = 0.65;
          return c;
        }));
      } else {
        result.push(...theme.primaryScheme.colorsForClassBreaks.filter(cb => cb.numClasses === dataLength)[0].colors.map(c => {
          c.a = 0.65;
          return c;
        }));
      }
    } else if (rendererSetup.customColors != null) {
      result.push(...rendererSetup.customColors.map(rgba => new EsriApi.Color(rgba)));
    } else {
      result.push(...tacticianDarkPalette.map(rgba => new EsriApi.Color(rgba)));
    }
    return result;
  }

  private static objectIsSimpleLine(l: any) : l is __esri.SimpleLineSymbol {
    return l != null && l.type === 'simple-line';
  }

  private static rendererIsSmart(r: SmartRendererSetup | CustomRendererSetup) : r is SmartRendererSetup {
    return r != null && r.hasOwnProperty('smartTheme');
  }

  /**
   * Update the list of selected geos for highlighting purposes
   * @param geocodes the list of selected geos
   */
  public updateSelectedGeos(geocodes: string[]) {
    for (const geocode of geocodes) {
      this.currentSelectedGeos.add(geocode);
    }
  }

  /**
   * Clear the currently selected geos
   */
  public clearSelectedGeos() {
    this.currentSelectedGeos.clear();
  }

  public setStatistics(statistics: Statistics) {
    this.currentStatistics = statistics;
  }

  public addNumericShadingData(newData: { geocode: string, data: number }[]) {
    if (!this.watchSetup) {
      this.addFields(this.getLayerView().layer);
      EsriUtils.setupWatch(this.mapService.mapView, 'updating').pipe(
        filter(r => r.newValue === false && r.oldValue === true)
      ).subscribe( r => this.addFeatureNumericData(this.currentNumericData));
      this.watchSetup = true;
    }
    for (const data of newData) {
      this.currentNumericData.set(data.geocode, data.data);
    }
    //this.numericData$.next(this.currentNumericData);

  }

  public addTextShadingData(newData: { geocode: string, data: string }[]) {
    for (const data of newData) {
      this.currentTextData.set(data.geocode, data.data);
    }
    //this.textData$.next(this.currentTextData);
  }

  public clearNumericShadingData() {
    //this.currentNumericData.clear();
  }

  public clearTextShadingData() {
    //this.currentTextData.clear();
  }

  public getNumericShadingData() : Map<string, number> {
    return this.currentNumericData;
  }

  public getTextShadingData() : Map<string, string> {
    return this.currentTextData;
  }

  private generateArcade(data: Map<string, number>) : string {
      let newPairs: string = '';
      for (const key of Array.from(data.keys())) {
        try {
          newPairs += `\"${key}\":${data.get(key)}\,`;
        } catch (error) {
          console.error('Failed to add key');
        }
      }
      newPairs = newPairs.substring(0, newPairs.length - 1);
      return `var data = {${newPairs}}; return data[$feature.geocode];`;
  }

  private addFeatureNumericData(data: Map<string, number>) {
    const arcade = this.generateArcade(this.currentNumericData);
    const layerView = this.getLayerView();
    let defaultSymbol: __esri.SimpleFillSymbol = new EsriApi.SimpleFillSymbol();
    if (EsriUtils.rendererIsSimple(layerView.layer.renderer) && EsriUtils.symbolIsSimpleFill(layerView.layer.renderer.symbol)) {
      defaultSymbol = layerView.layer.renderer.symbol;
    }
    let setup: CustomRendererSetup | SmartRendererSetup;
    setup = {
      rampLabel: '',
      outline: {
        defaultWidth: defaultSymbol.outline.width,
        selectedWidth: 4,
        selectedColor: [86, 231, 247, 1.0]
      },
      smartTheme: {
        baseMap: this.mapService.mapView.map.basemap,
        theme: null
      }
    };
    layerView.layer.renderer = this.createMultiVariateRenderer(defaultSymbol, setup, arcade);
  }

  private addFeatureTextData(data: Map<string, string>) {
    const layerView = this.getLayerView();
    if (layerView != null) {
      this.queryService.queryLayerView([layerView.layer], this.mapService.mapView.extent, false)
        .subscribe(graphics => {
          for (const graphic of graphics) {
            if (data.has(graphic.getAttribute('geocode'))) {
              graphic.setAttribute('textShadingData', data.get(graphic.getAttribute('geocode')));
            }
          }
          this.rendererDataReady.next(this.currentTextData.size);
        });
    }
  }

  private getLayerView(analysisLevel: string = 'zip') : __esri.FeatureLayerView {
    const layerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel);
    const layer = this.layerService.getPortalLayerById(layerId);
    let layerView: __esri.FeatureLayerView = null;
    const layerViews = this.mapService.mapView.allLayerViews;
    layerViews.forEach(lv => {
      if (layer.id === lv.layer.id) {
        layerView = <__esri.FeatureLayerView>lv;
      }
    });
    return layerView;
  }
  
  private createBaseRenderer(defaultSymbol: __esri.SimpleFillSymbol, outlineSetup: OutlineSetup, noDataSuffix: string = '', hasClassBreaks: boolean = false) : __esri.UniqueValueRenderer {
    const newDefaultSymbol = defaultSymbol.clone();
    if (outlineSetup.defaultWidth != null) {
      newDefaultSymbol.outline.width = outlineSetup.defaultWidth;
    }
    const selectedIndicator = 'Selected';
    const unselectedIndicator = 'Unselected';
    const selectedValue = hasClassBreaks ? `${selectedIndicator} ${noDataSuffix}` : selectedIndicator;
    const unselectedValue = hasClassBreaks ? `${unselectedIndicator} ${noDataSuffix}` : unselectedIndicator;
    const newRenderer = new EsriApi.UniqueValueRenderer({
      defaultSymbol: newDefaultSymbol,
      defaultLabel: unselectedValue,
      //valueExpression: '$feature.selected',
      legendOptions: {}
    });
    const selectionSymbol = EsriRendererService.createSymbol([0, 255, 0, 0.65], outlineSetup.selectedColor, outlineSetup.selectedWidth);
    newRenderer.addUniqueValueInfo({ value: selectedValue, symbol: selectionSymbol, label: selectedValue });
    return newRenderer;
  }

  private createClassBreaksRenderer(defaultSymbol: __esri.SimpleFillSymbol, dataValues: string[], setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRenderer {
    const baseRenderer = this.createBaseRenderer(defaultSymbol, setup.outline, '(No Data)', dataValues.length > 0);
    // Unshifting so I can keep the data values at the top, and the (no data) values at the bottom
    baseRenderer.uniqueValueInfos.unshift(...this.generateClassBreaks(dataValues, setup));
    // have to clone because the previous op works directly on the UVI array, and doesn't go through .addUniqueValue()
    return baseRenderer.clone();
  }

  public createUnifiedRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup) : __esri.Renderer {
    // for now, if data type === number, we do multivariate, if text, we do class breaks
    if (this.currentStatistics != null) {
      return this.createMultiVariateRenderer(defaultSymbol, setup);
    } else {
      const dataValues = new Set(Array.from(this.currentTextData.values()));
      return this.createClassBreaksRenderer(defaultSymbol, Array.from(dataValues), setup);
    }
  }

  private createMultiVariateRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup, arcade?: string) : __esri.UniqueValueRenderer {
    if (!arcade && this.currentNumericData.size > 0) {
      arcade = this.generateArcade(this.currentNumericData);
    } 
    const baseRenderer = this.createBaseRenderer(defaultSymbol, setup.outline);
    const themeColors = EsriRendererService.getThemeColors(setup);
    const colorVariable: Partial<__esri.ColorVisualVariable> = {
      type: 'color',
      
      /**
       * Don't seem to be able to use this anymore with WebGL
       */
      /*field: (feature: __esri.Graphic) => {
        if (this.currentNumericData.has(feature.attributes.geocode))
          return this.currentNumericData.get(feature.attributes.geocode);
        return undefined;
      },*/
      //field: 'cl2prw',
      
      
      //valueExpression: '$feature.numericShadingData',
      //valueExpression: 'var data = {\"field\": 130}; return data.field',
      valueExpression: arcade,
      //field: 'numericShadingData',
      stops: this.generateContinuousStops(themeColors),
      legendOptions: { showLegend: true, title: setup.rampLabel}
    };
    baseRenderer.visualVariables = [colorVariable];
    return baseRenderer;
  }

  private generateContinuousStops(themeStops: __esri.Color[]) : __esri.ColorVisualVariableStops[] {
    const result: __esri.ColorVisualVariableStops[] = [];
    if (themeStops.length < 2) throw new Error('Themes must contain a minimum of 2 stops');
    const round = (n: number) => Math.round(n * 100) / 100;
    const mean = this.currentStatistics.mean;
    const std = this.currentStatistics.stdDeviation;
    const themeCount = themeStops.length;
    const stepSize = 2 / (themeCount - 1);
    const multipliers: number[] = new Array<number>(themeStops.length);
    multipliers[0] = -1;
    result.push({ color: themeStops[0], value: mean - std, label: `< ${round(mean - std)}` });
    for (let n = 1; n < themeCount; ++n) {
      multipliers[n] = multipliers[n - 1] + stepSize;
      const currentValue = mean + (std * multipliers[n]);
      let currentLabel = null;
      if (multipliers[n] === 0) {
        currentLabel = `${round(mean)}`;
      }
      if (n === themeCount - 1) {
        currentLabel = `> ${round(currentValue)}`;
      }
      result.push({ color: themeStops[n], value: currentValue, label: currentLabel });
    }
    return result;
  }

  private generateClassBreaks(dataValues: string[], setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRendererUniqueValueInfos[] {
    if (dataValues == null || dataValues.length === 0) return [];
    const result: __esri.UniqueValueRendererUniqueValueInfos[] = [];
    const themeColors: __esri.Color[] = EsriRendererService.getThemeColors(setup, dataValues.length);
    if (dataValues.length > themeColors.length) throw new Error('The data being mapped has more values than the theme for mapping');
    dataValues.forEach((value, i) => {
      const selectedValue = `${value} (Selected)`;
      const unselectedValue = `${value} (Unselected)`;
      result.push({
          value: selectedValue,
          symbol: EsriRendererService.createSymbol(themeColors[i], setup.outline.selectedColor, setup.outline.selectedWidth)
        },
        {
          value: unselectedValue,
          symbol: EsriRendererService.createSymbol(themeColors[i], [0, 0, 0, 1], setup.outline.defaultWidth)
        });
      console.log('Class break value: "' + selectedValue + '"');
      console.log('Class break value: "' + unselectedValue + '"');
    });
    return result;
  }

  private addFields(layer: __esri.FeatureLayer) {
    const numericField: __esri.Field =  new EsriApi.Field({
      name: 'numericShadingData',
      alias: 'numericShadingData',
      type: 'double'
    });
    const textField: __esri.Field = new EsriApi.Field({
      name: 'textShadingData',
      alias: 'textShadingData',
      type: 'string'
    });
    layer.fields.unshift(numericField);
    layer.fields.unshift(textField);
  }

  /**
   * Determine if the features in the current map view are selected
   */
  public highlightGeos(analysisLevel: string, geos: string[]) {
    if (!analysisLevel) return;
    for (const handler of this.highlightHandlers) {
      handler.remove();
    }
    const currentSelectedGeos: Set<string> = new Set(geos);
    const layerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel);
    const layer = this.layerService.getPortalLayerById(layerId);
    if (!this.fieldsAdded.has(layer.title)) {
      this.addFields(layer);
      this.fieldsAdded.add(layer.title);
    }
    let layerView: __esri.FeatureLayerView = null;
    const layerViews = this.mapService.mapView.allLayerViews;
    layerViews.forEach(lv => {
      if (layer.id === lv.layer.id) {
        layerView = <__esri.FeatureLayerView>lv;
      }
    });
    if (layerView != null) {
      const selectedFeatures: Array<number> = [];
      this.queryService.queryLayerView([layerView.layer], this.mapService.mapView.extent, false).subscribe(results => {
        for (const feature of results) {
          if (feature.getAttribute('geocode') != null && currentSelectedGeos.has(feature.getAttribute('geocode'))) {
            feature.setAttribute('selected', 'Selected');
            feature.setAttribute('objectID', feature.getAttribute('objectid'));
            feature.setAttribute('OBJECTID', feature.getAttribute('objectid'));
            feature.symbol = null;
            selectedFeatures.push(Number(feature.getAttribute('objectID')));
          } else {
            feature.setAttribute('selected', 'Unselected');
          }
          if (this.currentNumericData.has(feature.getAttribute('geocode'))) {
            feature.setAttribute('numericShadingData', this.currentNumericData.get(feature.getAttribute('geocode')));
          }
          if (this.currentTextData.has(feature.getAttribute('geocode'))) {
            feature.setAttribute('textShadingData', this.currentTextData.get(feature.getAttribute('geocode')));
          }
        }
        if (selectedFeatures.length > 0) {
          const obj = layerView.highlight(selectedFeatures);
          this.highlightHandlers.push(obj);
        }
      });
    }
  }
}