import { Injectable } from '@angular/core';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ValGeoService } from './app-geo.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { calculateStatistics, Statistics } from '../app.utils';
import { SmartMappingTheme } from '../models/LayerState';
import { TopVarService } from './top-var.service';
import { filter, map } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

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
  private geoSubscription: Subscription;
  private dataSubscription: Subscription;

  private currentData: Map<string, any> = new Map<string, any>();
  private currentStatistics: Statistics;
  private currentSelectedGeos: Set<string> = new Set<string>();
  private dataTitle: string;

  private readyForRender: Subject<any> = new Subject<any>();
  public readyForRender$: Observable<any> = this.readyForRender.asObservable();

  constructor(private geoService: ValGeoService, private dataService: TopVarService) {
    this.geoSubscription = this.geoService.uniqueSelectedGeocodes$.subscribe(geos => {
      this.currentSelectedGeos.clear();
      geos.forEach(geo => this.currentSelectedGeos.add(geo));
    });
    this.dataSubscription = this.dataService.mapData$.pipe(
      map(dataMap => Array.from(dataMap.entries()).map(([key, value]) => ({ geocode: key, data: value })))
    ).subscribe(dataList => {
      this.updateData(dataList);
    });
    this.dataService.renderedData$.pipe(filter(data => data != null)).subscribe(data => this.dataTitle = data.fielddescr);
  }

  private static objectIsSimpleLine(l: any) : l is __esri.SimpleLineSymbol {
    return l != null && l.type === 'simple-line';
  }

  private static rendererIsSmart(r: SmartRendererSetup | CustomRendererSetup) : r is SmartRendererSetup {
    return r != null && r.hasOwnProperty('smartTheme');
  }

  private static getThemeColors(rendererSetup: SmartRendererSetup | CustomRendererSetup, dataLength?: number) : __esri.Color[] {
    const result = [];
    if (this.rendererIsSmart(rendererSetup)) {
      const theme = EsriModules.symbologyColor.getSchemes({
        basemap: rendererSetup.smartTheme.baseMap,
        geometryType: 'polygon',
        theme: rendererSetup.smartTheme.theme
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
      result.push(...rendererSetup.customColors.map(rgba => new EsriModules.Color(rgba)));
    } else {
      result.push(...tacticianDarkPalette.map(rgba => new EsriModules.Color(rgba)));
    }
    console.log('Colors', result);
    return result;
  }

  private static createSymbol(fillColor: number[] | __esri.Color, outline: __esri.SimpleLineSymbol) : __esri.SimpleFillSymbol;
  private static createSymbol(fillColor: number[] | __esri.Color, outlineColor: number[] | __esri.Color, outlineWidth: number) : __esri.SimpleFillSymbol;
  private static createSymbol(fillColor: number[] | __esri.Color, outlineOrColor: number[] | __esri.Color | __esri.SimpleLineSymbol, outlineWidth?: number) : __esri.SimpleFillSymbol {
    let currentOutline: Partial<__esri.SimpleLineSymbol>;
    if (this.objectIsSimpleLine(outlineOrColor)) {
      currentOutline = outlineOrColor.clone();
    } else {
      currentOutline = {
        color: Array.isArray(outlineOrColor) ? new EsriModules.Color(outlineOrColor) : outlineOrColor,
        style: 'solid',
        type: 'simple-line',
        width: outlineWidth
      };
    }
    return new EsriModules.SimpleFillSymbol({
      color: Array.isArray(fillColor) ? new EsriModules.Color(fillColor) : fillColor,
      style: 'solid',
      outline: currentOutline,
    });
  }

  public updateData(newData: { geocode: string, data: any }[]) : void {
    newData.forEach(d => {
      this.currentData.set(d.geocode, d.data);
    });
    if (newData == null || newData.length === 0) this.currentData.clear();
    if (newData != null && newData.length > 0 && typeof newData[0].data === 'number') {
      this.currentStatistics = calculateStatistics(newData.map(d => d.data));
    } else {
      this.currentStatistics = null;
    }
    console.log('Current Data', this.currentData);
    console.log('Calculated Stats', this.currentStatistics);
    this.readyForRender.next();
  }

  public createUnifiedRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup) : __esri.Renderer {
    // for now, if data type === number, we do multivariate, if text, we do class breaks
    if (this.currentStatistics != null) {
      return this.createMultiVariateRenderer(defaultSymbol, setup);
    } else {
      const dataValues = new Set(Array.from(this.currentData.values()));
      return this.createClassBreaksRenderer(defaultSymbol, Array.from(dataValues), setup);
    }
  }

  private createMultiVariateRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRenderer {
    const baseRenderer = this.createBaseRenderer(defaultSymbol, setup.outline);
    const themeColors = AppRendererService.getThemeColors(setup);
    const colorVariable: Partial<__esri.ColorVisualVariable> = {
      type: 'color',
      field: (feature: __esri.Graphic) => this.currentData.get(feature.attributes.geocode),
      stops: this.generateContinuousStops(themeColors),
      legendOptions: { showLegend: true, title: setup.rampLabel}
    };
    baseRenderer.visualVariables = [colorVariable];
    return baseRenderer;
  }

  private createClassBreaksRenderer(defaultSymbol: __esri.SimpleFillSymbol, dataValues: string[], setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRenderer {
    const baseRenderer = this.createBaseRenderer(defaultSymbol, setup.outline, '(No Data)', dataValues.length > 0);
    baseRenderer.uniqueValueInfos.unshift(...this.generateClassBreaks(dataValues, setup));
    return baseRenderer;
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
    let dataSelector: (feature: __esri.Graphic) => string;
    if (hasClassBreaks) {
      dataSelector = (feature: __esri.Graphic) => {
        const geo = feature.attributes.geocode;
        let result: string;
        if (this.currentData.has(geo)) {
          result = this.currentData.get(geo) + ' (' + (this.currentSelectedGeos.has(geo) ? selectedIndicator : unselectedIndicator) + ')';
        } else {
          result = this.currentSelectedGeos.has(geo) ? selectedValue : unselectedValue;
        }
        return result;
      };
    } else {
      dataSelector = (feature: __esri.Graphic) => this.currentSelectedGeos.has(feature.attributes.geocode) ? selectedValue : null;
    }
    const newRenderer = new EsriModules.UniqueValueRenderer({
      defaultSymbol: newDefaultSymbol,
      defaultLabel: unselectedValue,
      field: dataSelector,
      legendOptions: {
        title: this.dataTitle
      }
    });
    const selectionSymbol = AppRendererService.createSymbol([0, 255, 0, 0.65], outlineSetup.selectedColor, outlineSetup.selectedWidth);
    newRenderer.addUniqueValueInfo({ value: selectedValue, symbol: selectionSymbol, label: selectedValue });
    return newRenderer;
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
    const themeColors: __esri.Color[] = AppRendererService.getThemeColors(setup, dataValues.length);
    if (dataValues.length > themeColors.length) throw new Error('The data being mapped has more values than the theme for mapping');
    dataValues.forEach((value, i) => {
      const selectedValue = `${value} (Selected)`;
      const unselectedValue = `${value} (Unselected)`;
      result.push({
          value: selectedValue,
          symbol: AppRendererService.createSymbol(themeColors[i], setup.outline.selectedColor, setup.outline.selectedWidth)
        },
        {
          value: unselectedValue,
          symbol: AppRendererService.createSymbol(themeColors[i], [0, 0, 0, 1], setup.outline.defaultWidth)
        });
      console.log('Class break value: "' + selectedValue + '"');
      console.log('Class break value: "' + unselectedValue + '"');
    });
    return result;
  }
}