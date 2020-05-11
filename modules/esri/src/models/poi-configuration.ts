import { duplicateLabel, duplicateMarker, LabelDefinition, MarkerSymbolDefinition, UniqueValueMarkerDefinition } from './common-configuration';

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
