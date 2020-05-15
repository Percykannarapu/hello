import { FillPattern, MarkerStyles, RgbaTuple, RgbTuple } from './esri-types';

export interface LabelDefinition {
  isBold: boolean;
  isItalic?: boolean;
  family?: string;
  size: number;
  usesStaticColor?: boolean;
  color: RgbaTuple;
  haloColor: RgbaTuple;
  featureAttribute?: string;
  customExpression?: string;
  where?: string;
}

export function duplicateLabel(label: LabelDefinition) : LabelDefinition {
  if (label == null) return null;
  return { ...label, color: RgbTuple.duplicate(label.color), haloColor: RgbTuple.duplicate(label.haloColor) };
}

export interface SymbolDefinition {
  outlineColor?: RgbaTuple;
  outlineWidth?: number;
  legendName?: string;
}

export interface FillSymbolDefinition extends SymbolDefinition {
  fillColor: RgbaTuple;
  fillType: FillPattern;
}

export interface ClassBreakFillDefinition extends FillSymbolDefinition {
  minValue?: number;
  maxValue?: number;
}

export interface UniqueValueFillDefinition extends FillSymbolDefinition {
  value: string;
}

export function duplicateFill<T extends FillSymbolDefinition>(symbol: T) : T {
  if (symbol == null) return null;
  return { ...symbol, outlineColor: RgbTuple.duplicate(symbol.outlineColor), fillColor: RgbTuple.duplicate(symbol.fillColor) };
}

export interface MarkerSymbolDefinition extends SymbolDefinition {
  color: RgbaTuple;
  size: number;
  markerType: MarkerStyles;
}

export interface ClassBreakMarkerDefinition extends MarkerSymbolDefinition {
  minValue?: number;
  maxValue?: number;
}

export interface UniqueValueMarkerDefinition extends MarkerSymbolDefinition {
  value: string;
}

export function duplicateMarker<T extends MarkerSymbolDefinition>(symbol: T) : T {
  if (symbol == null) return null;
  return { ...symbol, color: RgbTuple.duplicate(symbol.color), outlineColor: RgbTuple.duplicate(symbol.outlineColor) };
}

export interface ContinuousDefinition {
  stopColor: RgbTuple;
  stopValue: number;
  stopName: string;
}

export function duplicateContinuousDef(def: ContinuousDefinition) : ContinuousDefinition {
  return { ...def, stopColor: RgbTuple.duplicate(def.stopColor) };
}
