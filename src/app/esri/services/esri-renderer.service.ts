import { Injectable } from '@angular/core';
import { EsriMapService } from './esri-map.service';
import { EsriLayerService } from './esri-layer.service';
import { AppConfig } from '../../app.config';
import { EsriApi } from '../core/esri-api.service';
import { EsriQueryService } from './esri-query.service';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, withLatestFrom, tap, share } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';
import { Store, select } from '@ngrx/store';
import { AppState, getEsriState, getEsriMapState, getEsriRendererNumericData, getEsriRendererTextData, getEsriViewpointState, getEsriRendererSelectedGeocodes, getEsriRendererState } from '../state/esri.selectors';
import { EsriMapState } from '../state/map/esri.map.reducer';
import { EsriHighlightHandler, EsriHighlightRemover, NumericShadingData, TextShadingData, Statistics } from '../state/map/esri.renderer.reducer';
import { AddHighlightHandlers, ClearHighlightHandlers } from '../state/map/esri.renderer.actions';

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

@Injectable({
  providedIn: 'root'
})
export class EsriRendererService {

  public static currentDefaultTheme: SmartMappingTheme = SmartMappingTheme.HighToLow;
  
  private simpleSymbol: any = null;
  private simpleRenderer: any = null;
  
  constructor(private mapService: EsriMapService, 
              private layerService: EsriLayerService,
              private appConfig: AppConfig,
              private queryService: EsriQueryService,
              private store$: Store<AppState>) {

    const sharedStore$ = this.store$.pipe(share());

    //pipe for highlighting based on selected geocodes
    sharedStore$.pipe(
      select(getEsriRendererSelectedGeocodes),
      withLatestFrom(this.store$.pipe(select(getEsriState))),
      filter(([selectedGeos, esriState]) => selectedGeos != null && esriState != null),
      filter(([selectedGeos, esriState]) => esriState.renderer.highlightSelectedGeos === true),
    ).subscribe(([selectedGeos, esriState]) => this.highlightGeos(esriState.map.analysisLevel, selectedGeos, esriState.renderer.highlightHandlers, true));

    //pipe for highlighting based on viewpoint changes
    sharedStore$.pipe(
      select(getEsriViewpointState),
      withLatestFrom(this.store$.pipe(select(getEsriState))),
      filter(([viewpointState, esriState]) => viewpointState != null && esriState != null),
    ).subscribe(([viewpointState, esriState]) => this.highlightGeos(esriState.map.analysisLevel, esriState.renderer.selectedGeocodes, esriState.renderer.highlightHandlers));

    //pipe for shading the map with numeric data
    sharedStore$.pipe(
      select(getEsriRendererNumericData),
      withLatestFrom(this.store$.pipe(select(getEsriState))),
      filter(([numericData, esriState]) => numericData != null && esriState != null),
      filter(([numericData, esriState]) => numericData.length > 0),
      distinctUntilChanged(),
    ).subscribe(([numericData, esriState]) => this.createMultiVariateRenderer(numericData, esriState.map, esriState.renderer.statistics));

    //pipe for shading the map with text data
    sharedStore$.pipe(
      select(getEsriRendererTextData),
      withLatestFrom(this.store$.pipe(select(getEsriMapState))),
      filter(([textData, mapState]) => textData != null && mapState != null),
      filter(([textData, mapState]) => textData.length > 0),
      distinctUntilChanged(),
    ).subscribe(([textData, mapState]) => this.createClassBreaksRenderer(textData, mapState));

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

  private isNumericShadingData(data: Array<NumericShadingData> | Array<TextShadingData>) : data is Array<NumericShadingData> {
    for (const datum of data) {
      if (datum.data == null) {
        continue;
      }
      const result = Number.isNaN(Number(data[0].data));
      return result;
    }
    return false;
  }

  private generateArcade(data: Array<NumericShadingData> | Array<TextShadingData>) : string {
      let newPairs: string = '';
      const numericData = this.isNumericShadingData(data);
      for (const datum of data) {
        try {
          if (numericData) {
            newPairs += `\"${datum.geocode}\":${datum.data}\,`;
          } else {
            newPairs += `\"${datum.geocode}\":\"${datum.data}\"\,`;
          }
          
        } catch (error) {
          console.error('Failed to add key');
        }
      }
      newPairs = newPairs.substring(0, newPairs.length - 1);
      const arcade = `var data = {${newPairs}}; return data[$feature.geocode];`;
      return arcade;
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

  //private createClassBreaksRenderer(defaultSymbol: __esri.SimpleFillSymbol, dataValues: string[], setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRenderer {
  private createClassBreaksRenderer(data: Array<TextShadingData>, mapState: EsriMapState) {  
    const arcade = this.generateArcade(data);
    const setup = this.createRendererSetup(mapState);
    const baseRenderer = this.createBaseRenderer(setup.symbol, setup.rendererSetup.outline, '(No Data)', data.length > 0);
    // Unshifting so I can keep the data values at the top, and the (no data) values at the bottom
    const dataValues: Set<string> = new Set<string>();
    for (const datum of data) {
      dataValues.add(datum.data);
    }
    baseRenderer.valueExpression = arcade;
    baseRenderer.uniqueValueInfos.unshift(...this.generateClassBreaks(Array.from(dataValues), setup.rendererSetup));
    // have to clone because the previous op works directly on the UVI array, and doesn't go through .addUniqueValue()
    const lv = this.getLayerView(mapState.analysisLevel);
    if (EsriUtils.rendererIsSimple(lv.layer.renderer)) {
      lv.layer.renderer = baseRenderer.clone();
    } else {
      lv.layer.renderer = this.simpleRenderer.clone();
      setTimeout(() => this.createClassBreaksRenderer(data, mapState), 0);
    }
  }

  private createMultiVariateRenderer(data: Array<NumericShadingData>, mapState: EsriMapState, statistics: Statistics) {
    const arcade = this.generateArcade(data);
    const setup = this.createRendererSetup(mapState);
    const baseRenderer = this.createBaseRenderer(setup.symbol, setup.rendererSetup.outline);
    const themeColors = EsriRendererService.getThemeColors(setup.rendererSetup);
    const colorVariable: Partial<__esri.ColorVisualVariable> = {
      type: 'color',
      valueExpression: arcade,
      stops: this.generateContinuousStops(themeColors, statistics),
      legendOptions: { showLegend: true, title: setup.rendererSetup.rampLabel}
    };
    baseRenderer.visualVariables = [colorVariable];
    const lv = this.getLayerView(mapState.analysisLevel);
    if (EsriUtils.rendererIsSimple(lv.layer.renderer)) {
      lv.layer.renderer = baseRenderer.clone();
    } else {
      lv.layer.renderer = this.simpleRenderer.clone();
      setTimeout(() => this.createMultiVariateRenderer(data, mapState, statistics), 0);
    }
  }

  private createRendererSetup(mapState: EsriMapState) : { rendererSetup: SmartRendererSetup | CustomRendererSetup, symbol: __esri.SimpleFillSymbol} {
    let setup: CustomRendererSetup | SmartRendererSetup;
    const currentRenderer: __esri.Renderer = this.getLayerView(mapState.analysisLevel).layer.renderer;
    let symbol: __esri.SimpleFillSymbol = new EsriApi.SimpleFillSymbol();
    if (EsriUtils.rendererIsSimple(currentRenderer) && EsriUtils.symbolIsSimpleFill(currentRenderer.symbol)) {
      symbol = currentRenderer.symbol;
      this.simpleSymbol = symbol;
      this.simpleRenderer = this.getLayerView(mapState.analysisLevel).layer.renderer;
    } else {
      symbol = this.simpleSymbol;
    }
    setup = {
      rampLabel: '',
      outline: {
        //defaultWidth: symbol.outline.width,
        defaultWidth: 2,
        selectedWidth: 4,
        selectedColor: [86, 231, 247, 1.0]
      },
      smartTheme: {
        baseMap: this.mapService.mapView.map.basemap,
        theme: null
      }
    };
    return {rendererSetup: setup, symbol: symbol};
  }

  private generateContinuousStops(themeStops: __esri.Color[], statistics: Statistics) : __esri.ColorVisualVariableStops[] {
    const result: __esri.ColorVisualVariableStops[] = [];
    if (themeStops.length < 2) throw new Error('Themes must contain a minimum of 2 stops');
    const round = (n: number) => Math.round(n * 100) / 100;
    const mean = statistics.mean;
    const std = statistics.stdDeviation;
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

  private unHighlightAllGeos(highlightHandlers: Array<EsriHighlightHandler>, geos: string[], currentSelectedGeos?: Set<string>) {
    if (currentSelectedGeos == null) {
      currentSelectedGeos = new Set<string>(geos);
    }
    for (const handler of highlightHandlers) {
      if (!currentSelectedGeos.has(handler.geocode)) {
        handler.remover.remove();
      }
    }
  }

  /**
   * Determine if the features in the current map view are selected
   */
  private highlightGeos(analysisLevel: string, geos: string[], highlightHandlers: Array<EsriHighlightHandler>, remove: boolean = false) {
    if (!analysisLevel) return;
    const currentSelectedGeos: Set<string> = new Set(geos);
    if (remove) {
      this.unHighlightAllGeos(highlightHandlers, geos, currentSelectedGeos);
    }
    const layerView = this.getLayerView(analysisLevel);
    if (layerView != null) {
      const selectedFeatures: Array<{geocode: string, objectid: number}> = [];
      this.queryService.queryLayerView([layerView.layer], this.mapService.mapView.extent, false).subscribe(results => {
        for (const feature of results) {
          if (feature.getAttribute('geocode') != null && currentSelectedGeos.has(feature.getAttribute('geocode'))) {
            feature.setAttribute('objectID', feature.getAttribute('objectid'));
            selectedFeatures.push({geocode: feature.getAttribute('geocode'), objectid: Number(feature.getAttribute('objectID'))});
          }
        }
        if (selectedFeatures.length > 0) {
          const handlers: Array<EsriHighlightHandler> =  new Array<EsriHighlightHandler>();
          for (const feature of selectedFeatures) {
            const highlightRemover: EsriHighlightRemover = <EsriHighlightRemover> layerView.highlight(feature.objectid);
            const highlightHandler: EsriHighlightHandler = { geocode: feature.geocode, remover: highlightRemover };
            handlers.push(highlightHandler);
          }
          this.store$.dispatch(new ClearHighlightHandlers);
          this.store$.dispatch(new AddHighlightHandlers(handlers));
        } else {
          this.store$.dispatch(new ClearHighlightHandlers);
        }
      });
    }
  }
}