import { Injectable } from '@angular/core';
import { EsriApi } from '../esri/core/esri-api.service';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { calculateStatistics, Statistics } from '../app.utils';
import { TargetAudienceService } from './target-audience.service';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AppStateService } from './app-state.service';

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

  constructor(private appStateService: AppStateService, private dataService: TargetAudienceService) {
    this.geoSubscription = this.appStateService.uniqueSelectedGeocodes$.subscribe(geos => {
      this.currentSelectedGeos.clear();
      geos.forEach(geo => this.currentSelectedGeos.add(geo));
    });

    this.rendererDataReady$ = this.rendererDataReady.pipe(
      distinctUntilChanged()
    );

    this.dataSubscription = this.dataService.shadingData$.pipe(
      map(dataMap => Array.from(dataMap.entries()).map(([key, value]) => ({ geocode: key, data: value })))
    ).subscribe(dataList => this.updateData(dataList));
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

  public updateData(newData: { geocode: string, data: ImpGeofootprintVar }[]) : void {
    newData.forEach(d => {
      this.currentData.set(d.geocode, d.data);
    });
    if (newData == null || newData.length === 0) this.currentData.clear();
    if (newData != null && newData.length > 0 && newData[0].data.isNumber === true) {
      this.currentStatistics = calculateStatistics(newData.map(d => d.data.valueNumber));
    } else {
      this.currentStatistics = null;
    }
    this.rendererDataReady.next(this.currentData.size);
  }

  public createUnifiedRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup) : __esri.Renderer {
    // for now, if data type === number, we do multivariate, if text, we do class breaks
    if (this.currentStatistics != null) {
      return this.createMultiVariateRenderer(defaultSymbol, setup);
    } else {
      const dataValues = new Set(Array.from(this.currentData.values()).map(d => d.valueString));
      return this.createClassBreaksRenderer(defaultSymbol, Array.from(dataValues), setup);
    }
  }

  private createMultiVariateRenderer(defaultSymbol: __esri.SimpleFillSymbol, setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRenderer {
    const baseRenderer = this.createBaseRenderer(defaultSymbol, setup.outline);
    const themeColors = AppRendererService.getThemeColors(setup);
    const colorVariable: Partial<__esri.ColorVisualVariable> = {
      type: 'color',
      field: (feature: __esri.Graphic) => {
        if (this.currentData.has(feature.attributes.geocode))
          return this.currentData.get(feature.attributes.geocode).valueNumber;
        return undefined;
      },
      stops: this.generateContinuousStops(themeColors),
      legendOptions: { showLegend: true, title: setup.rampLabel}
    };
    baseRenderer.visualVariables = [colorVariable];
    return baseRenderer;
  }

  private createClassBreaksRenderer(defaultSymbol: __esri.SimpleFillSymbol, dataValues: string[], setup: SmartRendererSetup | CustomRendererSetup) : __esri.UniqueValueRenderer {
    const baseRenderer = this.createBaseRenderer(defaultSymbol, setup.outline, '(No Data)', dataValues.length > 0);
    // Unshifting so I can keep the data values at the top, and the (no data) values at the bottom
    baseRenderer.uniqueValueInfos.unshift(...this.generateClassBreaks(dataValues, setup));
    // have to clone because the previous op works directly on the UVI array, and doesn't go through .addUniqueValue()
    return baseRenderer.clone();
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
          result = this.currentData.get(geo).valueString + ' (' + (this.currentSelectedGeos.has(geo) ? selectedIndicator : unselectedIndicator) + ')';
        } else {
          result = this.currentSelectedGeos.has(geo) ? selectedValue : unselectedValue;
        }
        return result;
      };
    } else {
      dataSelector = (feature: __esri.Graphic) => this.currentSelectedGeos.has(feature.attributes.geocode) ? selectedValue : null;
    }
    let dataTitle = '';
    if (this.currentData.size > 0) {
      const exemplar = Array.from(this.currentData.values())[0];
      const exemplarAudience = this.dataService.getAudiences(exemplar.customVarExprQuery)[0];
      dataTitle = exemplarAudience != null ? exemplarAudience.audienceName : '';
    }
    const newRenderer = new EsriApi.UniqueValueRenderer({
      defaultSymbol: newDefaultSymbol,
      defaultLabel: unselectedValue,
      field: dataSelector,
      legendOptions: {
        title: dataTitle
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
