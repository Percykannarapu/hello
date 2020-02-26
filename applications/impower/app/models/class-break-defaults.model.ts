import { ClassBreakDefinition, ColorPalette, getColorPalette, RgbTuple } from '@val/esri';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';

const indexDefaults: Partial<ClassBreakDefinition>[] = [
  { fillType: 'solid', minValue: null, maxValue: 80, legendName: 'Below 80' },
  { fillType: 'solid', minValue: 80, maxValue: 100, legendName: '80 to 100' },
  { fillType: 'solid', minValue: 100, maxValue: 120, legendName: '100 to 120' },
  { fillType: 'solid', minValue: 120, maxValue: null, legendName: '120 and above' }
];

const percentDefaults: Partial<ClassBreakDefinition>[] = [
  { fillType: 'solid', minValue: null, maxValue: 25, legendName: 'Below 25%' },
  { fillType: 'solid', minValue: 25, maxValue: 50, legendName: '25% to 50%' },
  { fillType: 'solid', minValue: 50, maxValue: 75, legendName: '50% to 75%' },
  { fillType: 'solid', minValue: 75, maxValue: null, legendName: '75% and above' }
];

export function getDefaultClassBreaks(fieldConte: FieldContentTypeCodes, theme: ColorPalette) : ClassBreakDefinition[] {
  const palette = getColorPalette(theme, false);
  const m = palette.length;
  if (fieldConte === FieldContentTypeCodes.Percent) {
    return percentDefaults.map((p, i) => ({ ...p, fillColor: RgbTuple.withAlpha(palette[i % m], 1) } as ClassBreakDefinition));
  } else {
    return indexDefaults.map((p, i) => ({ ...p, fillColor: RgbTuple.withAlpha(palette[i % m], 1) } as ClassBreakDefinition));
  }
}
