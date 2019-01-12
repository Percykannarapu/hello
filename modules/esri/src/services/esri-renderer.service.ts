import { Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriUtils } from '../core/esri-utils';
import { EsriMapService } from './esri-map.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapState } from '../state/map/esri.map.reducer';
import { ShadingData, Statistics } from '../state/map/esri.renderer.reducer';

export enum SmartMappingTheme {
  HighToLow = 'high-to-low',
  AboveAndBelow = 'above-and-below',
  //CenteredOn = 'centered-on',
  Extremes = 'extremes'
}

interface OutlineSetup {
  defaultWidth: number;
  selectedWidth: number;
  selectedColor: number[] | __esri.Color;
}

interface SmartRendererSetup {
  rampLabel: string;
  outline: OutlineSetup;
  smartTheme: {
    baseMap: __esri.Basemap;
    theme: SmartMappingTheme;
  };
}

interface CustomRendererSetup {
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
export class EsriRendererService {

  public static currentDefaultTheme: SmartMappingTheme = SmartMappingTheme.HighToLow;
  
  private simpleSymbol: any = null;
  private simpleRenderer: any = null;
  private highlightHandler: { remove: () => void } = null;
  
  constructor(private mapService: EsriMapService, 
              private layerService: EsriLayerService) {}

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

  public restoreSimpleRenderer(mapState: EsriMapState) {
    if (this.simpleRenderer != null && EsriUtils.rendererIsSimple(this.simpleRenderer)) {
      const lv = this.getLayerView(mapState.selectedLayerId);
      lv.layer.renderer = this.simpleRenderer;
    }
  }

  public setShadingRenderer(mapState: EsriMapState, data: ShadingData, isNumericData: boolean, statistics?: Statistics) : void {
    if (isNumericData) {
      this.createMultiVariateRenderer(data, mapState, statistics);
    } else {
      this.createClassBreaksRenderer(data, mapState);
    }
  }

  private generateArcade(data: ShadingData, isNumericShadingData: boolean) : string {
      const keyValues: Array<string> = [];
      for (const geocode of Object.keys(data)) {
        if (data[geocode]) {
          const currentValue = isNumericShadingData ? `${data[geocode]}` : `\"${data[geocode]}\"`;
          keyValues.push(`\"${geocode}\":${currentValue}`);
        }
      }
      const arcadeValues = keyValues.join(`\,`);
      const arcade = `var geoData = {${arcadeValues}}; 
                      if(hasKey(geoData, $feature.geocode)) {
                        return geoData[$feature.geocode];
                      }
                      return 0;`;
      return arcade;
  }

  private getLayerView(layerId: string) : __esri.FeatureLayerView {
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

  private createClassBreaksRenderer(data: ShadingData, mapState: EsriMapState) {
    const arcade = this.generateArcade(data, false);
    const dataValues: Set<string> = new Set<string>();
    for (const value of Object.values(data)) {
      if (value) dataValues.add(<string>value);
    }
    const setup = this.createRendererSetup(mapState);
    const uvi = this.generateClassBreaks(Array.from(dataValues), setup.rendererSetup);
    const defaultSymbol = EsriRendererService.createSymbol([0, 0, 0, 0], [0, 0, 0, 1], 3);
    const renderer: Partial<__esri.UniqueValueRenderer> = {
      type: 'unique-value',
      valueExpression: arcade,
      uniqueValueInfos: uvi,
      defaultSymbol: defaultSymbol
    };
    const lv = this.getLayerView(mapState.selectedLayerId);
    if (EsriUtils.rendererIsSimple(lv.layer.renderer)) {
      lv.layer.renderer = renderer as __esri.UniqueValueRenderer;
    } else {
      lv.layer.renderer = this.simpleRenderer.clone();
      setTimeout(() => this.createClassBreaksRenderer(data, mapState), 0);
    }
  }

  private createMultiVariateRenderer(data: ShadingData, mapState: EsriMapState, statistics: Statistics) {
    const arcade = this.generateArcade(data, true);
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
    baseRenderer.defaultSymbol = EsriRendererService.createSymbol([255, 255, 255, 0], [0, 0, 0, 1], 2);
    const lv = this.getLayerView(mapState.selectedLayerId);
    if (EsriUtils.rendererIsSimple(lv.layer.renderer)) {
      lv.layer.renderer = baseRenderer.clone();
    } else {
      lv.layer.renderer = this.simpleRenderer.clone();
      setTimeout(() => this.createMultiVariateRenderer(data, mapState, statistics), 0);
    }
  }

  private createRendererSetup(mapState: EsriMapState) : { rendererSetup: SmartRendererSetup | CustomRendererSetup, symbol: __esri.SimpleFillSymbol} {
    let setup: CustomRendererSetup | SmartRendererSetup;
    const currentRenderer: __esri.Renderer = this.getLayerView(mapState.selectedLayerId).layer.renderer;
    let symbol: __esri.SimpleFillSymbol = new EsriApi.SimpleFillSymbol();
    if (EsriUtils.rendererIsSimple(currentRenderer) && EsriUtils.symbolIsSimpleFill(currentRenderer.symbol)) {
      symbol = currentRenderer.symbol;
      this.simpleSymbol = symbol;
      this.simpleRenderer = this.getLayerView(mapState.selectedLayerId).layer.renderer;
    } else {
      symbol = this.simpleSymbol;
    }
    setup = {
      rampLabel: '',
      outline: {
        //defaultWidth: symbol.outline.width,
        defaultWidth: 2,
        selectedWidth: 4,
        selectedColor: [0, 255, 0, 0.80]
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
      result.push({
          value: value,
          symbol: EsriRendererService.createSymbol(themeColors[i], [0, 0, 0, 1], setup.outline.defaultWidth)
        });
      console.log('Class break value: "' + value + '"');
    });
    return result;
  }

  public highlightSelection(layerId: string, objectIds: number[]) {
    if (!layerId) return;
    const layerView = this.getLayerView(layerId);
    this.clearHighlight();
    if (layerView != null) {
      if (objectIds.length > 0) this.highlightHandler = layerView.highlight(objectIds);
    }
  }

  public clearHighlight() : void {
    if (this.highlightHandler != null) this.highlightHandler.remove();
  }
}