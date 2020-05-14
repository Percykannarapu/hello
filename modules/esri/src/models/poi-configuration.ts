import { ColorPalette } from './color-palettes';
import { duplicateLabel, duplicateMarker, LabelDefinition, MarkerSymbolDefinition, UniqueValueMarkerDefinition } from './common-configuration';
import { markerStyleValues, RgbTuple } from './esri-types';

export enum PoiConfigurationTypes {
  Simple = 'Simple',
  Unique = 'Unique',
  // ClassBreak = 'ClassBreak',
  // HeatMap = 'HeatMap'
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
  showLabels?: boolean;
  labelDefinition?: LabelDefinition;
}

export interface SimplePoiConfiguration extends BasePoiConfiguration {
  poiType: PoiConfigurationTypes.Simple;
  symbolDefinition: MarkerSymbolDefinition;
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

function duplicateUnique(config: UniquePoiConfiguration) : UniquePoiConfiguration {
  return {
    ...config,
    labelDefinition: duplicateLabel(config.labelDefinition),
    breakDefinitions: config.breakDefinitions.map(bd => duplicateMarker(bd))
  };
}

export function duplicatePoiConfiguration(config: PoiConfiguration) : PoiConfiguration {
  if (config == null) return null;
  switch (config.poiType) {
    case PoiConfigurationTypes.Simple:
      return duplicateSimple(config);
    case PoiConfigurationTypes.Unique:
      return duplicateUnique(config);
  }
}

export type PoiConfiguration = SimplePoiConfiguration | UniquePoiConfiguration;

export function generateUniqueMarkerValues(sortedUniqueValues: string[], colorPalette: RgbTuple[]) : UniqueValueMarkerDefinition[] {
  return sortedUniqueValues.map((uv, i) => ({
    value: uv,
    color: RgbTuple.withAlpha(colorPalette[i % colorPalette.length], 1),
    markerType: markerStyleValues[i % markerStyleValues.length],
    legendName: uv,
    outlineColor: [255, 255, 255, 1],
    outlineWidth: 1
  }));
}
