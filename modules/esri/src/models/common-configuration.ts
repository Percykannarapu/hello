import { FillPattern, MarkerStyles, RgbaTuple, RgbTuple } from './esri-types';

export interface LabelDefinition {
  isBold: boolean;
  size: number;
  color: RgbaTuple;
  haloColor: RgbaTuple;
  featureAttribute: string;
}

export interface SymbolDefinition {
  outlineColor?: RgbaTuple;
  legendName?: string;
}

export interface FillSymbolDefinition extends SymbolDefinition {
  fillColor: RgbaTuple;
  fillType: FillPattern;
}

export interface MarkerSymbolDefinition extends SymbolDefinition {
  color: RgbaTuple;
  markerType: MarkerStyles;
}

export interface ClassBreakFillDefinition extends FillSymbolDefinition {
  minValue?: number;
  maxValue?: number;
}

export interface UniqueValueFillDefinition extends FillSymbolDefinition {
  value: string;
}

export interface ClassBreakMarkerDefinition extends MarkerSymbolDefinition {
  minValue?: number;
  maxValue?: number;
}

export interface UniqueValueMarkerDefinition extends MarkerSymbolDefinition {
  value: string;
}

export interface ContinuousDefinition {
  stopColor: RgbTuple;
  stopValue: number;
  stopName: string;
}
