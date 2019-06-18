import { Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriUtils } from '../core/esri-utils';
import { EsriMapService } from './esri-map.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapState } from '../state/map/esri.map.reducer';
import { ShadingData, Statistics } from '../state/map/esri.renderer.reducer';
import { ColorPallete, getColorPallete } from '../models/ColorPalletes';

interface OutlineSetup {
  defaultWidth: number;
  defaultColor: number[] | __esri.Color;
  selectedWidth: number;
  selectedColor: number[] | __esri.Color;
}

interface RendererSetup {
  rampLabel: string;
  outline: OutlineSetup;
  colors?: ColorPallete;
}

@Injectable()
export class EsriRendererService {

  private static randomSeeds: Array<Array<number>> = [];

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

  private static getThemeColors(rendererSetup: RendererSetup, dataLength: number) : __esri.Color[] {
    const colorPalette = getColorPallete(rendererSetup.colors);
    if (colorPalette == null) {
      return this.getRandomColors(dataLength);
    }
    return colorPalette.map(rgb => new EsriApi.Color([...rgb, 0.65])) ;
  }

  private static getRandomColors(dataLength?: number) : __esri.Color[] {
    const result: Array<__esri.Color> = [];
    for (let i = 0; i < dataLength; i++ ) {
      let red: number = null;
      let blue: number = null;
      let green: number = null;
      if (EsriRendererService.randomSeeds.length < dataLength) {
        const rands = [];
        rands.push(Math.floor(Math.random() * 256) + 1);
        rands.push(Math.floor(Math.random() * 256) + 1);
        rands.push(Math.floor(Math.random() * 256) + 1);
        EsriRendererService.randomSeeds.push(rands);
      }
      red = (EsriRendererService.randomSeeds[i][0] + 255) / 2;
      green = (EsriRendererService.randomSeeds[i][1] + 255) / 2;
      blue = (EsriRendererService.randomSeeds[i][2] + 255) / 2;
      const color: __esri.Color = new EsriApi.Color({ r: red, g: green, b: blue, a: 0.65 });
      result.push(color);
    }
    return result;
  }

  private static objectIsSimpleLine(l: any) : l is __esri.SimpleLineSymbol {
    return l != null && l.type === 'simple-line';
  }

  public restoreSimpleRenderer(mapState: EsriMapState) {
    if (this.simpleRenderer != null && EsriUtils.rendererIsSimple(this.simpleRenderer)) {
      const lv = this.getLayerView(mapState.selectedLayerId);
      lv.layer.renderer = this.simpleRenderer;
    }
  }

  public setShadingRenderer(mapState: EsriMapState, data: ShadingData, isNumericData: boolean, statistics?: Statistics, legend?: string, theme?: ColorPallete) : void {
    if (isNumericData) {
      this.createMultiVariateRenderer(data, mapState, statistics, legend, theme);
    } else {
      this.createClassBreaksRenderer(data, mapState, theme);
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

  private createClassBreaksRenderer(data: ShadingData, mapState: EsriMapState, theme?: ColorPallete) {
    const arcade = this.generateArcade(data, false);
    const dataValues: Set<string> = new Set<string>();
    for (const value of Object.values(data)) {
      if (value) dataValues.add(<string>value);
    }
    const uniqueData = Array.from(dataValues);
    uniqueData.sort();
    const setup = this.createRendererSetup(mapState, theme);
    const uvi = this.generateClassBreaks(uniqueData, setup.rendererSetup);
    const renderer: Partial<__esri.UniqueValueRenderer> = {
      type: 'unique-value',
      valueExpression: arcade,
      uniqueValueInfos: uvi,
      defaultSymbol: setup.symbol
    };
    const lv = this.getLayerView(mapState.selectedLayerId);
    if (EsriUtils.rendererIsSimple(lv.layer.renderer)) {
      lv.layer.renderer = renderer as __esri.UniqueValueRenderer;
    } else {
      lv.layer.renderer = this.simpleRenderer.clone();
      setTimeout(() => this.createClassBreaksRenderer(data, mapState, theme), 0);
    }
  }

  private createMultiVariateRenderer(data: ShadingData, mapState: EsriMapState, statistics: Statistics, legend?: string, theme?: ColorPallete) {
    const arcade = this.generateArcade(data, true);
    const setup = this.createRendererSetup(mapState, theme);
    const baseRenderer = this.createBaseRenderer(setup.symbol, setup.rendererSetup.outline);
    const themeColors = EsriRendererService.getThemeColors(setup.rendererSetup, Object.keys(data).length);
    if (legend != null) {
      setup.rendererSetup.rampLabel = legend;
    }
    const colorVariable: any = {
      type: 'color',
      valueExpression: arcade,
      stops: this.generateContinuousStops(themeColors, statistics),
      legendOptions: { showLegend: true, title: setup.rendererSetup.rampLabel}
    };
    const lv = this.getLayerView(mapState.selectedLayerId);
    baseRenderer.visualVariables = [colorVariable];
    //baseRenderer.defaultSymbol = EsriRendererService.createSymbol([255, 255, 255, 0], [0, 0, 0, 1], 2);
    if (EsriUtils.rendererIsSimple(lv.layer.renderer)) {
      lv.layer.renderer = baseRenderer.clone();
    } else {
      lv.layer.renderer = this.simpleRenderer.clone();
      setTimeout(() => this.createMultiVariateRenderer(data, mapState, statistics, legend, theme), 0);
    }
  }

  private createRendererSetup(mapState: EsriMapState, theme: ColorPallete) : { rendererSetup: RendererSetup, symbol: __esri.SimpleFillSymbol} {
    let setup: RendererSetup;
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
        defaultWidth: symbol.outline.width,
        defaultColor: symbol.outline.color,
        selectedWidth: 4,
        selectedColor: [0, 255, 0, 0.80]
      },
      colors: theme
    };
    return { rendererSetup: setup, symbol: symbol };
  }

  private generateContinuousStops(themeStops: __esri.Color[], statistics: Statistics) : __esri.ColorStop[] {
    const result: __esri.ColorStop[] = [];
    if (themeStops.length < 2) throw new Error('Themes must contain a minimum of 2 stops');
    const round = (n: number) => Math.round(n * 100) / 100;
    const mean = statistics.mean;
    const std = statistics.stdDeviation;
    const themeCount = themeStops.length;
    const stepSize = 2 / (themeCount - 1);
    const multipliers: number[] = new Array<number>(themeStops.length);
    multipliers[0] = -1;
    result.push({ color: themeStops[0], value: mean - std, label: `< ${round(mean - std)}` }as __esri.ColorStop);
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
      result.push({ color: themeStops[n], value: currentValue, label: currentLabel }as __esri.ColorStop);
    }
    return result;
  }

  private generateClassBreaks(dataValues: string[], setup: RendererSetup) : __esri.UniqueValueRendererUniqueValueInfos[] {
    if (dataValues == null || dataValues.length === 0) return [];
    const result: __esri.UniqueValueRendererUniqueValueInfos[] = [];
    const themeColors: __esri.Color[] = EsriRendererService.getThemeColors(setup, dataValues.length);
    dataValues.forEach((value, i) => {
      result.push({
          value: value,
          symbol: EsriRendererService.createSymbol(themeColors[i % themeColors.length], setup.outline.defaultColor, setup.outline.defaultWidth)
        });
    });
    return result;
  }

  public shadeSelection(featureSet: __esri.FeatureSet, groupName: string, layerName: string) {
    const graphics: Array<__esri.Graphic> = [];
    for (const feature of featureSet.features) {
      const symbol = EsriRendererService.createSymbol([0, 255, 0, 0.65], [0, 0, 0, 0.65], 1);
      const graphic: __esri.Graphic = new EsriApi.Graphic();
      graphic.symbol = symbol;
      graphic.geometry = feature.geometry;
      graphics.push(graphic);
    }
    if (this.layerService.getAllLayerNames().filter(name => name === layerName).length > 0) {
      this.layerService.removeLayer(layerName);
    }
    this.layerService.createGraphicsLayer(groupName, layerName, graphics, true);
  }

  public shadeGroups(featureSet: __esri.FeatureSet, groupName: string, layerName: string, shadingGroups: { groupName: string, ids: string[] }[], colorPallete = ColorPallete.Random) {
    const colors: Array<__esri.Color> = EsriRendererService.getRandomColors(shadingGroups.length);
    const graphics: Array<__esri.Graphic> = [];
    const shadedFeatures: Set<string> = new Set<string>();
    for (let i = 0; i < shadingGroups.length; i++) {
      const idSet: Set<string> = new Set(shadingGroups[i].ids);
      const siteGraphics: Array<__esri.Graphic> = [];
      for (const feature of featureSet.features) {
        if (idSet.has(feature.getAttribute('geocode')) && !shadedFeatures.has(feature.getAttribute('geocode'))) {
          let symbol: __esri.Symbol = null;
          if (colorPallete === ColorPallete.Random) {
            symbol = EsriRendererService.createSymbol(colors[i], [0, 0, 0, 0], 1);
          } else {
            const pallete: number [][] = getColorPallete(colorPallete);
            symbol = EsriRendererService.createSymbol(pallete[i % pallete.length], [0, 0, 0, 0], 1);
          }
          const graphic: __esri.Graphic = new EsriApi.Graphic();
          graphic.symbol = symbol;
          graphic.geometry = feature.geometry;
          graphic.setAttribute('geocode', feature.getAttribute('geocode'));
          graphic.setAttribute('SHADING_GROUP', shadingGroups[i].groupName);
          siteGraphics.push(graphic);
          shadedFeatures.add(feature.getAttribute('geocode'));
        }
      }
      graphics.push(...siteGraphics);
    }
    if (this.layerService.getAllLayerNames().filter(name => name === layerName).length > 0) {
      this.layerService.removeLayer(layerName);
    }
    this.layerService.createGraphicsLayer(groupName, layerName, graphics, true);
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
    console.log('Clearing Highlights');
    if (this.highlightHandler != null) this.highlightHandler.remove();
  }
}
