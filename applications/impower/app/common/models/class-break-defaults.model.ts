import { ClassBreakFillDefinition, ColorPalette, FillSymbolDefinition, getColorPalette, getFillPalette, RgbTuple } from '@val/esri';
import { FieldContentTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';

const indexDefaults: Partial<ClassBreakFillDefinition>[] = [
  { minValue: null, maxValue: 80, legendName: 'Below 80' },
  { minValue: 80, maxValue: 100, legendName: '80 to 100' },
  { minValue: 100, maxValue: 120, legendName: '100 to 120' },
  { minValue: 120, maxValue: null, legendName: '120 and above' }
];

const percentDefaults: Partial<ClassBreakFillDefinition>[] = [
  { minValue: null, maxValue: 25, legendName: 'Below 25%' },
  { minValue: 25, maxValue: 50, legendName: '25% to 50%' },
  { minValue: 50, maxValue: 75, legendName: '50% to 75%' },
  { minValue: 75, maxValue: null, legendName: '75% and above' }
];

export function getDefaultClassBreaks(fieldConte: FieldContentTypeCodes, theme: ColorPalette, reversePalette: boolean) : ClassBreakFillDefinition[] {
  const colorPalette = getColorPalette(theme, reversePalette);
  const fillPalette = getFillPalette(theme, reversePalette);
  const cm = colorPalette.length;
  const lm = fillPalette.length;
  if (fieldConte === FieldContentTypeCodes.Percent) {
    return percentDefaults.map((p, i) => ({ ...p, fillType: fillPalette[i % lm], fillColor: RgbTuple.withAlpha(colorPalette[i % cm], 1) } as ClassBreakFillDefinition));
  } else {
    return indexDefaults.map((p, i) => ({ ...p, fillType: fillPalette[i % lm], fillColor: RgbTuple.withAlpha(colorPalette[i % cm], 1) } as ClassBreakFillDefinition));
  }
}

export function getDefaultUserBreaks(count: number, breakPrefix: string, theme: ColorPalette, reversePalette: boolean) : FillSymbolDefinition[] {
  const colorPalette = getColorPalette(theme, reversePalette);
  const fillPalette = getFillPalette(theme, reversePalette);
  const cm = colorPalette.length;
  const lm = fillPalette.length;
  const result: FillSymbolDefinition[] = [];
  for (let i = 0; i < count; ++i) {
    result.push({
      fillColor: RgbTuple.withAlpha(colorPalette[i % cm], 1),
      fillType: fillPalette[i % lm],
      legendName: `${breakPrefix} ${i + 1}`
    });
  }
  return result;
}
