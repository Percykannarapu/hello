import { Statistics } from '@val/common';
import { ColorPalette } from './color-palettes';
import { FillPattern, RgbaTuple, RgbTuple } from './esri-types';

export enum ConfigurationTypes {
  Simple = 'Simple',
  Unique = 'Unique',
  ClassBreak = 'ClassBreak',
  Ramp = 'Ramp',
  DotDensity = 'DotDensity'
}

export enum DynamicAllocationTypes {
  Interval = 'interval',
  ClassCount = 'class-count'
}

export interface RampProperties extends __esri.ColorVariableProperties {
  type: 'color';
}

export interface SymbolDefinition {
  fillColor: RgbaTuple;
  fillType: FillPattern;
  outlineColor?: RgbaTuple;
  legendName?: string;
}

export interface ClassBreakDefinition extends SymbolDefinition {
  minValue?: number;
  maxValue?: number;
}

export interface UniqueValueDefinition extends SymbolDefinition {
  value: string;
}

export interface ContinuousDefinition {
  stopColor: RgbTuple;
  stopValue: number;
  stopName: string;
}

export interface ShadingDefinitionBase {
  id: string;
  dataKey: string;
  sourcePortalId: string;
  sortOrder: number;
  destinationLayerUniqueId?: string;
  layerName: string;
  minScale: number;
  opacity: number;
  visible: boolean;
  defaultSymbolDefinition: SymbolDefinition;
  filterByFeaturesOfInterest: boolean;
  filterField: string;
}

export interface SimpleShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Simple;
}

export interface UniqueShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Unique;
  secondaryDataKey: string;
  theme: ColorPalette;
  reverseTheme: boolean;
  arcadeExpression?: string;
  breakDefinitions?: UniqueValueDefinition[];
}

export interface RampShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Ramp;
  theme: ColorPalette;
  reverseTheme: boolean;
  arcadeExpression?: string;
  breakDefinitions?: ContinuousDefinition[];
}

export interface ClassBreakShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.ClassBreak;
  theme: ColorPalette;
  reverseTheme: boolean;
  dynamicallyAllocate?: boolean;
  dynamicAllocationType?: DynamicAllocationTypes;
  dynamicAllocationSlots?: number;
  arcadeExpression?: string;
  breakDefinitions?: ClassBreakDefinition[];
}

export interface DotDensityShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.DotDensity;
  dotValue: number;
  legendUnits: string;
  dotColor: RgbaTuple;
  arcadeExpression?: string;
}

export type ComplexShadingDefinition = UniqueShadingDefinition | RampShadingDefinition | ClassBreakShadingDefinition;
export type ShadingDefinition = SimpleShadingDefinition | ComplexShadingDefinition | DotDensityShadingDefinition;

export function isComplexShadingDefinition(s: ShadingDefinition) : s is ComplexShadingDefinition {
  return s.shadingType === ConfigurationTypes.Unique ||
         s.shadingType === ConfigurationTypes.Ramp ||
         s.shadingType === ConfigurationTypes.ClassBreak;
}

export function generateUniqueValues(uniqueValues: string[], palette: RgbTuple[], customSorter?: (a, b) => number) : UniqueValueDefinition[] {
  const values = [...uniqueValues];
  if (customSorter != null) {
    values.sort(customSorter);
  } else {
    values.sort();
  }
  let i = 0;
  return values.map((uv) => {
    return {
      fillColor: RgbTuple.withAlpha(palette[i++ % palette.length], 1),
      fillType: 'solid',
      legendName: uv,
      outlineColor: [0, 0, 0, 0],
      value: uv
    };
  });
}

export function generateContinuousValues(stats: Statistics, palette: RgbTuple[]) : ContinuousDefinition[] {
  const result: ContinuousDefinition[] = [];
  const round = (n: number) => Math.round(n * 100) / 100;
  const mean = stats.mean;
  const std = stats.stdDeviation;
  const themeCount = Math.min(palette.length, 8); // 8 is an esri API hard limit
  const stepSize = 2 / (themeCount - 1);
  const multipliers: number[] = new Array<number>(palette.length);
  multipliers[0] = -1;
  result.push({ stopColor: palette[0], stopValue: mean - std, stopName: `< ${round(mean - std)}` });
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
    result.push({ stopColor: palette[n], stopValue: currentValue, stopName: currentLabel });
  }
  return result;
}

export function generateDynamicClassBreaks(stats: Statistics, palette: RgbTuple[], breakTypes: DynamicAllocationTypes) : ClassBreakDefinition[] {
  const result: ClassBreakDefinition[] = [];
  const breakValues = breakTypes === DynamicAllocationTypes.Interval ? stats.meanIntervals : stats.quantiles;
  breakValues.forEach((bv, i) => {
    const b: ClassBreakDefinition = {
      maxValue: bv,
      fillColor: RgbTuple.withAlpha(palette[i % palette.length], 1),
      fillType: 'solid',
      outlineColor: [0, 0, 0, 0]
    };
    if (i === 0) {
      // first break
      b.minValue = null;
      b.legendName = `< ${b.maxValue.toFixed(0)}`;
    } else {
      // intermediate breaks
      b.minValue = breakValues[i - 1] + Number.EPSILON;
      b.legendName = `${b.minValue.toFixed(0)} - ${b.maxValue.toFixed(0)}`;
    }
    result.push(b);
  });
  const lastBreak: ClassBreakDefinition = {
    minValue: breakValues[breakValues.length - 1] + Number.EPSILON,
    maxValue: null,
    fillColor: RgbTuple.withAlpha(palette[breakValues.length % palette.length], 1),
    fillType: 'solid',
    outlineColor: [0, 0, 0, 0],
    legendName: `> ${breakValues[breakValues.length - 1].toFixed(0)}`
  };
  result.push(lastBreak);
  return result;
}
