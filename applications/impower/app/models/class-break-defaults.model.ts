import { ClassBreakDefinition, ColorPalette, getColorPalette, RgbTuple } from '@val/esri';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import { getFillPalette } from '../../../../modules/esri/src/models/color-palettes';

const indexDefaults: Partial<ClassBreakDefinition>[] = [
  { minValue: null, maxValue: 80, legendName: 'Below 80' },
  { minValue: 80, maxValue: 100, legendName: '80 to 100' },
  { minValue: 100, maxValue: 120, legendName: '100 to 120' },
  { minValue: 120, maxValue: null, legendName: '120 and above' }
];

const percentDefaults: Partial<ClassBreakDefinition>[] = [
  { minValue: null, maxValue: 25, legendName: 'Below 25%' },
  { minValue: 25, maxValue: 50, legendName: '25% to 50%' },
  { minValue: 50, maxValue: 75, legendName: '50% to 75%' },
  { minValue: 75, maxValue: null, legendName: '75% and above' }
];

export function getDefaultClassBreaks(fieldConte: FieldContentTypeCodes, theme: ColorPalette) : ClassBreakDefinition[] {
  const colorPalette = getColorPalette(theme, false);
  const fillPalette = getFillPalette(theme, false);
  const cm = colorPalette.length;
  const lm = fillPalette.length;
  if (fieldConte === FieldContentTypeCodes.Percent) {
    return percentDefaults.map((p, i) => ({ ...p, fillType: fillPalette[i % lm], fillColor: RgbTuple.withAlpha(colorPalette[i % cm], 1) } as ClassBreakDefinition));
  } else {
    return indexDefaults.map((p, i) => ({ ...p, fillType: fillPalette[i % lm], fillColor: RgbTuple.withAlpha(colorPalette[i % cm], 1) } as ClassBreakDefinition));
  }
}
