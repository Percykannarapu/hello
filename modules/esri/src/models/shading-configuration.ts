import { Statistics } from '@val/common';
import { ColorPalette } from './color-palettes';
import {
  ClassBreakFillDefinition,
  ContinuousDefinition,
  duplicateContinuousDef,
  duplicateFill,
  FillSymbolDefinition,
  UniqueValueFillDefinition
} from './common-configuration';
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
  defaultSymbolDefinition: FillSymbolDefinition;
  filterByFeaturesOfInterest: boolean;
  filterField: string;
  refreshLegendOnRedraw?: boolean;
}

function duplicateBase(def: ShadingDefinitionBase) : ShadingDefinitionBase {
  if (def == null) return null;
  return {
    ...def,
    defaultSymbolDefinition: duplicateFill(def.defaultSymbolDefinition)
  };
}

export interface SimpleShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Simple;
}

function duplicateSimple(def: SimpleShadingDefinition) : SimpleShadingDefinition {
  if (def == null) return null;
  return {
    ...def,
    defaultSymbolDefinition: duplicateFill(def.defaultSymbolDefinition)
  };
}

export interface UniqueShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Unique;
  secondaryDataKey: string;
  theme: ColorPalette;
  reverseTheme: boolean;
  arcadeExpression?: string;
  breakDefinitions?: UniqueValueFillDefinition[];
}

function duplicateUnique(def: UniqueShadingDefinition) : UniqueShadingDefinition {
  if (def == null) return null;
  return {
    ...def,
    defaultSymbolDefinition: duplicateFill(def.defaultSymbolDefinition),
    breakDefinitions: (def.breakDefinitions || []).map(d => duplicateFill(d))
  };
}

export interface RampShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.Ramp;
  theme: ColorPalette;
  reverseTheme: boolean;
  arcadeExpression?: string;
  breakDefinitions?: ContinuousDefinition[];
}

function duplicateRamp(def: RampShadingDefinition) : RampShadingDefinition {
  if (def == null) return null;
  return {
    ...def,
    defaultSymbolDefinition: duplicateFill(def.defaultSymbolDefinition),
    breakDefinitions: (def.breakDefinitions || []).map(d => duplicateContinuousDef(d))
  };
}

export interface ClassBreakShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.ClassBreak;
  theme: ColorPalette;
  reverseTheme: boolean;
  dynamicallyAllocate?: boolean;
  dynamicAllocationType?: DynamicAllocationTypes;
  dynamicAllocationSlots?: number;
  dynamicLegend?: boolean;
  arcadeExpression?: string;
  userBreakDefaults?: FillSymbolDefinition[];
  breakDefinitions?: ClassBreakFillDefinition[];
}

function duplicateClassBreak(def: ClassBreakShadingDefinition) : ClassBreakShadingDefinition {
  if (def == null) return null;
  return {
    ...def,
    defaultSymbolDefinition: duplicateFill(def.defaultSymbolDefinition),
    breakDefinitions: (def.breakDefinitions || []).map(d => duplicateFill(d)),
    userBreakDefaults: (def.userBreakDefaults || []).map(d => duplicateFill(d))
  };
}

export interface DotDensityShadingDefinition extends ShadingDefinitionBase {
  shadingType: ConfigurationTypes.DotDensity;
  dotValue: number;
  legendUnits: string;
  dotColor: RgbaTuple;
  arcadeExpression?: string;
}

function duplicateDotDensity(def: DotDensityShadingDefinition) : DotDensityShadingDefinition {
  if (def == null) return null;
  return {
    ...def,
    defaultSymbolDefinition: duplicateFill(def.defaultSymbolDefinition),
    dotColor: RgbTuple.duplicate(def.dotColor)
  };
}

export type ComplexShadingDefinition = UniqueShadingDefinition | RampShadingDefinition | ClassBreakShadingDefinition;
export type ShadingDefinition = SimpleShadingDefinition | ComplexShadingDefinition | DotDensityShadingDefinition;

export function duplicateShadingDefinition(def: ShadingDefinition) : ShadingDefinition {
  if (def == null) return null;
  switch (def.shadingType) {
    case ConfigurationTypes.Simple:
      return duplicateSimple(def);
    case ConfigurationTypes.Unique:
      return duplicateUnique(def);
    case ConfigurationTypes.Ramp:
      return duplicateRamp(def);
    case ConfigurationTypes.ClassBreak:
      return duplicateClassBreak(def);
    case ConfigurationTypes.DotDensity:
      return duplicateDotDensity(def);
    default:
      return duplicateBase(def) as ShadingDefinition;
  }
}

export function isArcadeCapableShadingDefinition(s: ShadingDefinition) : s is ComplexShadingDefinition | DotDensityShadingDefinition {
  return isComplexShadingDefinition(s) || s.shadingType === ConfigurationTypes.DotDensity;
}

export function isComplexShadingDefinition(s: ShadingDefinition) : s is ComplexShadingDefinition {
  return s.shadingType === ConfigurationTypes.Unique ||
         s.shadingType === ConfigurationTypes.Ramp ||
         s.shadingType === ConfigurationTypes.ClassBreak;
}

export function generateUniqueValues(sortedUniqueValues: string[], colorPalette: RgbTuple[], fillPalette: FillPattern[], useIndexForValue: boolean = false, valuesToKeep?: Set<string>) : UniqueValueFillDefinition[] {
  const needsOffset = (fillPalette.length % colorPalette.length) === 0;
  return sortedUniqueValues.map((uv, i) => {
    const offset = needsOffset ? Math.floor(i / colorPalette.length) : 0;
    const currentColor = colorPalette[(i + offset) % colorPalette.length];
    return {
      value: useIndexForValue ? `${i}` : uv,
      fillColor: RgbTuple.withAlpha(currentColor, 1),
      fillType: fillPalette[i % fillPalette.length],
      legendName: uv,
      outlineColor: [0, 0, 0, 0],
      isHidden: valuesToKeep == null ? false : !valuesToKeep.has(uv)
    };
  });
}

export function generateContinuousValues(stats: Statistics, colorPalette: RgbTuple[]) : ContinuousDefinition[] {
  const result: ContinuousDefinition[] = [];
  const round = (n: number) => Math.round(n * 100) / 100;
  const mean = stats.mean;
  const std = stats.stdDeviation;
  const themeCount = Math.min(colorPalette.length, 8); // 8 is an esri API hard limit
  const stepSize = 2 / (themeCount - 1);
  const multipliers: number[] = new Array<number>(colorPalette.length);
  multipliers[0] = -1;
  result.push({ stopColor: colorPalette[0], stopValue: mean - std, stopName: `< ${round(mean - std)}` });
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
    result.push({ stopColor: colorPalette[n], stopValue: currentValue, stopName: currentLabel });
  }
  return result;
}

export function generateDynamicSymbology(stats: Statistics, colorPalette: RgbTuple[], fillPalette: FillPattern[]) : FillSymbolDefinition[] {
  const result: FillSymbolDefinition[] = [];
  const len = stats.meanIntervals.length;
  const cm = colorPalette.length;
  const lm = fillPalette.length;
  for (let i = 0; i < stats.meanIntervals.length; ++i) {
    result.push({
      fillColor: RgbTuple.withAlpha(colorPalette[i % cm], 1),
      fillType: fillPalette[i % lm],
      outlineColor: [0, 0, 0, 0]
    });
  }
  const lastBreak: FillSymbolDefinition = {
    fillColor: RgbTuple.withAlpha(colorPalette[len % cm], 1),
    fillType: fillPalette[len % lm],
    outlineColor: [0, 0, 0, 0]
  };
  result.push(lastBreak);
  return result;
}

function getLegendDescription(min: number, max: number, fixedPositions: number) : string {
  if (min == null && max == null) return 'other';
  if (min == null) {
    return `Below ${max.toFixed(fixedPositions)}`;
  }
  if (max == null) {
    return `${min.toFixed(fixedPositions)} and above`;
  }
  return `${min.toFixed(fixedPositions)} to ${max.toFixed(fixedPositions)}`;
}

export function generateDynamicClassBreaks(stats: Statistics, breakTypes: DynamicAllocationTypes, symbology: FillSymbolDefinition[]) : ClassBreakFillDefinition[] {
  const result: ClassBreakFillDefinition[] = [];
  const breakValues = breakTypes === DynamicAllocationTypes.Interval ? stats.meanIntervals : stats.quantiles;
  if (symbology.length !== (breakValues.length + 1)) {
    console.error('There was a mismatch between the statistics breaks and the symbology breaks', stats, symbology);
    return [];
  }
  const fixedPositions = stats.max > 10 ? 0 :
                         stats.max > 5  ? 1 : 2;
  breakValues.forEach((bv, i) => {
    const currentMin = i === 0 ? null : breakValues[i - 1] + Number.EPSILON;
    const legendDescription = getLegendDescription(currentMin, bv, fixedPositions);
    const userLegendIsEmpty = symbology[i].legendName == null || symbology[i].legendName.trim().length == 0;
    result.push({
      minValue: currentMin,
      maxValue: bv,
      ...symbology[i],
      legendName: userLegendIsEmpty ? legendDescription : `${symbology[i].legendName.trim()} (${legendDescription})`
    });
  });
  const finalMin = breakValues[breakValues.length - 1] + Number.EPSILON;
  const finalDescription = getLegendDescription(finalMin, null, fixedPositions);
  const finalLegendIsEmpty = symbology[symbology.length - 1].legendName == null || symbology[symbology.length - 1].legendName.trim().length == 0;
  result.push({
    minValue: breakValues[breakValues.length - 1] + Number.EPSILON,
    maxValue: null,
    ...symbology[breakValues.length],
    legendName: finalLegendIsEmpty ? finalDescription : `${symbology[symbology.length - 1].legendName.trim()} (${finalDescription})`
  });
  return result;
}

