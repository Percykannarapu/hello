import { isNil } from '@val/common';
import { markerStyleDefaultSizes } from '../core/esri.enums';
import { ColorPalette } from './color-palettes';
import { duplicateLabel, duplicateMarker, LabelDefinition, MarkerSymbolDefinition, UniqueValueMarkerDefinition } from './common-configuration';
import { markerStyleValues, RgbTuple, RgbaTuple } from './esri-types';

export enum PoiConfigurationTypes {
  Simple = 'Simple',
  Unique = 'Unique',
  // ClassBreak = 'ClassBreak',
  // HeatMap = 'HeatMap'
}

export class RadiiTradeAreaDrawDefinition {
  groupName: string;
  layerName: string;
  buffer: number[] = [];
  centers: __esri.Point[] = [];
  taNumber: number;

  bufferedPoints: {
    buffer: number;
    xcoord: number;
    ycoord: number;
    point: __esri.Point;
  }[] = [];

  

  constructor();
  constructor(radiiDefinitation?: Partial<RadiiTradeAreaDrawDefinition>)
  constructor(private siteType?: any, private layerSuffix?: string, public color?: [number, number, number, number], public merge?: boolean) {
    /*if (siteType != null){
      this.groupName = `${String(siteType)} Visual Radii`;
      this.layerName = `${String(siteType)} - ${layerSuffix}`;
    }
    else{ */
      Object.assign(this, siteType);
   // }
        
}

  clone() : RadiiTradeAreaDrawDefinition {
    //const result = new RadiiTradeAreaDrawDefinition(this.siteType, this.layerSuffix, Array.from(this.color) as [number, number, number, number], this.merge);
    const result: RadiiTradeAreaDrawDefinition= null; //new RadiiTradeAreaDrawDefinition(); 
    result.taNumber = this.taNumber;
    result.buffer = Array.from(this.buffer);
    result.centers = this.centers.map(c => c.clone());
    result.bufferedPoints = this.bufferedPoints.map(p => ({...p, point: p.point.clone()}));
    return result;
  }

  
  public static radiiFactory = (json: string): RadiiTradeAreaDrawDefinition => {
    const jsonObject = JSON.parse(json);
    return new RadiiTradeAreaDrawDefinition(jsonObject);
  }
}




export interface BasePoiConfiguration {
  id: string;
  sortOrder: number;
  dataKey: string;
  groupName: string;
  featureLayerId?: string;
  layerName: string;
  minScale?: number;
  opacity?: number;
  visible?: boolean;
  visibleRadius?: boolean;
  showLabels?: boolean;
  labelDefinition?: LabelDefinition;
  radiiTradeAreaDefinition?: RadiiTradeAreaDrawDefinition[];
  refreshLegendOnRedraw?: boolean;
  radiiColor?: RgbaTuple;
  siteNumber?: string;
  isBatchMap?: boolean;
  showSymbols?: boolean;
}

export interface SimplePoiConfiguration extends BasePoiConfiguration {
  poiType: PoiConfigurationTypes.Simple;
  symbolDefinition: MarkerSymbolDefinition;
}

function isSimple(config: PoiConfiguration) : config is SimplePoiConfiguration {
  return config.poiType === PoiConfigurationTypes.Simple;
}

function duplicateSimple(config: SimplePoiConfiguration) : SimplePoiConfiguration {
  const radiiDuplicate = isNil(config.radiiTradeAreaDefinition) ? null : config.radiiTradeAreaDefinition.map(r => RadiiTradeAreaDrawDefinition.radiiFactory(JSON.stringify(r)));
  return {
    ...config,
    labelDefinition: duplicateLabel(config.labelDefinition),
    symbolDefinition: duplicateMarker(config.symbolDefinition),
    radiiTradeAreaDefinition: radiiDuplicate
  };
}

export interface UniquePoiConfiguration extends BasePoiConfiguration {
  poiType: PoiConfigurationTypes.Unique;
  featureAttribute: string;
  theme: ColorPalette;
  reverseTheme: boolean;
  breakDefinitions: UniqueValueMarkerDefinition[];
}

function isUnique(config: PoiConfiguration) : config is UniquePoiConfiguration {
  return config.poiType === PoiConfigurationTypes.Unique;
}

function duplicateUnique(config: UniquePoiConfiguration) : UniquePoiConfiguration {
  const radiiDuplicate = isNil(config.radiiTradeAreaDefinition) ? null : config.radiiTradeAreaDefinition.map(r => RadiiTradeAreaDrawDefinition.radiiFactory(JSON.stringify(r)));
  return {
    ...config,
    labelDefinition: duplicateLabel(config.labelDefinition),
    breakDefinitions: config.breakDefinitions.map(bd => duplicateMarker(bd)),
    radiiTradeAreaDefinition: radiiDuplicate
  };
}

export function duplicatePoiConfiguration<T extends PoiConfiguration>(config: T) : T {
  if (config == null) return null;
  if (isSimple(config)) {
    return duplicateSimple(config) as T;
  }
  if (isUnique(config)) {
    return duplicateUnique(config) as T;
  }
}

export type PoiConfiguration = SimplePoiConfiguration | UniquePoiConfiguration;

export function generateUniqueMarkerValues(sortedUniqueValues: string[], colorPalette: RgbTuple[]) : UniqueValueMarkerDefinition[] {
  const needsOffset = (markerStyleValues.length % colorPalette.length) === 0;
  return sortedUniqueValues.map((uv, i) => {
    const currentMarker = markerStyleValues[i % markerStyleValues.length];
    const offset = needsOffset ? Math.floor(i / colorPalette.length) : 0;
    const currentColor = colorPalette[(i + offset) % colorPalette.length];
    return {
      value: uv,
      color: RgbTuple.withAlpha(currentColor, 1),
      markerType: currentMarker,
      size: markerStyleDefaultSizes[currentMarker],
      legendName: uv,
      outlineColor: [255, 255, 255, 1],
      outlineWidth: 1
    };
  });
}
