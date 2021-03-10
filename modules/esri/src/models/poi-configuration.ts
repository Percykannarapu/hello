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

  constructor(siteType: string, layerSuffix: string, public color: [number, number, number, number], public merge: boolean) {
    this.groupName = `${siteType}s`;
    this.layerName = `${siteType} - ${layerSuffix}`;
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
  radiiTradeareaDefination?: RadiiTradeAreaDrawDefinition[];
  refreshLegendOnRedraw?: boolean;
  radiiColor?: RgbaTuple;
}

export interface SimplePoiConfiguration extends BasePoiConfiguration {
  poiType: PoiConfigurationTypes.Simple;
  symbolDefinition: MarkerSymbolDefinition;
}

function isSimple(config: PoiConfiguration) : config is SimplePoiConfiguration {
  return config.poiType === PoiConfigurationTypes.Simple;
}

function duplicateSimple(config: SimplePoiConfiguration) : SimplePoiConfiguration {
  return {
    ...config,
    labelDefinition: duplicateLabel(config.labelDefinition),
    symbolDefinition: duplicateMarker(config.symbolDefinition)
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
  return {
    ...config,
    labelDefinition: duplicateLabel(config.labelDefinition),
    breakDefinitions: config.breakDefinitions.map(bd => duplicateMarker(bd))
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
