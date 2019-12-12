import { Statistics } from '@val/common';
import { FillPattern, RgbaTuple, RgbTuple } from './esri-types';

export enum ConfigurationTypes {
  Simple = 'Simple',
  Unique = 'Unique',
  ClassBreak = 'ClassBreak',
  Ramp = 'Ramp',
  DotDensity = 'DotDensity'
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
  minValue: number;
  maxValue: number;
}

export interface UniqueValueDefinition extends SymbolDefinition {
  value: string;
}

export interface ContinuousDefinition {
  stopColor: RgbTuple;
  stopValue: number;
  stopName: string;
}

interface ShadingDefinitionBase {
  id: number;
  sourcePortalId: string;
  sortOrder: number;
  destinationLayerUniqueId?: string;
  layerName: string;
  legendHeader?: string;
  showLegendHeader: boolean;
  minScale: number;
  opacity: number;
  defaultSymbolDefinition: SymbolDefinition;
  filterByFeaturesOfInterest: boolean;
  filterField: string;
}

export interface SimpleShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Simple;
}

export interface UniqueShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Unique;
  arcadeExpression?: string;
  breakDefinitions?: UniqueValueDefinition[];
}

export interface RampShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Ramp;
  arcadeExpression?: string;
  breakDefinitions?: ContinuousDefinition[];
}

export interface ClassBreakShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.ClassBreak;
  arcadeExpression?: string;
  breakDefinitions?: ClassBreakDefinition[];
}

export type ShadingDefinition = SimpleShadingDefinition | UniqueShadingDefinition | RampShadingDefinition | ClassBreakShadingDefinition;

export function generateUniqueValues(uniqueValues: string[], palette: RgbTuple[]) : UniqueValueDefinition[] {
  const values = [...uniqueValues];
  values.sort();
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
  const themeCount = palette.length;
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
