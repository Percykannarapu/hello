import { LabelDefinition, MarkerSymbolDefinition, UniqueValueMarkerDefinition } from './common-configuration';

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

export interface UniquePoiConfiguration extends BasePoiConfiguration {
  poiType: PoiConfigurationTypes.Unique;
  breakDefinitions: UniqueValueMarkerDefinition[];
}

export type PoiConfiguration = SimplePoiConfiguration | UniquePoiConfiguration;
